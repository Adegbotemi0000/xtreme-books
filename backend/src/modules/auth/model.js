const { pool } = require("../../db/pool");
const bcrypt = require("bcrypt");
const { seedDefaultChartOfAccounts } = require("../glAccounts/model");

function generateVerificationCode() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

// Every tenant gets its own admin at signup — no shared/single admin login,
// unlike xtreme-finance-system. See docs/04-data-model.md "What's
// deliberately not copied". The new admin is created unverified — a 6-digit
// code must be confirmed (verifyEmail) before login is possible.
async function signupTenant({ companyName, cacNumber, tin, adminName, adminEmail, password }) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const tenant = await client.query(
      `INSERT INTO tenants (name, cac_number, tin) VALUES ($1, $2, $3) RETURNING *`,
      [companyName, cacNumber || null, tin || null]
    );
    const tenantId = tenant.rows[0].id;

    const passwordHash = await bcrypt.hash(password, 12);
    const code = generateVerificationCode();
    const user = await client.query(
      `INSERT INTO users (tenant_id, name, email, password_hash, role, verification_code, verification_expires_at)
       VALUES ($1, $2, $3, $4, 'tenant_admin', $5, now() + interval '15 minutes') RETURNING *`,
      [tenantId, adminName, adminEmail.toLowerCase(), passwordHash, code]
    );

    await seedDefaultChartOfAccounts(client, tenantId);

    for (const code of ["vat", "paye"]) {
      await client.query(
        `INSERT INTO tax_types (tenant_id, code, is_enabled) VALUES ($1, $2, true)`,
        [tenantId, code]
      );
    }
    await client.query(
      `INSERT INTO tax_types (tenant_id, code, is_enabled) VALUES ($1, 'wht', false), ($1, 'cit', false)`,
      [tenantId]
    );

    await client.query("COMMIT");
    return { tenant: tenant.rows[0], user: user.rows[0] };
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

async function findByEmail(email) {
  const { rows } = await pool.query("SELECT * FROM users WHERE email = $1", [email.toLowerCase()]);
  return rows[0];
}

async function verifyEmailCode(email, code) {
  const { rows } = await pool.query(
    `UPDATE users SET email_verified = true, verification_code = NULL, verification_expires_at = NULL
     WHERE email = $1 AND verification_code = $2 AND verification_expires_at > now()
     RETURNING *`,
    [email.toLowerCase(), code]
  );
  return rows[0];
}

async function regenerateVerificationCode(email) {
  const code = generateVerificationCode();
  const { rows } = await pool.query(
    `UPDATE users SET verification_code = $1, verification_expires_at = now() + interval '15 minutes'
     WHERE email = $2 AND email_verified = false RETURNING *`,
    [code, email.toLowerCase()]
  );
  return rows[0] ? code : null;
}

async function findById(id) {
  const { rows } = await pool.query("SELECT * FROM users WHERE id = $1", [id]);
  return rows[0];
}

async function setOtpSecret(userId, secret) {
  await pool.query("UPDATE users SET otp_secret = $1 WHERE id = $2", [secret, userId]);
}

async function enableOtp(userId) {
  await pool.query("UPDATE users SET otp_enabled = true WHERE id = $1", [userId]);
}

async function disableOtp(userId) {
  await pool.query("UPDATE users SET otp_enabled = false, otp_secret = NULL WHERE id = $1", [userId]);
}

module.exports = {
  signupTenant,
  findByEmail,
  findById,
  verifyEmailCode,
  regenerateVerificationCode,
  setOtpSecret,
  enableOtp,
  disableOtp,
};
