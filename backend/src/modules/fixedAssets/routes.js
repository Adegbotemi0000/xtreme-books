const express = require("express");
const { requireAuth, requireRole } = require("../../middleware/auth");
const { attachImportExport } = require("../../utils/importExport");
const controller = require("./controller");
const model = require("./model");

const router = express.Router();
router.use(requireAuth);

attachImportExport(router, {
  fields: [
    { key: "name", label: "Name", required: true, example: "Toyota Hiace Bus" },
    { key: "category", label: "Category", example: "Vehicles" },
    { key: "purchaseDate", label: "Purchase Date", required: true, example: "2026-01-15" },
    { key: "cost", label: "Cost", required: true, example: 15000000 },
    { key: "usefulLifeYears", label: "Useful Life (Years)", required: true, example: 5 },
    { key: "salvageValue", label: "Salvage Value", example: 1000000 },
  ],
  writeRoles: ["tenant_admin", "accountant"],
  entityType: "fixed_asset",
  createFn: (record, tenantId, userId) => model.create(tenantId, record, userId),
  listFn: (tenantId) => model.list(tenantId),
});

router.get("/", controller.list);
router.post("/", requireRole("tenant_admin", "accountant"), controller.create);
router.post("/:id/depreciate", requireRole("tenant_admin", "accountant"), controller.runDepreciation);
router.post("/:id/dispose", requireRole("tenant_admin", "accountant"), controller.dispose);

module.exports = router;
