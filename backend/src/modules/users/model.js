const { pool } = require("../../db/pool");
const bcrypt = require("bcrypt");

const VALID_ROLES = ["tenant_admin", "accountant", "sales_operations", "management"];

async function list(tenantId) {
  const { rows } = await pool.query(
    "SELECT id, name, email, role, is_active, otp_enabled, created_at FROM users WHERE tenant_id = $1 ORDER BY created_at",
    [tenantId]
  );
  return rows;
}

async function create(tenantId, { name, email, role, password }) {
  if (!VALID_ROLES.includes(role)) {
    throw Object.assign(new Error(`Invalid role: ${role}`), { status: 422 });
  }
  const passwordHash = await bcrypt.hash(password, 12);
  const { rows } = await pool.query(
    `INSERT INTO users (tenant_id, name, email, password_hash, role)
     VALUES ($1, $2, $3, $4, $5) RETURNING id, name, email, role, is_active, created_at`,
    [tenantId, name, email.toLowerCase(), passwordHash, role]
  );
  return rows[0];
}

async function setActive(tenantId, userId, isActive) {
  const { rows } = await pool.query(
    `UPDATE users SET is_active = $1 WHERE tenant_id = $2 AND id = $3
     RETURNING id, name, email, role, is_active`,
    [isActive, tenantId, userId]
  );
  return rows[0];
}

module.exports = { VALID_ROLES, list, create, setActive };
