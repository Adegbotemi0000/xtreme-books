const { pool } = require("../../db/pool");
const { postExpenseRecorded } = require("../journals/postingRules");
const { reverseEntriesForSource } = require("../journals/model");

async function list(tenantId) {
  const { rows } = await pool.query(
    `SELECT e.*, c.name AS category_name, a.name AS account_name FROM expenses e
     LEFT JOIN categories c ON c.id = e.category_id
     LEFT JOIN accounts a ON a.id = e.account_id
     WHERE e.tenant_id = $1 AND e.deleted_at IS NULL ORDER BY e.date DESC, e.id DESC`,
    [tenantId]
  );
  return rows;
}

// Expenses are recorded as already-paid (no draft state, unlike invoices/
// purchases) so they post to the GL immediately, in the same transaction as
// the row insert — matches the ground rule that every transaction flows
// into the GL automatically, with zero exceptions.
async function create(tenantId, { categoryId, description, amount, date, paymentMethod, accountId }, userId) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const { rows } = await client.query(
      `INSERT INTO expenses (tenant_id, category_id, description, amount, date, payment_method, account_id, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [tenantId, categoryId || null, description, amount, date, paymentMethod || "cash", accountId, userId]
    );

    await postExpenseRecorded(
      client,
      { tenantId, expenseId: rows[0].id, date, amount, accountId },
      userId
    );

    await client.query("COMMIT");
    return rows[0];
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

// Reverses the GL posting in the same transaction as the archive, so an
// archived expense never leaves a dangling entry in the books.
async function archive(tenantId, id, userId) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const { rows } = await client.query(
      `UPDATE expenses SET deleted_at = now() WHERE tenant_id = $1 AND id = $2 AND deleted_at IS NULL RETURNING *`,
      [tenantId, id]
    );
    if (rows[0]) {
      await reverseEntriesForSource(client, tenantId, "expense", id, userId, "Expense archived");
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

module.exports = { list, create, archive };
