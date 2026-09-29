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
    { key: "name", label: "Name", required: true, example: "Acme Retail Ltd" },
    { key: "tin", label: "TIN", example: "12345678-0001" },
    { key: "email", label: "Email", example: "billing@acme.com" },
    { key: "phone", label: "Phone", example: "08012345678" },
    { key: "address", label: "Address", example: "12 Marina Road, Lagos" },
  ],
  writeRoles: ["tenant_admin", "accountant"],
  entityType: "customer",
  createFn: (record, tenantId) => model.create(tenantId, record),
  listFn: (tenantId) => model.list(tenantId),
});

router.get("/", controller.list);
router.get("/:id", controller.detail);
router.post("/", controller.create);
router.put("/:id", controller.update);
router.delete("/:id", controller.remove);

module.exports = router;
