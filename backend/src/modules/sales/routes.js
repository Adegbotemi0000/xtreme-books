const express = require("express");
const { requireAuth } = require("../../middleware/auth");
const { attachImportExport } = require("../../utils/importExport");
const { pool } = require("../../db/pool");
const controller = require("./controller");
const model = require("./model");

const router = express.Router();
router.use(requireAuth);

router.get("/invoices", controller.listInvoices);
router.get("/invoices/receivables-ageing", controller.receivablesAgeing);

// One row = one invoice with a single line item — same simplification used
// for bulk-importing historical Purchases. Imported invoices land as Draft,
// same as one entered by hand; issue them normally afterward to post to the
// GL, so imported data goes through the exact same posting path as anything
// entered today.
//
// Nested in its own router mounted at "/invoices" (this module's router
// itself is mounted at "/api/sales") so the routes land at
// /api/sales/invoices/import[-template] — attachImportExport always hangs
// its routes off the router's own root. Must land before GET /invoices/:id,
// or "import-template"/"export" get parsed as an id.
const invoiceImportRouter = express.Router();
attachImportExport(invoiceImportRouter, {
  fields: [
    { key: "customerName", label: "Customer", required: true, example: "Acme Retail Ltd" },
    { key: "date", label: "Date", required: true, example: "2026-01-15" },
    { key: "dueDate", label: "Due Date", example: "2026-02-15" },
    { key: "description", label: "Description", required: true, example: "Consulting services" },
    { key: "quantity", label: "Quantity", required: true, example: 1 },
    { key: "unitPrice", label: "Unit Price", required: true, example: 500000 },
    { key: "customerNotes", label: "Customer Notes", example: "Thanks for your business." },
  ],
  writeRoles: ["tenant_admin", "accountant"],
  entityType: "invoice",
  createFn: async (record, tenantId, userId) => {
    let customer = (
      await pool.query("SELECT id FROM customers WHERE tenant_id = $1 AND deleted_at IS NULL AND lower(name) = lower($2)", [
        tenantId,
        record.customerName,
      ])
    ).rows[0];
    if (!customer) {
      customer = (
        await pool.query("INSERT INTO customers (tenant_id, name) VALUES ($1, $2) RETURNING id", [tenantId, record.customerName])
      ).rows[0];
    }

    return model.createInvoice(
      tenantId,
      {
        customerId: customer.id,
        date: record.date,
        dueDate: record.dueDate || null,
        customerNotes: record.customerNotes || null,
        items: [{ description: record.description, quantity: Number(record.quantity), unitPrice: Number(record.unitPrice) }],
      },
      userId
    );
  },
  // Export reuses the import's single-line shape by surfacing each invoice's
  // first line item — exact for the common single-line case this import
  // targets; a multi-line invoice exports its first line only, since a flat
  // CSV row has no way to carry more than one.
  listFn: async (tenantId) => {
    const { rows } = await pool.query(
      `SELECT DISTINCT ON (i.id) i.date, i.due_date, i.customer_notes, c.name AS customer_name,
         ii.description, ii.quantity, ii.unit_price
       FROM invoices i
       JOIN customers c ON c.id = i.customer_id
       LEFT JOIN invoice_items ii ON ii.invoice_id = i.id
       WHERE i.tenant_id = $1 AND i.deleted_at IS NULL
       ORDER BY i.id, ii.id`,
      [tenantId]
    );
    return rows;
  },
});
router.use("/invoices", invoiceImportRouter);

router.get("/invoices/:id", controller.getInvoice);
router.post("/invoices", controller.createInvoice);
router.post("/invoices/:id/issue", controller.issueInvoice);
router.post("/invoices/:id/payments", controller.recordPayment);
router.post("/invoices/:id/cancel", controller.cancelInvoice);

router.get("/quotations", controller.listQuotations);
router.post("/quotations", controller.createQuotation);
router.post("/quotations/:id/convert", controller.convertQuotation);

module.exports = router;
