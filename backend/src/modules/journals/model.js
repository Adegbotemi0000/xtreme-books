const { pool } = require("../../db/pool");

// The single low-level primitive everything posts through. Accepts whatever
// `client` is passed in — callers pass their OWN open transaction's client,
// so e.g. "invoice issued" and its GL posting are one atomic DB transaction:
// if the journal doesn't balance, the invoice-issue itself rolls back.
// Matches xtreme-finance-system's journals/model.js#postEntry.
async function postEntry(client, { tenantId, date, memo, sourceType, sourceId, lines }, userId) {
  if (!lines || lines.length < 2) {
    throw Object.assign(new Error("A journal entry needs at least two lines"), { status: 422 });
  }

  const totalDebit = round2(lines.reduce((sum, l) => sum + Number(l.debit || 0), 0));
  const totalCredit = round2(lines.reduce((sum, l) => sum + Number(l.credit || 0), 0));
  if (totalDebit !== totalCredit) {
    throw Object.assign(
      new Error(`Journal entry does not balance: debit ${totalDebit} != credit ${totalCredit}`),
      { status: 422 }
    );
  }

  // Structural tenant-isolation guard, not just developer discipline: every
  // line's account must actually belong to this tenant's chart of accounts.
  // Catches the class of bug where a caller passes some other table's id
  // (e.g. the `accounts` cash/bank sub-ledger) straight through as a
  // gl_accounts id — ids from different tables can collide across tenants.
  const accountIds = [...new Set(lines.map((l) => l.accountId))];
  const { rows: owned } = await client.query(
    "SELECT id FROM gl_accounts WHERE tenant_id = $1 AND id = ANY($2::int[])",
    [tenantId, accountIds]
  );
  if (owned.length !== accountIds.length) {
    throw Object.assign(
      new Error("One or more journal lines reference a GL account outside this tenant's chart of accounts"),
      { status: 500 }
    );
  }

  const seq = await client.query("SELECT nextval('journal_entry_seq') AS n");
  const entryNumber = `JE-${new Date().getFullYear()}-${String(seq.rows[0].n).padStart(5, "0")}`;

  const entry = await client.query(
    `INSERT INTO journal_entries (tenant_id, entry_number, date, memo, source_type, source_id, created_by)
     VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
    [tenantId, entryNumber, date, memo || null, sourceType || null, sourceId || null, userId || null]
  );

  for (const line of lines) {
    await client.query(
      `INSERT INTO journal_lines (journal_entry_id, account_id, debit, credit, description)
       VALUES ($1, $2, $3, $4, $5)`,
      [entry.rows[0].id, line.accountId, line.debit || 0, line.credit || 0, line.description || null]
    );
  }

  return entry.rows[0];
}

// Manual entries from the Journals page open their own throwaway transaction.
async function createEntry(input, userId) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const entry = await postEntry(client, input, userId);
    await client.query("COMMIT");
    return entry;
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

// Reverses whatever was actually posted for a given source (by swapping
// debit/credit on the original lines, not recomputing) — used for
// cancellations.
async function reverseEntriesForSource(client, tenantId, sourceType, sourceId, userId, memo) {
  const { rows: entries } = await client.query(
    "SELECT * FROM journal_entries WHERE tenant_id = $1 AND source_type = $2 AND source_id = $3",
    [tenantId, sourceType, sourceId]
  );

  for (const entry of entries) {
    const { rows: lines } = await client.query(
      "SELECT * FROM journal_lines WHERE journal_entry_id = $1",
      [entry.id]
    );
    await postEntry(
      client,
      {
        tenantId,
        date: new Date().toISOString().slice(0, 10),
        memo: memo || `Reversal of ${entry.entry_number}`,
        sourceType: `${sourceType}_reversal`,
        sourceId,
        lines: lines.map((l) => ({
          accountId: l.account_id,
          debit: l.credit,
          credit: l.debit,
          description: l.description,
        })),
      },
      userId
    );
  }
}

// Was previously capped at a default limit of 50 with no total count and no
// way for the frontend to page past it — anything older than the 50 most
// recent entries was silently unreachable. Now always returns a real total
// alongside the page, so the frontend can show (and page through) everything.
async function listEntries(tenantId, { limit = 25, offset = 0 } = {}) {
  const [{ rows }, { rows: countRows }] = await Promise.all([
    pool.query(
      `SELECT * FROM journal_entries WHERE tenant_id = $1 ORDER BY date DESC, id DESC LIMIT $2 OFFSET $3`,
      [tenantId, limit, offset]
    ),
    pool.query("SELECT COUNT(*)::int AS count FROM journal_entries WHERE tenant_id = $1", [tenantId]),
  ]);
  return { data: rows, total: countRows[0].count };
}

async function getEntry(tenantId, id) {
  const { rows: entryRows } = await pool.query(
    "SELECT * FROM journal_entries WHERE tenant_id = $1 AND id = $2",
    [tenantId, id]
  );
  if (!entryRows[0]) return null;
  const { rows: lines } = await pool.query(
    `SELECT jl.*, ga.code AS account_code, ga.name AS account_name
     FROM journal_lines jl JOIN gl_accounts ga ON ga.id = jl.account_id
     WHERE jl.journal_entry_id = $1`,
    [id]
  );
  return { ...entryRows[0], lines };
}

async function getTrialBalance(tenantId, asOfDate) {
  const { rows } = await pool.query(
    `SELECT ga.id, ga.code, ga.name, ga.type,
            COALESCE(SUM(jl.debit), 0) AS total_debit,
            COALESCE(SUM(jl.credit), 0) AS total_credit
     FROM gl_accounts ga
     LEFT JOIN journal_lines jl ON jl.account_id = ga.id
     LEFT JOIN journal_entries je ON je.id = jl.journal_entry_id AND je.date <= $2
     WHERE ga.tenant_id = $1
     GROUP BY ga.id, ga.code, ga.name, ga.type
     ORDER BY ga.code`,
    [tenantId, asOfDate || new Date().toISOString().slice(0, 10)]
  );
  return rows;
}

async function getGeneralLedger(tenantId, { fromDate, toDate, accountId } = {}) {
  const params = [tenantId];
  const conditions = ["ga.tenant_id = $1"];
  if (fromDate) {
    params.push(fromDate);
    conditions.push(`je.date >= $${params.length}`);
  }
  if (toDate) {
    params.push(toDate);
    conditions.push(`je.date <= $${params.length}`);
  }
  if (accountId) {
    params.push(accountId);
    conditions.push(`ga.id = $${params.length}`);
  }

  const { rows } = await pool.query(
    `SELECT je.date, je.entry_number, je.memo, ga.code AS account_code, ga.name AS account_name,
            jl.debit, jl.credit, jl.description
     FROM journal_lines jl
     JOIN journal_entries je ON je.id = jl.journal_entry_id
     JOIN gl_accounts ga ON ga.id = jl.account_id
     WHERE ${conditions.join(" AND ")}
     ORDER BY je.date, je.id`,
    params
  );
  return rows;
}

function round2(n) {
  return Math.round(n * 100) / 100;
}

module.exports = {
  postEntry,
  createEntry,
  reverseEntriesForSource,
  listEntries,
  getEntry,
  getTrialBalance,
  getGeneralLedger,
};
