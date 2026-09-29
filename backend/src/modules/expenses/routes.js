const express = require("express");
const { requireAuth, requireRole } = require("../../middleware/auth");
const { attachImportExport } = require("../../utils/importExport");
const { pool } = require("../../db/pool");
const controller = require("./controller");
const model = require("./model");

const router = express.Router();
router.use(requireAuth);

// Expenses import needs category/account NAME -> id resolved per row, since a
// CSV can't carry a foreign-key id the importer would have no way to know.
attachImportExport(router, {
  fields: [
    { key: "description", label: "Description", required: true, example: "Office internet subscription" },
    { key: "amount", label: "Amount", required: true, example: 25000 },
    { key: "date", label: "Date", required: true, example: "2026-01-15" },
    { key: "categoryName", label: "Category", example: "Utilities" },
    { key: "accountName", label: "Paid From Account", required: true, example: "Main Bank Account" },
    { key: "paymentMethod", label: "Payment Method", example: "bank_transfer" },
  ],
  writeRoles: ["tenant_admin", "accountant"],
  entityType: "expense",
  createFn: async (record, tenantId, userId) => {
    const { rows: accountRows } = await pool.query(
      "SELECT id FROM accounts WHERE tenant_id = $1 AND lower(name) = lower($2)",
      [tenantId, record.accountName]
    );
    if (!accountRows[0]) throw new Error(`No account named "${record.accountName}" — add it under Cash & Bank first`);

    let categoryId = null;
    if (record.categoryName) {
      const { rows: categoryRows } = await pool.query(
        "SELECT id FROM categories WHERE tenant_id = $1 AND type = 'expense' AND lower(name) = lower($2)",
        [tenantId, record.categoryName]
      );
      if (!categoryRows[0]) throw new Error(`No expense category named "${record.categoryName}"`);
      categoryId = categoryRows[0].id;
    }

    return model.create(
      tenantId,
      {
        description: record.description,
        amount: record.amount,
        date: record.date,
        paymentMethod: record.paymentMethod || "cash",
        accountId: accountRows[0].id,
        categoryId,
      },
      userId
    );
  },
  listFn: async (tenantId) => {
    const { rows } = await pool.query(
      `SELECT e.description, e.amount, e.date, e.payment_method, c.name AS category_name, a.name AS account_name
       FROM expenses e LEFT JOIN categories c ON c.id = e.category_id LEFT JOIN accounts a ON a.id = e.account_id
       WHERE e.tenant_id = $1 AND e.deleted_at IS NULL ORDER BY e.id DESC`,
      [tenantId]
    );
    return rows;
  },
});

router.get("/", controller.list);
router.post("/", controller.create);
router.delete("/:id", controller.archive);

module.exports = router;
