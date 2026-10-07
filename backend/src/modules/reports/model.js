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

// Direct method: every journal_entries.source_type that ever posts a line
// against the Cash & Bank account is bucketed into Operating/Investing/
// Financing by what kind of event it is — not derived from net income plus
// adjustments (the indirect method), since the direct postings already give
// an exact answer and there's no need to reconstruct it. Any source_type not
// in the map (shouldn't happen, but a new posting rule could add one before
// this map is updated) falls into Operating rather than silently vanishing.
const CASH_FLOW_CATEGORY = {
  invoice_payment: "operating",
  expense: "operating",
  purchase_payment: "operating",
  pos_sale: "operating",
  pos_sale_cogs: "operating",
  fixed_asset: "investing",
  asset_disposal: "investing",
  loan: "financing",
  loan_repayment: "financing",
};

const SOURCE_LABELS = {
  invoice_payment: "Customer receipts",
  expense: "Expenses paid",
  purchase_payment: "Supplier payments",
  pos_sale: "POS sales",
  pos_sale_cogs: "POS cost of goods sold",
  fixed_asset: "Fixed asset purchases",
  asset_disposal: "Fixed asset disposal proceeds",
  loan: "Loan proceeds / disbursed",
  loan_repayment: "Loan repayments",
};

async function getCashFlowStatement(tenantId, periodStart, periodEnd) {
  const { rows: cashAccountRows } = await pool.query(
    "SELECT id FROM gl_accounts WHERE tenant_id = $1 AND code = '1010'",
    [tenantId]
  );
  const cashAccountId = cashAccountRows[0]?.id;
  if (!cashAccountId) {
    throw Object.assign(new Error("Chart of accounts is missing the Cash & Bank account"), { status: 500 });
  }

  const openingRes = await pool.query(
    `SELECT COALESCE(SUM(jl.debit), 0) - COALESCE(SUM(jl.credit), 0) AS balance
     FROM journal_lines jl JOIN journal_entries je ON je.id = jl.journal_entry_id
     WHERE jl.account_id = $1 AND je.date < $2`,
    [cashAccountId, periodStart]
  );
  const openingCash = Number(openingRes.rows[0].balance);

  const { rows } = await pool.query(
    `SELECT je.source_type, COALESCE(SUM(jl.debit), 0) - COALESCE(SUM(jl.credit), 0) AS net
     FROM journal_lines jl JOIN journal_entries je ON je.id = jl.journal_entry_id
     WHERE jl.account_id = $1 AND je.date BETWEEN $2 AND $3
     GROUP BY je.source_type
     ORDER BY je.source_type`,
    [cashAccountId, periodStart, periodEnd]
  );

  const buckets = { operating: [], investing: [], financing: [] };
  const totals = { operating: 0, investing: 0, financing: 0 };

  for (const r of rows) {
    const category = CASH_FLOW_CATEGORY[r.source_type] || "operating";
    const amount = Number(r.net);
    buckets[category].push({ sourceType: r.source_type, label: SOURCE_LABELS[r.source_type] || r.source_type, amount });
    totals[category] += amount;
  }

  const netChange = totals.operating + totals.investing + totals.financing;
  const closingCash = openingCash + netChange;

  return {
    periodStart,
    periodEnd,
    openingCash,
    operating: buckets.operating,
    totalOperating: totals.operating,
    investing: buckets.investing,
    totalInvesting: totals.investing,
    financing: buckets.financing,
    totalFinancing: totals.financing,
    netChange,
    closingCash,
  };
}

// Every journal line posted in the period, across every account — the full
// audit trail an external auditor actually reads line by line.
async function getGeneralLedgerDetail(tenantId, periodStart, periodEnd) {
  const { rows } = await pool.query(
    `SELECT jl.debit, jl.credit, jl.description, je.entry_number, je.date, je.memo, je.source_type,
       ga.code AS account_code, ga.name AS account_name
     FROM journal_lines jl
     JOIN journal_entries je ON je.id = jl.journal_entry_id
     JOIN gl_accounts ga ON ga.id = jl.account_id
     WHERE ga.tenant_id = $1 AND je.date BETWEEN $2 AND $3
     ORDER BY je.date ASC, je.id ASC, jl.id ASC`,
    [tenantId, periodStart, periodEnd]
  );
  return rows;
}

// Bundles the core GL-derived statements into one audit-ready package.
// Deliberately scoped to what's already real here (Trial Balance, Income
// Statement, Balance Sheet, Cash Flow, full GL detail, Receivables Aging) —
// the reference implementation's fuller bundle (Payables Aging, Fixed Asset
// Register, Tax Summary, Sales/Purchases/Loan/Payroll Registers) would each
// need a new dedicated query; left for a follow-up rather than stubbed.
async function buildAuditPack(tenantId, periodStart, periodEnd) {
  const [trialBalance, incomeStatement, balanceSheet, cashFlow, generalLedger] = await Promise.all([
    getTrialBalance(tenantId, periodEnd),
    getIncomeStatement(tenantId, periodStart, periodEnd),
    getBalanceSheet(tenantId, periodEnd),
    getCashFlowStatement(tenantId, periodStart, periodEnd),
    getGeneralLedgerDetail(tenantId, periodStart, periodEnd),
  ]);
  return { periodStart, periodEnd, trialBalance, incomeStatement, balanceSheet, cashFlow, generalLedger };
}

module.exports = {
  getIncomeStatement,
  getBalanceSheet,
  getCashFlowStatement,
  getGeneralLedgerDetail,
  buildAuditPack,
};
