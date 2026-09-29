const { pool } = require("../../db/pool");

// Same summary the Dashboard page and (later) the "Ask GT" local-data-answer
// path both read from — one source of truth for "what are this tenant's
// numbers right now", matching xtreme-finance-system's pattern.
async function getSummary(tenantId) {
  const [revenue, expenses, receivables, lowStock, cash] = await Promise.all([
    pool.query(
      `SELECT COALESCE(SUM(subtotal), 0) AS total FROM invoices
       WHERE tenant_id = $1 AND status IN ('issued', 'partially_paid', 'paid') AND deleted_at IS NULL`,
      [tenantId]
    ),
    pool.query(
      `SELECT COALESCE(SUM(amount), 0) AS total FROM expenses
       WHERE tenant_id = $1 AND is_voided = false AND deleted_at IS NULL`,
      [tenantId]
    ),
    pool.query(
      `SELECT COALESCE(SUM(total - amount_paid), 0) AS total FROM invoices
       WHERE tenant_id = $1 AND status IN ('issued', 'partially_paid') AND deleted_at IS NULL`,
      [tenantId]
    ),
    pool.query(
      `SELECT COUNT(*) AS count FROM products
       WHERE tenant_id = $1 AND deleted_at IS NULL AND stock_quantity <= reorder_level`,
      [tenantId]
    ),
    pool.query(
      `SELECT COALESCE(SUM(opening_balance), 0)
         + COALESCE((SELECT SUM(amount) FROM payments WHERE tenant_id = $1 AND direction = 'in' AND is_reversed = false), 0)
         - COALESCE((SELECT SUM(amount) FROM payments WHERE tenant_id = $1 AND direction = 'out' AND is_reversed = false), 0)
         AS total
       FROM accounts WHERE tenant_id = $1 AND deleted_at IS NULL`,
      [tenantId]
    ),
  ]);

  const [receivablesAging, payablesOutstanding] = await Promise.all([
    pool.query(
      `SELECT
         COALESCE(SUM(total - amount_paid) FILTER (WHERE due_date IS NULL OR due_date >= CURRENT_DATE), 0) AS current,
         COALESCE(SUM(total - amount_paid) FILTER (WHERE due_date IS NOT NULL AND due_date < CURRENT_DATE), 0) AS overdue
       FROM invoices WHERE tenant_id = $1 AND status IN ('issued', 'partially_paid') AND deleted_at IS NULL`,
      [tenantId]
    ),
    pool.query(
      `SELECT COALESCE(SUM(total - amount_paid), 0) AS total FROM purchases
       WHERE tenant_id = $1 AND status != 'cancelled' AND deleted_at IS NULL`,
      [tenantId]
    ),
  ]);

  return {
    revenue: Number(revenue.rows[0].total),
    expenses: Number(expenses.rows[0].total),
    profit: Number(revenue.rows[0].total) - Number(expenses.rows[0].total),
    receivablesOutstanding: Number(receivables.rows[0].total),
    lowStockCount: Number(lowStock.rows[0].count),
    cashPosition: Number(cash.rows[0].total),
    receivablesAging: [
      { key: "current", total: Number(receivablesAging.rows[0].current) },
      { key: "overdue", total: Number(receivablesAging.rows[0].overdue) },
    ],
    // No due_date on purchases yet, so payables aging can't bucket
    // current-vs-overdue the way receivables does — shown as a single total
    // until the Purchases module's full build-out adds one.
    payablesTotal: Number(payablesOutstanding.rows[0].total),
  };
}

// Backs the Dashboard's charts — monthly revenue/expense trend, cash-in/out
// trend, and expense-by-category split. Same shape as
// xtreme-finance-system's getDashboardKpis, adapted to this schema.
async function getKpis(tenantId) {
  const [monthlyRevenue, monthlyExpenses, cashFlow, expenseByCategory] = await Promise.all([
    pool.query(
      `SELECT to_char(date_trunc('month', date), 'YYYY-MM') AS month, COALESCE(SUM(subtotal), 0) AS total
       FROM invoices
       WHERE tenant_id = $1 AND status IN ('issued', 'partially_paid', 'paid') AND deleted_at IS NULL
         AND date >= date_trunc('month', CURRENT_DATE) - INTERVAL '11 months'
       GROUP BY 1 ORDER BY 1`,
      [tenantId]
    ),
    pool.query(
      `SELECT to_char(date_trunc('month', date), 'YYYY-MM') AS month, COALESCE(SUM(amount), 0) AS total
       FROM expenses
       WHERE tenant_id = $1 AND is_voided = false AND deleted_at IS NULL
         AND date >= date_trunc('month', CURRENT_DATE) - INTERVAL '11 months'
       GROUP BY 1 ORDER BY 1`,
      [tenantId]
    ),
    pool.query(
      `SELECT to_char(date_trunc('month', date), 'YYYY-MM') AS month,
              COALESCE(SUM(amount) FILTER (WHERE direction = 'in'), 0) AS cash_in,
              COALESCE(SUM(amount) FILTER (WHERE direction = 'out'), 0) AS cash_out
       FROM payments
       WHERE tenant_id = $1 AND is_reversed = false
         AND date >= date_trunc('month', CURRENT_DATE) - INTERVAL '5 months'
       GROUP BY 1 ORDER BY 1`,
      [tenantId]
    ),
    pool.query(
      `SELECT COALESCE(c.name, 'Uncategorized') AS category, SUM(e.amount) AS total
       FROM expenses e LEFT JOIN categories c ON c.id = e.category_id
       WHERE e.tenant_id = $1 AND e.is_voided = false AND e.deleted_at IS NULL
         AND e.date >= date_trunc('year', CURRENT_DATE)
       GROUP BY 1 ORDER BY total DESC`,
      [tenantId]
    ),
  ]);

  const months = {};
  for (const r of monthlyRevenue.rows) months[r.month] = { month: r.month, revenue: Number(r.total), expenses: 0 };
  for (const r of monthlyExpenses.rows) {
    months[r.month] = months[r.month] || { month: r.month, revenue: 0, expenses: 0 };
    months[r.month].expenses = Number(r.total);
  }

  return {
    monthlyTrend: Object.values(months).sort((a, b) => a.month.localeCompare(b.month)),
    cashFlowTrend: cashFlow.rows.map((r) => ({ month: r.month, cashIn: Number(r.cash_in), cashOut: Number(r.cash_out) })),
    expenseByCategory: expenseByCategory.rows.map((r) => ({ category: r.category, total: Number(r.total) })),
  };
}

module.exports = { getSummary, getKpis };
