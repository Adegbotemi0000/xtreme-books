const { pool } = require("../../db/pool");
const { CODE } = require("../journals/postingRules");

// Seeded into every new tenant at signup — the accounts the posting engine
// (postingRules.js) depends on by code, plus a few common non-system ones so
// a fresh tenant's Chart of Accounts isn't empty.
const DEFAULT_ACCOUNTS = [
  { code: CODE.CASH_AND_BANK, name: "Cash & Bank", type: "asset", isSystem: true },
  { code: CODE.ACCOUNTS_RECEIVABLE, name: "Accounts Receivable", type: "asset", isSystem: true },
  { code: CODE.INVENTORY, name: "Inventory", type: "asset", isSystem: true },
  { code: CODE.LOANS_RECEIVABLE, name: "Loans Receivable", type: "asset", isSystem: true },
  { code: CODE.FIXED_ASSETS, name: "Fixed Assets", type: "asset", isSystem: true },
  { code: CODE.ACCUMULATED_DEPRECIATION, name: "Accumulated Depreciation", type: "asset", isSystem: true },
  { code: CODE.ACCOUNTS_PAYABLE, name: "Accounts Payable", type: "liability", isSystem: true },
  { code: CODE.VAT_PAYABLE, name: "VAT Payable", type: "liability", isSystem: true },
  { code: CODE.LOANS_PAYABLE, name: "Loans Payable", type: "liability", isSystem: true },
  { code: "3010", name: "Owner's Equity", type: "equity", isSystem: false },
  { code: CODE.SALES_REVENUE, name: "Sales Revenue", type: "income", isSystem: true },
  { code: CODE.COST_OF_GOODS_SOLD, name: "Cost of Goods Sold", type: "expense", isSystem: true },
  { code: CODE.DEPRECIATION_EXPENSE, name: "Depreciation Expense", type: "expense", isSystem: true },
  { code: CODE.GAIN_LOSS_ON_DISPOSAL, name: "Gain/Loss on Disposal of Assets", type: "expense", isSystem: true },
  { code: CODE.GENERAL_EXPENSE, name: "General Expense", type: "expense", isSystem: true },
];

async function seedDefaultChartOfAccounts(client, tenantId) {
  for (const account of DEFAULT_ACCOUNTS) {
    await client.query(
      `INSERT INTO gl_accounts (tenant_id, code, name, type, is_system_account)
       VALUES ($1, $2, $3, $4, $5)`,
      [tenantId, account.code, account.name, account.type, account.isSystem]
    );
  }
}

async function list(tenantId) {
  const { rows } = await pool.query(
    "SELECT * FROM gl_accounts WHERE tenant_id = $1 AND is_active = true ORDER BY code",
    [tenantId]
  );
  return rows;
}

async function create(tenantId, { code, name, type, parentId }) {
  const { rows } = await pool.query(
    `INSERT INTO gl_accounts (tenant_id, code, name, type, parent_id) VALUES ($1, $2, $3, $4, $5) RETURNING *`,
    [tenantId, code, name, type, parentId || null]
  );
  return rows[0];
}

async function findById(tenantId, id) {
  const { rows } = await pool.query(
    "SELECT * FROM gl_accounts WHERE tenant_id = $1 AND id = $2",
    [tenantId, id]
  );
  return rows[0];
}

module.exports = { DEFAULT_ACCOUNTS, seedDefaultChartOfAccounts, list, create, findById };
