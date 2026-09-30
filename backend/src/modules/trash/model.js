const { pool } = require("../../db/pool");

// One reusable pattern across every deletable entity, matching
// xtreme-finance-system's Trash module — normal module queries filter
// deleted_at IS NULL; nothing is ever hard-deleted. labelColumn covers the
// entities whose human-readable field isn't called "name" (Expenses and
// Recurring Expenses use "description").
const TABLES = {
  customer: { table: "customers", labelColumn: "name" },
  product: { table: "products", labelColumn: "name" },
  supplier: { table: "suppliers", labelColumn: "name" },
  staff: { table: "staff", labelColumn: "name" },
  expense: { table: "expenses", labelColumn: "description" },
  recurring_expense: { table: "recurring_expenses", labelColumn: "description" },
};

async function list(tenantId) {
  const results = [];
  for (const [entityType, { table, labelColumn }] of Object.entries(TABLES)) {
    const { rows } = await pool.query(
      `SELECT id, ${labelColumn} AS name, deleted_at, deleted_by FROM ${table} WHERE tenant_id = $1 AND deleted_at IS NOT NULL`,
      [tenantId]
    );
    results.push(...rows.map((r) => ({ ...r, entityType })));
  }
  return results.sort((a, b) => new Date(b.deleted_at) - new Date(a.deleted_at));
}

async function restore(tenantId, entityType, id) {
  const entry = TABLES[entityType];
  if (!entry) throw Object.assign(new Error("Unknown entity type"), { status: 422 });
  const { rows } = await pool.query(
    `UPDATE ${entry.table} SET deleted_at = NULL, deleted_by = NULL WHERE tenant_id = $1 AND id = $2 RETURNING *`,
    [tenantId, id]
  );
  return rows[0];
}

module.exports = { list, restore };
