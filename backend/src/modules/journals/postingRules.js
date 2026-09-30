const { pool } = require("../../db/pool");
const { postEntry } = require("./model");

// Fixed GL account codes the posting engine depends on, seeded per tenant by
// glAccounts/model.js#seedDefaultChartOfAccounts on signup. Exported so the
// glAccounts module can block edit/delete of these specific accounts — same
// SYSTEM_ACCOUNT_CODES protection pattern as xtreme-finance-system.
const CODE = {
  CASH_AND_BANK: "1010",
  ACCOUNTS_RECEIVABLE: "1020",
  INVENTORY: "1030",
  LOANS_RECEIVABLE: "1040",
  FIXED_ASSETS: "1050",
  ACCUMULATED_DEPRECIATION: "1055",
  ACCOUNTS_PAYABLE: "2010",
  VAT_PAYABLE: "2020",
  LOANS_PAYABLE: "2030",
  SALES_REVENUE: "4010",
  COST_OF_GOODS_SOLD: "5010",
  DEPRECIATION_EXPENSE: "5030",
  GAIN_LOSS_ON_DISPOSAL: "5050",
  GENERAL_EXPENSE: "5900",
};

const SYSTEM_ACCOUNT_CODES = Object.values(CODE);

// In-process cache of tenant_id:code -> gl_accounts.id, so renaming/
// recategorizing an account on the Chart of Accounts page never breaks
// postings that reference it by code.
const accountIdByCodeCache = new Map();

function clearAccountCache(tenantId) {
  for (const key of accountIdByCodeCache.keys()) {
    if (key.startsWith(`${tenantId}:`)) accountIdByCodeCache.delete(key);
  }
}

async function getAccountIdByCode(tenantId, code) {
  const key = `${tenantId}:${code}`;
  if (accountIdByCodeCache.has(key)) return accountIdByCodeCache.get(key);

  const { rows } = await pool.query(
    "SELECT id FROM gl_accounts WHERE tenant_id = $1 AND code = $2",
    [tenantId, code]
  );
  if (!rows[0]) {
    throw new Error(`Chart of accounts is missing system account ${code} for tenant ${tenantId}`);
  }
  accountIdByCodeCache.set(key, rows[0].id);
  return rows[0].id;
}

async function postInvoiceIssued(client, { tenantId, invoiceId, date, subtotal, vatAmount, total }, userId) {
  const [ar, revenue, vat] = await Promise.all([
    getAccountIdByCode(tenantId, CODE.ACCOUNTS_RECEIVABLE),
    getAccountIdByCode(tenantId, CODE.SALES_REVENUE),
    getAccountIdByCode(tenantId, CODE.VAT_PAYABLE),
  ]);

  const lines = [{ accountId: ar, debit: total, credit: 0, description: "Invoice issued" }];
  lines.push({ accountId: revenue, debit: 0, credit: subtotal, description: "Sales revenue" });
  if (vatAmount > 0) {
    lines.push({ accountId: vat, debit: 0, credit: vatAmount, description: "VAT on sale" });
  }

  return postEntry(
    client,
    { tenantId, date, memo: `Invoice #${invoiceId} issued`, sourceType: "invoice", sourceId: invoiceId, lines },
    userId
  );
}

// `accountId` here is the tenant's own cash/bank sub-ledger row (the
// `accounts` table — a Cash & Bank / Accounts page entry), NOT a
// `gl_accounts` id. Every cash/bank sub-ledger rolls up to the single GL
// control account (CODE.CASH_AND_BANK); which specific account the money
// moved through is tracked on the `payments` row itself, not in the GL.
// Passing the sub-ledger id straight through as a GL account id was a real
// bug — the two tables' auto-increment ids overlap across tenants, so it
// could post a journal line against a GL account belonging to a different
// tenant entirely.
async function postInvoicePaymentReceived(client, { tenantId, invoiceId, date, amount }, userId) {
  const [cashAndBank, ar] = await Promise.all([
    getAccountIdByCode(tenantId, CODE.CASH_AND_BANK),
    getAccountIdByCode(tenantId, CODE.ACCOUNTS_RECEIVABLE),
  ]);

  return postEntry(
    client,
    {
      tenantId,
      date,
      memo: `Payment received for invoice #${invoiceId}`,
      sourceType: "invoice_payment",
      sourceId: invoiceId,
      lines: [
        { accountId: cashAndBank, debit: amount, credit: 0, description: "Payment received" },
        { accountId: ar, debit: 0, credit: amount, description: "Receivable settled" },
      ],
    },
    userId
  );
}

