const { pool } = require("../../db/pool");

// How many days apart a bank line and a system record can be and still
// count as a candidate match — statements often post a day or two after the
// actual transaction date, so an exact-date-only match would miss real hits.
const MATCH_WINDOW_DAYS = 5;

async function listImports(tenantId, accountId) {
  const values = [tenantId];
  let where = "WHERE i.tenant_id = $1";
  if (accountId) {
    values.push(accountId);
    where += ` AND i.account_id = $${values.length}`;
  }
  const { rows } = await pool.query(
    `SELECT i.*, a.name AS account_name, u.name AS imported_by_name,
       (SELECT COUNT(*)::int FROM bank_statement_lines l WHERE l.import_id = i.id) AS total_lines,
       (SELECT COUNT(*)::int FROM bank_statement_lines l WHERE l.import_id = i.id AND l.status = 'matched') AS matched_lines,
       (SELECT COUNT(*)::int FROM bank_statement_lines l WHERE l.import_id = i.id AND l.status = 'unmatched') AS unmatched_lines
     FROM bank_statement_imports i
     JOIN accounts a ON a.id = i.account_id
     LEFT JOIN users u ON u.id = i.imported_by
     ${where}
     ORDER BY i.imported_at DESC`,
    values
  );
  return rows;
}

async function findImportById(tenantId, id) {
  const { rows } = await pool.query(
    "SELECT i.*, a.name AS account_name FROM bank_statement_imports i JOIN accounts a ON a.id = i.account_id WHERE i.tenant_id = $1 AND i.id = $2",
    [tenantId, id]
  );
  return rows[0];
}

async function createImport(tenantId, { accountId, filename, lines }, userId) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const { rows } = await client.query(
      "INSERT INTO bank_statement_imports (tenant_id, account_id, original_filename, imported_by) VALUES ($1, $2, $3, $4) RETURNING *",
      [tenantId, accountId, filename, userId]
    );
    const importRow = rows[0];
    for (const l of lines) {
      await client.query(
        `INSERT INTO bank_statement_lines (import_id, tenant_id, account_id, date, description, amount, reference)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [importRow.id, tenantId, accountId, l.date, l.description ?? null, l.amount, l.reference ?? null]
      );
    }
    await client.query("COMMIT");
    return importRow;
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

// Candidate matches for one statement line: existing payments/expenses on
// the same account, same absolute amount, within the match window. Scope is
// deliberately payments (customer receipts + supplier payments) and
// expenses — the two record types that actually move money through a
// cash/bank account today.
async function findCandidates(tenantId, accountId, date, amount) {
  const absAmount = Math.abs(Number(amount));
  const direction = Number(amount) >= 0 ? "in" : "out";

  const paymentsRes = await pool.query(
    `SELECT p.id, p.date, p.amount, p.direction,
       COALESCE(inv.invoice_number, pur.purchase_number) AS label
     FROM payments p
     LEFT JOIN invoices inv ON inv.id = p.invoice_id
     LEFT JOIN purchases pur ON pur.id = p.purchase_id
     WHERE p.tenant_id = $1 AND p.account_id = $2 AND NOT p.is_reversed AND p.direction = $3
       AND p.amount = $4 AND p.date BETWEEN $5::date - $6::int AND $5::date + $6::int
     ORDER BY ABS(p.date - $5::date) ASC`,
    [tenantId, accountId, direction, absAmount, date, MATCH_WINDOW_DAYS]
  );

  // Expenses only ever move money out — irrelevant for an incoming line.
  let expensesRes = { rows: [] };
  if (direction === "out") {
    expensesRes = await pool.query(
      `SELECT e.id, e.date, e.amount, e.description AS label
       FROM expenses e
       WHERE e.tenant_id = $1 AND e.account_id = $2 AND e.deleted_at IS NULL
         AND e.amount = $3 AND e.date BETWEEN $4::date - $5::int AND $4::date + $5::int
       ORDER BY ABS(e.date - $4::date) ASC`,
      [tenantId, accountId, absAmount, date, MATCH_WINDOW_DAYS]
    );
  }

  return [
    ...paymentsRes.rows.map((r) => ({ sourceType: "payment", sourceId: r.id, date: r.date, amount: r.amount, label: r.label || `Payment #${r.id}` })),
    ...expensesRes.rows.map((r) => ({ sourceType: "expense", sourceId: r.id, date: r.date, amount: r.amount, label: r.label })),
  ];
}

async function listLines(tenantId, importId) {
  const { rows } = await pool.query(
    `SELECT l.*, u.name AS matched_by_name FROM bank_statement_lines l LEFT JOIN users u ON u.id = l.matched_by
     WHERE l.tenant_id = $1 AND l.import_id = $2 ORDER BY l.date ASC, l.id ASC`,
    [tenantId, importId]
  );

  const withCandidates = [];
  for (const line of rows) {
    const candidates = line.status === "unmatched" ? await findCandidates(tenantId, line.account_id, line.date, line.amount) : [];
    withCandidates.push({ ...line, candidates });
  }
  return withCandidates;
}

async function confirmMatch(tenantId, lineId, { sourceType, sourceId }, userId) {
  const { rows } = await pool.query(
    `UPDATE bank_statement_lines SET status = 'matched', matched_source_type = $3, matched_source_id = $4, matched_by = $5, matched_at = now()
     WHERE tenant_id = $1 AND id = $2 AND status = 'unmatched' RETURNING *`,
    [tenantId, lineId, sourceType, sourceId, userId]
  );
  return rows[0];
}

async function unmatchLine(tenantId, lineId) {
  const { rows } = await pool.query(
    `UPDATE bank_statement_lines SET status = 'unmatched', matched_source_type = NULL, matched_source_id = NULL, matched_by = NULL, matched_at = NULL
     WHERE tenant_id = $1 AND id = $2 RETURNING *`,
    [tenantId, lineId]
  );
  return rows[0];
}

async function ignoreLine(tenantId, lineId, userId) {
  const { rows } = await pool.query(
    "UPDATE bank_statement_lines SET status = 'ignored', matched_by = $3, matched_at = now() WHERE tenant_id = $1 AND id = $2 RETURNING *",
    [tenantId, lineId, userId]
  );
  return rows[0];
}

async function findLineById(tenantId, id) {
  const { rows } = await pool.query("SELECT * FROM bank_statement_lines WHERE tenant_id = $1 AND id = $2", [tenantId, id]);
  return rows[0];
}

async function deleteImport(tenantId, id) {
  const { rows } = await pool.query(
    "DELETE FROM bank_statement_imports WHERE tenant_id = $1 AND id = $2 RETURNING *",
    [tenantId, id]
  );
  return rows[0];
}

module.exports = {
  listImports, findImportById, createImport, listLines, findCandidates,
  confirmMatch, unmatchLine, ignoreLine, findLineById, deleteImport,
};
