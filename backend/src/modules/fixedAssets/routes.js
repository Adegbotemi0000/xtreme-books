const express = require("express");
const { requireAuth, requireRole } = require("../../middleware/auth");
const controller = require("./controller");

const router = express.Router();
router.use(requireAuth);

router.get("/", controller.list);
router.post("/", requireRole("tenant_admin", "accountant"), controller.create);
router.post("/:id/depreciate", requireRole("tenant_admin", "accountant"), controller.runDepreciation);
router.post("/:id/dispose", requireRole("tenant_admin", "accountant"), controller.dispose);

module.exports = router;