async function postExpenseRecorded(client, { tenantId, expenseId, date, amount }, userId) {
  const [expenseAccount, cashAndBank] = await Promise.all([
    getAccountIdByCode(tenantId, CODE.GENERAL_EXPENSE),
    getAccountIdByCode(tenantId, CODE.CASH_AND_BANK),
  ]);

  return postEntry(
    client,
    {
      tenantId,
      date,
      memo: `Expense #${expenseId} recorded`,
      sourceType: "expense",
      sourceId: expenseId,
      lines: [
        { accountId: expenseAccount, debit: amount, credit: 0, description: "Expense" },
        { accountId: cashAndBank, debit: 0, credit: amount, description: "Paid from account" },
      ],
    },
    userId
  );
}

// A supplier's credit note reduces what we owe them (Dr AP) and reverses
// some of the expense it relates to (Cr General Expense) — Kora doesn't map
// categories to distinct GL accounts the way xtreme-finance-system does
// (categories here are for reporting/labeling, not GL routing), so this
// always credits the same General Expense account postExpenseRecorded
// debits, rather than a per-category account.
async function postVendorCreditIssued(client, { tenantId, creditId, date, amount, reason, creditNumber }, userId) {
  const [ap, expenseAccount] = await Promise.all([
    getAccountIdByCode(tenantId, CODE.ACCOUNTS_PAYABLE),
    getAccountIdByCode(tenantId, CODE.GENERAL_EXPENSE),
  ]);

  return postEntry(
    client,
    {
      tenantId,
      date,
      memo: `Vendor credit ${creditNumber}`,
      sourceType: "vendor_credit",
      sourceId: creditId,
      lines: [
        { accountId: ap, debit: amount, credit: 0, description: reason || creditNumber },
        { accountId: expenseAccount, debit: 0, credit: amount, description: reason || creditNumber },
      ],
    },
    userId
  );
}

async function postPurchaseApproved(client, { tenantId, purchaseId, date, total }, userId) {
  const [inventory, ap] = await Promise.all([
    getAccountIdByCode(tenantId, CODE.INVENTORY),
    getAccountIdByCode(tenantId, CODE.ACCOUNTS_PAYABLE),
  ]);

  return postEntry(
    client,
    {
      tenantId,
      date,
      memo: `Purchase #${purchaseId} approved`,
      sourceType: "purchase",
      sourceId: purchaseId,
      lines: [
        { accountId: inventory, debit: total, credit: 0, description: "Stock received" },
        { accountId: ap, debit: 0, credit: total, description: "Payable to supplier" },
      ],
    },
    userId
  );
}

async function postSupplierPaymentMade(client, { tenantId, purchaseId, date, amount }, userId) {
  const [ap, cashAndBank] = await Promise.all([
    getAccountIdByCode(tenantId, CODE.ACCOUNTS_PAYABLE),
    getAccountIdByCode(tenantId, CODE.CASH_AND_BANK),
  ]);

  return postEntry(
    client,
    {
      tenantId,
      date,
      memo: `Payment made for purchase #${purchaseId}`,
      sourceType: "purchase_payment",
      sourceId: purchaseId,
      lines: [
        { accountId: ap, debit: amount, credit: 0, description: "Payable settled" },
        { accountId: cashAndBank, debit: 0, credit: amount, description: "Payment made" },
      ],
    },
    userId
  );
}

