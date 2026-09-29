const express = require("express");
const { requireAuth, requireRole } = require("../../middleware/auth");
const { attachImportExport } = require("../../utils/importExport");
const { pool } = require("../../db/pool");
const controller = require("./controller");
const model = require("./model");

const router = express.Router();
router.use(requireAuth);

// Purchases import needs supplier NAME -> id resolved per row, since a CSV
// can't carry a foreign-key id the importer would have no way to know.
attachImportExport(router, {
  fields: [
    { key: "supplierName", label: "Supplier", required: true, example: "Acme Supplies Ltd" },
    { key: "date", label: "Date", required: true, example: "2026-01-15" },
    { key: "total", label: "Total", required: true, example: 150000 },
  ],
  writeRoles: ["tenant_admin", "accountant"],
  entityType: "purchase",
  createFn: async (record, tenantId, userId) => {
    const { rows } = await pool.query(
      "SELECT id FROM suppliers WHERE tenant_id = $1 AND deleted_at IS NULL AND lower(name) = lower($2)",
      [tenantId, record.supplierName]
    );
    if (!rows[0]) throw new Error(`No supplier named "${record.supplierName}" — add it under Suppliers first`);
    return model.create(tenantId, { supplierId: rows[0].id, date: record.date, total: record.total }, userId);
  },
  listFn: async (tenantId) => {
    const { rows } = await pool.query(
      `SELECT p.date, p.total, s.name AS supplier_name FROM purchases p
       JOIN suppliers s ON s.id = p.supplier_id WHERE p.tenant_id = $1 ORDER BY p.id DESC`,
      [tenantId]
    );
    return rows;
  },
});

router.get("/", controller.list);
router.post("/", controller.create);
router.post("/:id/approve", requireRole("tenant_admin", "accountant"), controller.approve);
router.post("/:id/payments", requireRole("tenant_admin", "accountant"), controller.recordPayment);

module.exports = router;
