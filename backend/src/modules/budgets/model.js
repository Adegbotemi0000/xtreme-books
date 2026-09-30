const { pool } = require("../../db/pool");

async function list(tenantId) {
  const { rows } = await pool.query(
    `SELECT b.*, COALESCE((SELECT SUM(bl.monthly_amount) * 12 FROM budget_lines bl WHERE bl.budget_id = b.id), 0) AS annual_total
     FROM budgets b WHERE b.tenant_id = $1 AND b.deleted_at IS NULL ORDER BY b.fiscal_year DESC, b.id DESC`,
    [tenantId]
  );
  return rows;
}

async function findById(tenantId, id) {
  const { rows } = await pool.query("SELECT * FROM budgets WHERE tenant_id = $1 AND id = $2 AND deleted_at IS NULL", [tenantId, id]);
  const budget = rows[0];
  if (!budget) return null;
  const lines = (
    await pool.query(
      `SELECT bl.*, c.name AS category_name FROM budget_lines bl JOIN categories c ON c.id = bl.category_id
       WHERE bl.budget_id = $1 ORDER BY c.name ASC`,
      [id]
    )
  ).rows;
  return { ...budget, lines };
}

// One row per category with any expense activity in that fiscal year — a
// category with zero lines here just means nothing was spent in it, not
// that it's missing.
async function getActualsByCategory(tenantId, fiscalYear) {
  const { rows } = await pool.query(
    `SELECT category_id, COALESCE(SUM(amount), 0) AS actual
     FROM expenses
     WHERE tenant_id = $1 AND deleted_at IS NULL AND EXTRACT(YEAR FROM date) = $2
     GROUP BY category_id`,
    [tenantId, fiscalYear]
  );
  const byCategory = {};
  for (const r of rows) byCategory[r.category_id] = Number(r.actual);
  return byCategory;
}

// Budget vs Actual: for each line, the full-year budget (monthly_amount*12),
// the year-to-date budget (monthly_amount * months elapsed — 12 for a past
// fiscal year, 0 for a future one, the current month number for this year),
// and actual spend for the whole fiscal year, so a mid-year check compares
// "should have spent by now" against "spent so far" rather than an
// apples-to-oranges full-year figure against a partial-year actual.
async function getBudgetVsActual(tenantId, id) {
  const budget = await findById(tenantId, id);
  if (!budget) return null;

  const now = new Date();
  const monthsElapsed =
    budget.fiscal_year < now.getFullYear() ? 12 : budget.fiscal_year > now.getFullYear() ? 0 : now.getMonth() + 1;

  const actuals = await getActualsByCategory(tenantId, budget.fiscal_year);

  const lines = budget.lines.map((l) => {
    const annualBudget = Number(l.monthly_amount) * 12;
    const ytdBudget = Number(l.monthly_amount) * monthsElapsed;
    const actual = actuals[l.category_id] || 0;
    return {
      categoryId: l.category_id,
      categoryName: l.category_name,
      monthlyAmount: Number(l.monthly_amount),
      annualBudget,
      ytdBudget,
      actual,
      variance: ytdBudget - actual,
      pctUsed: ytdBudget > 0 ? (actual / ytdBudget) * 100 : actual > 0 ? 100 : 0,
    };
  });

  const totals = lines.reduce(
    (acc, l) => ({
      annualBudget: acc.annualBudget + l.annualBudget,
      ytdBudget: acc.ytdBudget + l.ytdBudget,
      actual: acc.actual + l.actual,
      variance: acc.variance + l.variance,
    }),
    { annualBudget: 0, ytdBudget: 0, actual: 0, variance: 0 }
  );

  return { ...budget, monthsElapsed, lines, totals };
}

async function create(tenantId, { name, fiscalYear, lines }, userId) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const { rows } = await client.query(
      "INSERT INTO budgets (tenant_id, name, fiscal_year, created_by) VALUES ($1, $2, $3, $4) RETURNING *",
      [tenantId, name, fiscalYear, userId]
    );
    const budget = rows[0];
    for (const l of lines) {
      if (Number(l.monthlyAmount) <= 0) continue; // skip categories left at 0 — no point storing a no-op line
      await client.query("INSERT INTO budget_lines (budget_id, category_id, monthly_amount) VALUES ($1, $2, $3)", [
        budget.id,
        l.categoryId,
        l.monthlyAmount,
      ]);
    }
    await client.query("COMMIT");
    return budget;
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

// Replaces the whole line set — simplest correct way to handle "some
// categories added, some removed, some amounts changed" in one edit rather
// than diffing.
async function update(tenantId, id, { name, fiscalYear, lines }) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const { rows } = await client.query(
      "UPDATE budgets SET name = $3, fiscal_year = $4, updated_at = now() WHERE tenant_id = $1 AND id = $2 AND deleted_at IS NULL RETURNING *",
      [tenantId, id, name, fiscalYear]
    );
    if (!rows[0]) {
      await client.query("ROLLBACK");
      return null;
    }
    await client.query("DELETE FROM budget_lines WHERE budget_id = $1", [id]);
    for (const l of lines) {
      if (Number(l.monthlyAmount) <= 0) continue;
      await client.query("INSERT INTO budget_lines (budget_id, category_id, monthly_amount) VALUES ($1, $2, $3)", [
        id,
        l.categoryId,
        l.monthlyAmount,
      ]);
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

async function softDelete(tenantId, id, userId) {
  const { rows } = await pool.query(
    "UPDATE budgets SET deleted_at = now(), deleted_by = $3 WHERE tenant_id = $1 AND id = $2 AND deleted_at IS NULL RETURNING *",
    [tenantId, id, userId]
  );
  return rows[0];
}

module.exports = { list, findById, getBudgetVsActual, create, update, softDelete };
