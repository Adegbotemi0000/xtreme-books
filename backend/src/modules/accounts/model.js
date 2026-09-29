const { pool } = require("../../db/pool");

async function list(tenantId) {
  const { rows } = await pool.query(
    "SELECT * FROM accounts WHERE tenant_id = $1 AND deleted_at IS NULL ORDER BY name",
    [tenantId]
  );
  return rows;
}

async function create(tenantId, { name, type, openingBalance }) {
  const { rows } = await pool.query(
    `INSERT INTO accounts (tenant_id, name, type, opening_balance) VALUES ($1, $2, $3, $4) RETURNING *`,
    [tenantId, name, type || "bank", openingBalance || 0]
  );
  return rows[0];
}

async function statement(tenantId, accountId) {
  const { rows } = await pool.query(
    `SELECT date, direction, amount, method, reference FROM payments
     WHERE tenant_id = $1 AND account_id = $2 AND is_reversed = false ORDER BY date`,
    [tenantId, accountId]
  );
  return rows;
}

module.exports = { list, create, statement };
