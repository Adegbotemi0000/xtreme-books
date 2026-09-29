const { pool } = require("../../db/pool");
const { postLoanDisbursed, postLoanRepayment } = require("../journals/postingRules");

async function list(tenantId) {
  const { rows } = await pool.query(
    `SELECT l.*, COALESCE(SUM(r.amount), 0) AS repaid
     FROM loans l LEFT JOIN loan_repayments r ON r.loan_id = l.id
     WHERE l.tenant_id = $1 AND l.deleted_at IS NULL
     GROUP BY l.id ORDER BY l.date DESC, l.id DESC`,
    [tenantId]
  );
  return rows;
}

// Disbursement is real money movement, posted immediately — same pattern as
// expenses, not a draft/issue flow.
async function create(tenantId, { direction, counterpartyName, principalAmount, date, dueDate, notes }, userId) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const { rows } = await client.query(
      `INSERT INTO loans (tenant_id, direction, counterparty_name, principal_amount, date, due_date, notes, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [tenantId, direction, counterpartyName, principalAmount, date, dueDate || null, notes || null, userId]
    );

    await postLoanDisbursed(
      client,
      { tenantId, loanId: rows[0].id, direction, date, amount: principalAmount },
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

async function recordRepayment(tenantId, id, { amount, date, accountId }, userId) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const { rows } = await client.query(
      "SELECT * FROM loans WHERE tenant_id = $1 AND id = $2 AND status = 'active' FOR UPDATE",
      [tenantId, id]
    );
    if (!rows[0]) throw Object.assign(new Error("Loan not found or not active"), { status: 404 });

    await client.query(
      `INSERT INTO loan_repayments (loan_id, tenant_id, amount, date, account_id, created_by)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [id, tenantId, amount, date, accountId || null, userId]
    );

    await postLoanRepayment(client, { tenantId, loanId: id, direction: rows[0].direction, date, amount }, userId);

    const { rows: repaidRows } = await client.query(
      "SELECT COALESCE(SUM(amount), 0) AS total FROM loan_repayments WHERE loan_id = $1",
      [id]
    );
    const fullyRepaid = Number(repaidRows[0].total) >= Number(rows[0].principal_amount);
    const updated = await client.query(
      `UPDATE loans SET status = $1 WHERE id = $2 RETURNING *`,
      [fullyRepaid ? "repaid" : "active", id]
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

module.exports = { list, create, recordRepayment };