// direction 'given' = money lent out (an asset to us); 'taken' = money
// borrowed (a liability). Disbursement is real money movement, posted
// immediately — same pattern as expenses, not a draft/issue flow.
async function postLoanDisbursed(client, { tenantId, loanId, direction, date, amount }, userId) {
  const [loanAccount, cashAndBank] = await Promise.all([
    getAccountIdByCode(tenantId, direction === "given" ? CODE.LOANS_RECEIVABLE : CODE.LOANS_PAYABLE),
    getAccountIdByCode(tenantId, CODE.CASH_AND_BANK),
  ]);

  const lines =
    direction === "given"
      ? [
          { accountId: loanAccount, debit: amount, credit: 0, description: "Loan given" },
          { accountId: cashAndBank, debit: 0, credit: amount, description: "Cash disbursed" },
        ]
      : [
          { accountId: cashAndBank, debit: amount, credit: 0, description: "Cash received" },
          { accountId: loanAccount, debit: 0, credit: amount, description: "Loan taken" },
        ];

  return postEntry(client, { tenantId, date, memo: `Loan #${loanId} disbursed`, sourceType: "loan", sourceId: loanId, lines }, userId);
}

async function postLoanRepayment(client, { tenantId, loanId, direction, date, amount }, userId) {
  const [loanAccount, cashAndBank] = await Promise.all([
    getAccountIdByCode(tenantId, direction === "given" ? CODE.LOANS_RECEIVABLE : CODE.LOANS_PAYABLE),
    getAccountIdByCode(tenantId, CODE.CASH_AND_BANK),
  ]);

  const lines =
    direction === "given"
      ? [
          { accountId: cashAndBank, debit: amount, credit: 0, description: "Repayment received" },
          { accountId: loanAccount, debit: 0, credit: amount, description: "Loan receivable settled" },
        ]
      : [
          { accountId: loanAccount, debit: amount, credit: 0, description: "Loan payable settled" },
          { accountId: cashAndBank, debit: 0, credit: amount, description: "Repayment made" },
        ];

  return postEntry(
    client,
    { tenantId, date, memo: `Repayment on loan #${loanId}`, sourceType: "loan_repayment", sourceId: loanId, lines },
    userId
  );
}

// A POS sale is immediate cash-register money movement (unlike invoices,
// which have a draft/issue flow), so it posts to the GL at the moment of
// sale — same pattern as expenses.
async function postPosSale(client, { tenantId, saleId, date, subtotal, vatAmount, total }, userId) {
  const [cashAndBank, revenue, vat] = await Promise.all([
    getAccountIdByCode(tenantId, CODE.CASH_AND_BANK),
    getAccountIdByCode(tenantId, CODE.SALES_REVENUE),
    getAccountIdByCode(tenantId, CODE.VAT_PAYABLE),
  ]);

  const lines = [{ accountId: cashAndBank, debit: total, credit: 0, description: "POS sale" }];
  lines.push({ accountId: revenue, debit: 0, credit: subtotal, description: "Sales revenue" });
  if (vatAmount > 0) lines.push({ accountId: vat, debit: 0, credit: vatAmount, description: "VAT on sale" });

  return postEntry(client, { tenantId, date, memo: `POS sale #${saleId}`, sourceType: "pos_sale", sourceId: saleId, lines }, userId);
}

// Recognizes cost of goods sold alongside the sale, in the same transaction
// — a second posting, not folded into postPosSale, so a sale with zero-cost
// items (unpriced/service items) doesn't force a zero-amount line.
async function postPosCogs(client, { tenantId, saleId, date, cogsAmount }, userId) {
  if (cogsAmount <= 0) return null;
  const [cogs, inventory] = await Promise.all([
    getAccountIdByCode(tenantId, CODE.COST_OF_GOODS_SOLD),
    getAccountIdByCode(tenantId, CODE.INVENTORY),
  ]);

  return postEntry(
    client,
    {
      tenantId,
      date,
      memo: `COGS for POS sale #${saleId}`,
      sourceType: "pos_sale_cogs",
      sourceId: saleId,
      lines: [
        { accountId: cogs, debit: cogsAmount, credit: 0, description: "Cost of goods sold" },
        { accountId: inventory, debit: 0, credit: cogsAmount, description: "Inventory reduced" },
      ],
    },
    userId
  );
}

