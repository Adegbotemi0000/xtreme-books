const { pool } = require("../../db/pool");
const { postPurchaseApproved, postSupplierPaymentMade } = require("../journals/postingRules");

async function list(tenantId) {
  const { rows } = await pool.query(
    `SELECT p.*, s.name AS supplier_name FROM purchases p
     JOIN suppliers s ON s.id = p.supplier_id
     WHERE p.tenant_id = $1 AND p.deleted_at IS NULL ORDER BY p.date DESC, p.id DESC`,
    [tenantId]
  );
  return rows;
}

async function create(tenantId, { supplierId, date, total }, userId) {
  const seq = await pool.query("SELECT nextval('purchase_number_seq') AS n");
  const purchaseNumber = `PUR-${new Date().getFullYear()}-${String(seq.rows[0].n).padStart(5, "0")}`;
  const { rows } = await pool.query(
    `INSERT INTO purchases (tenant_id, supplier_id, purchase_number, date, total, created_by)
     VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
    [tenantId, supplierId, purchaseNumber, date, total, userId]
  );
  return rows[0];
}

// Approval is the moment a purchase becomes a real accounting fact — posts
// to the GL in the same transaction as the status flip, matching invoices'
// issue flow.
async function approve(tenantId, id, userId) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const { rows } = await client.query(
      "SELECT * FROM purchases WHERE tenant_id = $1 AND id = $2 AND status = 'pending_approval' FOR UPDATE",
      [tenantId, id]
    );
    if (!rows[0]) throw Object.assign(new Error("Purchase not found or not pending approval"), { status: 404 });

    await postPurchaseApproved(client, { tenantId, purchaseId: id, date: rows[0].date, total: rows[0].total }, userId);

    const updated = await client.query(`UPDATE purchases SET status = 'approved' WHERE id = $1 RETURNING *`, [id]);
    await client.query("COMMIT");
    return updated.rows[0];
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

async function recordPayment(tenantId, id, { amount, date, accountId }, userId) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const { rows } = await client.query(
      "SELECT * FROM purchases WHERE tenant_id = $1 AND id = $2 AND status = 'approved' FOR UPDATE",
      [tenantId, id]
    );
    if (!rows[0]) throw Object.assign(new Error("Purchase not found or not approved"), { status: 404 });

    await postSupplierPaymentMade(client, { tenantId, purchaseId: id, date, amount, accountId }, userId);

    const newAmountPaid = Number(rows[0].amount_paid) + Number(amount);
    const status = newAmountPaid >= Number(rows[0].total) ? "paid" : "approved";
    const updated = await client.query(
      `UPDATE purchases SET amount_paid = $1, status = $2 WHERE id = $3 RETURNING *`,
      [newAmountPaid, status, id]
    );
    await client.query("COMMIT");
    return updated.rows[0];
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

module.exports = { list, create, approve, recordPayment };
