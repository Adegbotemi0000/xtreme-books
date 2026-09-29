const { pool } = require("../../db/pool");

async function list(tenantId) {
  const { rows } = await pool.query(
    "SELECT * FROM customers WHERE tenant_id = $1 AND deleted_at IS NULL ORDER BY name",
    [tenantId]
  );
  return rows;
}

async function findById(tenantId, id) {
  const { rows } = await pool.query(
    "SELECT * FROM customers WHERE tenant_id = $1 AND id = $2 AND deleted_at IS NULL",
    [tenantId, id]
  );
  return rows[0];
}

async function create(tenantId, { name, tin, email, phone, address }) {
  const { rows } = await pool.query(
    `INSERT INTO customers (tenant_id, name, tin, email, phone, address)
     VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
    [tenantId, name, tin || null, email || null, phone || null, address || null]
  );
  return rows[0];
}

async function update(tenantId, id, { name, tin, email, phone, address, isActive }) {
  const { rows } = await pool.query(
    `UPDATE customers SET name = $1, tin = $2, email = $3, phone = $4, address = $5, is_active = $6
     WHERE tenant_id = $7 AND id = $8 AND deleted_at IS NULL RETURNING *`,
    [name, tin || null, email || null, phone || null, address || null, isActive ?? true, tenantId, id]
  );
  return rows[0];
}

// Never hard-deleted — archived into Trash, recoverable by a tenant admin.
async function softDelete(tenantId, id, userId) {
  const { rows } = await pool.query(
    `UPDATE customers SET deleted_at = now(), deleted_by = $1
     WHERE tenant_id = $2 AND id = $3 AND deleted_at IS NULL RETURNING *`,
    [userId, tenantId, id]
  );
  return rows[0];
}

module.exports = { list, findById, create, update, softDelete };