async function postFixedAssetPurchased(client, { tenantId, assetId, date, cost }, userId) {
  const [fixedAssets, cashAndBank] = await Promise.all([
    getAccountIdByCode(tenantId, CODE.FIXED_ASSETS),
    getAccountIdByCode(tenantId, CODE.CASH_AND_BANK),
  ]);

  return postEntry(
    client,
    {
      tenantId,
      date,
      memo: `Fixed asset #${assetId} purchased`,
      sourceType: "fixed_asset",
      sourceId: assetId,
      lines: [
        { accountId: fixedAssets, debit: cost, credit: 0, description: "Asset purchased" },
        { accountId: cashAndBank, debit: 0, credit: cost, description: "Cash paid" },
      ],
    },
    userId
  );
}

async function postDepreciationRun(client, { tenantId, assetId, date, amount }, userId) {
  const [depreciationExpense, accumulatedDepreciation] = await Promise.all([
    getAccountIdByCode(tenantId, CODE.DEPRECIATION_EXPENSE),
    getAccountIdByCode(tenantId, CODE.ACCUMULATED_DEPRECIATION),
  ]);

  return postEntry(
    client,
    {
      tenantId,
      date,
      memo: `Depreciation for asset #${assetId}`,
      sourceType: "depreciation",
      sourceId: assetId,
      lines: [
        { accountId: depreciationExpense, debit: amount, credit: 0, description: "Depreciation expense" },
        { accountId: accumulatedDepreciation, debit: 0, credit: amount, description: "Accumulated depreciation" },
      ],
    },
    userId
  );
}

// Clears the asset and its accumulated depreciation off the books, records
// cash/proceeds received, and posts the gain or loss as a single balancing
// line (debit if a loss, credit if a gain) so the entry always balances
// regardless of which side is bigger.
async function postAssetDisposal(client, { tenantId, assetId, date, cost, accumulatedDepreciation, proceeds }, userId) {
  const [fixedAssets, accumDep, cashAndBank, gainLoss] = await Promise.all([
    getAccountIdByCode(tenantId, CODE.FIXED_ASSETS),
    getAccountIdByCode(tenantId, CODE.ACCUMULATED_DEPRECIATION),
    getAccountIdByCode(tenantId, CODE.CASH_AND_BANK),
    getAccountIdByCode(tenantId, CODE.GAIN_LOSS_ON_DISPOSAL),
  ]);

  const bookValue = cost - accumulatedDepreciation;
  const gainOrLoss = proceeds - bookValue; // positive = gain, negative = loss

  const lines = [
    { accountId: accumDep, debit: accumulatedDepreciation, credit: 0, description: "Clear accumulated depreciation" },
    { accountId: cashAndBank, debit: proceeds, credit: 0, description: "Disposal proceeds" },
    { accountId: fixedAssets, debit: 0, credit: cost, description: "Remove asset at cost" },
  ];
  if (gainOrLoss > 0) {
    lines.push({ accountId: gainLoss, debit: 0, credit: gainOrLoss, description: "Gain on disposal" });
  } else if (gainOrLoss < 0) {
    lines.push({ accountId: gainLoss, debit: -gainOrLoss, credit: 0, description: "Loss on disposal" });
  }

  return postEntry(
    client,
    { tenantId, date, memo: `Disposal of asset #${assetId}`, sourceType: "asset_disposal", sourceId: assetId, lines },
    userId
  );
}

// The remaining post<Event> functions the full module set needs — stock
// write-offs, wallet transactions, tax payments — land alongside each of
// those modules' real build-out (see docs/02-modules.md).

module.exports = {
  CODE,
  SYSTEM_ACCOUNT_CODES,
  clearAccountCache,
  getAccountIdByCode,
  postInvoiceIssued,
  postInvoicePaymentReceived,
  postExpenseRecorded,
  postPurchaseApproved,
  postSupplierPaymentMade,
  postVendorCreditIssued,
  postLoanDisbursed,
  postLoanRepayment,
  postFixedAssetPurchased,
  postDepreciationRun,
  postAssetDisposal,
  postPosSale,
  postPosCogs,
};
