const express = require("express");
const { requireAuth } = require("../../middleware/auth");
const { attachImportExport } = require("../../utils/importExport");
const controller = require("./controller");
const model = require("./model");

const router = express.Router();
router.use(requireAuth);

// Must land before GET /:id, or "import-template"/"export" get parsed as an id.
attachImportExport(router, {
  fields: [
    { key: "name", label: "Name", required: true, example: "Bag of Rice 50kg" },
    { key: "sku", label: "SKU", example: "RICE-50KG" },
    { key: "unitPrice", label: "Unit Price", required: true, example: 45000 },
    { key: "cost", label: "Cost", example: 38000 },
    { key: "vatRate", label: "VAT Rate (%)", example: 7.5 },
    { key: "reorderLevel", label: "Reorder Level", example: 10 },
  ],
  writeRoles: ["tenant_admin", "accountant"],
  entityType: "product",
  createFn: (record, tenantId) => model.create(tenantId, record),
  listFn: (tenantId) => model.list(tenantId),
});

router.get("/", controller.list);
router.get("/:id", controller.detail);
router.post("/", controller.create);
router.put("/:id", controller.update);
router.post("/:id/adjust-stock", controller.adjustStock);
router.delete("/:id", controller.remove);

module.exports = router;
