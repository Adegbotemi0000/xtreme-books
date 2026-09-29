const { pool } = require("../../db/pool");

async function list(tenantId) {
  const { rows } = await pool.query(
    "SELECT * FROM products WHERE tenant_id = $1 AND deleted_at IS NULL ORDER BY name",
    [tenantId]
  );
  return rows;
}

async function findById(tenantId, id) {
  const { rows } = await pool.query(
    "SELECT * FROM products WHERE tenant_id = $1 AND id = $2 AND deleted_at IS NULL",
    [tenantId, id]
  );
  return rows[0];
}

async function create(tenantId, { name, sku, unitPrice, cost, vatRate, reorderLevel }) {
  const { rows } = await pool.query(
    `INSERT INTO products (tenant_id, name, sku, unit_price, cost, vat_rate, reorder_level)
     VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
    [tenantId, name, sku || null, unitPrice || 0, cost || 0, vatRate ?? 7.5, reorderLevel || 0]
  );
  return rows[0];
}

async function update(tenantId, id, { name, sku, unitPrice, cost, vatRate, reorderLevel, isActive }) {
  const { rows } = await pool.query(
    `UPDATE products SET name = $1, sku = $2, unit_price = $3, cost = $4, vat_rate = $5,
       reorder_level = $6, is_active = $7
     WHERE tenant_id = $8 AND id = $9 AND deleted_at IS NULL RETURNING *`,
    [name, sku || null, unitPrice || 0, cost || 0, vatRate ?? 7.5, reorderLevel || 0, isActive ?? true, tenantId, id]
  );
  return rows[0];
}

async function softDelete(tenantId, id, userId) {
  const { rows } = await pool.query(
    `UPDATE products SET deleted_at = now(), deleted_by = $1
     WHERE tenant_id = $2 AND id = $3 AND deleted_at IS NULL RETURNING *`,
    [userId, tenantId, id]
  );
  return rows[0];
}

async function adjustStock(tenantId, id, deltaQuantity) {
  const { rows } = await pool.query(
    `UPDATE products SET stock_quantity = stock_quantity + $1 WHERE tenant_id = $2 AND id = $3 RETURNING *`,
    [deltaQuantity, tenantId, id]
  );
  return rows[0];
}

module.exports = { list, findById, create, update, softDelete, adjustStock };
