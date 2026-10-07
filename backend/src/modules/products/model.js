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

// branchId is optional: every adjustment always moves the tenant-wide total
// (every other write path — POS, Production — targets that same column, so
// it has to stay the source of truth), and when a branch is given, the same
// delta also moves that branch's row in product_branch_stock, building up a
// real per-branch breakdown over time without requiring every caller to
// specify one.
async function adjustStock(tenantId, id, deltaQuantity, branchId) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const { rows } = await client.query(
      "UPDATE products SET stock_quantity = stock_quantity + $1 WHERE tenant_id = $2 AND id = $3 RETURNING *",
      [deltaQuantity, tenantId, id]
    );
    if (branchId) {
      await client.query(
        `INSERT INTO product_branch_stock (tenant_id, product_id, branch_id, quantity)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (product_id, branch_id) DO UPDATE SET quantity = product_branch_stock.quantity + $4`,
        [tenantId, id, branchId, deltaQuantity]
      );
    }
    await client.query("COMMIT");
    return rows[0];
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

// One row per product x branch that has ever been allocated, plus an
// "Unallocated" pseudo-row per product for whatever's left over
// (stock_quantity minus the sum of its branch rows) — so the total always
// reconciles back to the same stock_quantity Inventory/POS/Production read,
// and stock nobody's assigned to a branch yet stays visible instead of
// silently vanishing from the report.
async function listStockByBranch(tenantId) {
  const { rows: products } = await pool.query(
    "SELECT id, name, sku, stock_quantity FROM products WHERE tenant_id = $1 AND deleted_at IS NULL ORDER BY name",
    [tenantId]
  );
  const { rows: branchRows } = await pool.query(
    `SELECT pbs.product_id, pbs.branch_id, b.name AS branch_name, pbs.quantity
     FROM product_branch_stock pbs JOIN branches b ON b.id = pbs.branch_id
     WHERE pbs.tenant_id = $1 ORDER BY b.name`,
    [tenantId]
  );

  const byProduct = {};
  for (const r of branchRows) (byProduct[r.product_id] ||= []).push(r);

  return products.map((p) => {
    const branches = byProduct[p.id] || [];
    const allocated = branches.reduce((sum, b) => sum + Number(b.quantity), 0);
    return {
      productId: p.id,
      productName: p.name,
      sku: p.sku,
      totalStock: Number(p.stock_quantity),
      branches: branches.map((b) => ({ branchId: b.branch_id, branchName: b.branch_name, quantity: Number(b.quantity) })),
      unallocated: Number(p.stock_quantity) - allocated,
    };
  });
}

module.exports = { list, findById, create, update, softDelete, adjustStock, listStockByBranch };
