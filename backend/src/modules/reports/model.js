const { pool } = require("../../db/pool");
const { getTrialBalance } = require("../journals/model");

// Income Statement (Profit & Loss): a PERIOD statement — only postings
// dated inside [periodStart, periodEnd] count, unlike Trial Balance/Balance
// Sheet which are cumulative as-of a single date. Revenue and expense
// accounts are "temporary" — this is exactly the number a formal close
// would zero them out into Retained Earnings for.
async function getIncomeStatement(tenantId, periodStart, periodEnd) {
  const { rows } = await pool.query(
    `SELECT ga.id, ga.code, ga.name, ga.type,
       COALESCE(SUM(jl.debit), 0) AS total_debit,
       COALESCE(SUM(jl.credit), 0) AS total_credit
     FROM gl_accounts ga
     JOIN journal_lines jl ON jl.account_id = ga.id
     JOIN journal_entries je ON je.id = jl.journal_entry_id
     WHERE ga.tenant_id = $1 AND ga.type IN ('income', 'expense') AND je.date BETWEEN $2 AND $3
     GROUP BY ga.id, ga.code, ga.name, ga.type
     ORDER BY ga.code ASC`,
    [tenantId, periodStart, periodEnd]
  );

  const income = [];
  const expenses = [];
  let totalRevenue = 0;
  let totalExpenses = 0;

  for (const r of rows) {
    if (r.type === "income") {
      const amount = Number(r.total_credit) - Number(r.total_debit); // credit-normal
      income.push({ code: r.code, name: r.name, amount });
      totalRevenue += amount;
    } else {
      const amount = Number(r.total_debit) - Number(r.total_credit); // debit-normal
      expenses.push({ code: r.code, name: r.name, amount });
      totalExpenses += amount;
    }
  }

  const costOfGoodsSold = expenses.find((e) => e.code === "5010")?.amount || 0;
  const operatingExpenses = expenses.filter((e) => e.code !== "5010");
  const grossProfit = totalRevenue - costOfGoodsSold;
  const netProfit = totalRevenue - totalExpenses;

  return { periodStart, periodEnd, income, expenses, operatingExpenses, totalRevenue, costOfGoodsSold, grossProfit, totalExpenses, netProfit };
}

// Balance Sheet: cumulative as-of periodEnd (everything since inception —
// a snapshot, not a flow). Income/expense accounts have no formal
// period-end close in this system, so their net since inception is folded
// into equity as "Current Retained Earnings" — standard presentation, and
// exactly why Assets = Liabilities + Equity holds if the trial balance
// itself is balanced.
async function getBalanceSheet(tenantId, periodEnd) {
  const rows = await getTrialBalance(tenantId, periodEnd);

  const byType = { asset: [], liability: [], equity: [] };
  let totalAssets = 0;
  let totalLiabilities = 0;
  let totalEquity = 0;
  let netIncomeToDate = 0;

  for (const r of rows) {
    const debit = Number(r.total_debit);
    const credit = Number(r.total_credit);
    if (r.type === "asset") {
      const amount = debit - credit;
      byType.asset.push({ code: r.code, name: r.name, amount });
      totalAssets += amount;
    } else if (r.type === "liability") {
      const amount = credit - debit;
      byType.liability.push({ code: r.code, name: r.name, amount });
      totalLiabilities += amount;
    } else if (r.type === "equity") {
      const amount = credit - debit;
      byType.equity.push({ code: r.code, name: r.name, amount });
      totalEquity += amount;
    } else if (r.type === "income") {
      netIncomeToDate += credit - debit;
    } else if (r.type === "expense") {
      netIncomeToDate -= debit - credit;
    }
  }

  const totalEquityWithEarnings = totalEquity + netIncomeToDate;
  const totalLiabilitiesAndEquity = totalLiabilities + totalEquityWithEarnings;

  return {
    periodEnd,
    assets: byType.asset,
    totalAssets,
    liabilities: byType.liability,
    totalLiabilities,
    equity: byType.equity,
    netIncomeToDate,
    totalEquity: totalEquityWithEarnings,
    totalLiabilitiesAndEquity,
    isBalanced: Math.round(totalAssets * 100) === Math.round(totalLiabilitiesAndEquity * 100),
  };
}

module.exports = { getIncomeStatement, getBalanceSheet };
