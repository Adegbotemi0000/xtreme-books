const ExcelJS = require("exceljs");

function fmtMoney(n) {
  return Number(n || 0);
}

// One workbook, one sheet per statement — downloadable in a single file
// rather than the user running four separate report downloads.
async function generateAuditPackXlsx(pack, companyName) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = companyName || "Kora";
  workbook.created = new Date();

  const trialBalanceSheet = workbook.addWorksheet("Trial Balance");
  trialBalanceSheet.addRow(["Code", "Account", "Type", "Debit", "Credit"]).font = { bold: true };
  for (const r of pack.trialBalance) {
    trialBalanceSheet.addRow([r.code, r.name, r.type, fmtMoney(r.total_debit), fmtMoney(r.total_credit)]);
  }
  trialBalanceSheet.columns.forEach((c) => (c.width = 20));

  const incomeSheet = workbook.addWorksheet("Income Statement");
  incomeSheet.addRow([`Income Statement: ${pack.periodStart} to ${pack.periodEnd}`]).font = { bold: true };
  incomeSheet.addRow([]);
  incomeSheet.addRow(["Revenue"]).font = { bold: true };
  for (const r of pack.incomeStatement.income) incomeSheet.addRow([r.name, fmtMoney(r.amount)]);
  incomeSheet.addRow(["Total Revenue", fmtMoney(pack.incomeStatement.totalRevenue)]).font = { bold: true };
  incomeSheet.addRow([]);
  incomeSheet.addRow(["Cost of Goods Sold", fmtMoney(pack.incomeStatement.costOfGoodsSold)]);
  incomeSheet.addRow(["Gross Profit", fmtMoney(pack.incomeStatement.grossProfit)]).font = { bold: true };
  incomeSheet.addRow([]);
  incomeSheet.addRow(["Operating Expenses"]).font = { bold: true };
  for (const r of pack.incomeStatement.operatingExpenses) incomeSheet.addRow([r.name, fmtMoney(r.amount)]);
  incomeSheet.addRow(["Total Expenses", fmtMoney(pack.incomeStatement.totalExpenses)]).font = { bold: true };
  incomeSheet.addRow([]);
  incomeSheet.addRow(["Net Profit", fmtMoney(pack.incomeStatement.netProfit)]).font = { bold: true };
  incomeSheet.columns.forEach((c) => (c.width = 28));

  const balanceSheet = workbook.addWorksheet("Balance Sheet");
  balanceSheet.addRow([`Balance Sheet: as of ${pack.balanceSheet.periodEnd}`]).font = { bold: true };
  balanceSheet.addRow([]);
  balanceSheet.addRow(["Assets"]).font = { bold: true };
  for (const r of pack.balanceSheet.assets) balanceSheet.addRow([r.name, fmtMoney(r.amount)]);
  balanceSheet.addRow(["Total Assets", fmtMoney(pack.balanceSheet.totalAssets)]).font = { bold: true };
  balanceSheet.addRow([]);
  balanceSheet.addRow(["Liabilities"]).font = { bold: true };
  for (const r of pack.balanceSheet.liabilities) balanceSheet.addRow([r.name, fmtMoney(r.amount)]);
  balanceSheet.addRow(["Total Liabilities", fmtMoney(pack.balanceSheet.totalLiabilities)]).font = { bold: true };
  balanceSheet.addRow([]);
  balanceSheet.addRow(["Equity"]).font = { bold: true };
  for (const r of pack.balanceSheet.equity) balanceSheet.addRow([r.name, fmtMoney(r.amount)]);
  balanceSheet.addRow(["Current Retained Earnings", fmtMoney(pack.balanceSheet.netIncomeToDate)]);
  balanceSheet.addRow(["Total Equity", fmtMoney(pack.balanceSheet.totalEquity)]).font = { bold: true };
  balanceSheet.addRow([]);
  balanceSheet.addRow(["Total Liabilities & Equity", fmtMoney(pack.balanceSheet.totalLiabilitiesAndEquity)]).font = { bold: true };
  balanceSheet.addRow(["Balanced?", pack.balanceSheet.isBalanced ? "Yes" : "NO — investigate"]);
  balanceSheet.columns.forEach((c) => (c.width = 28));

  const cashFlowSheet = workbook.addWorksheet("Cash Flow");
  cashFlowSheet.addRow([`Cash Flow Statement: ${pack.cashFlow.periodStart} to ${pack.cashFlow.periodEnd}`]).font = { bold: true };
  cashFlowSheet.addRow([]);
  const addCashSection = (title, rows, total) => {
    cashFlowSheet.addRow([title]).font = { bold: true };
    for (const r of rows) cashFlowSheet.addRow([r.label, fmtMoney(r.amount)]);
    cashFlowSheet.addRow([`Net cash from ${title.toLowerCase()}`, fmtMoney(total)]).font = { bold: true };
    cashFlowSheet.addRow([]);
  };
  addCashSection("Operating Activities", pack.cashFlow.operating, pack.cashFlow.totalOperating);
  addCashSection("Investing Activities", pack.cashFlow.investing, pack.cashFlow.totalInvesting);
  addCashSection("Financing Activities", pack.cashFlow.financing, pack.cashFlow.totalFinancing);
  cashFlowSheet.addRow(["Opening Cash", fmtMoney(pack.cashFlow.openingCash)]);
  cashFlowSheet.addRow(["Net Change in Cash", fmtMoney(pack.cashFlow.netChange)]).font = { bold: true };
  cashFlowSheet.addRow(["Closing Cash", fmtMoney(pack.cashFlow.closingCash)]).font = { bold: true };
  cashFlowSheet.columns.forEach((c) => (c.width = 28));

  const glSheet = workbook.addWorksheet("General Ledger Detail");
  glSheet.addRow(["Entry #", "Date", "Account Code", "Account", "Memo", "Source", "Debit", "Credit", "Line Description"]).font = { bold: true };
  for (const l of pack.generalLedger) {
    glSheet.addRow([
      l.entry_number,
      new Date(l.date).toISOString().slice(0, 10),
      l.account_code,
      l.account_name,
      l.memo,
      l.source_type,
      fmtMoney(l.debit),
      fmtMoney(l.credit),
      l.description,
    ]);
  }
  glSheet.columns.forEach((c) => (c.width = 18));

  return workbook.xlsx.writeBuffer();
}

module.exports = { generateAuditPackXlsx };
