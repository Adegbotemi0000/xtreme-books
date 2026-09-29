const express = require("express");
const { requireAuth, requireRole } = require("../../middleware/auth");
const controller = require("./controller");

const router = express.Router();
router.use(requireAuth);

router.get("/", controller.list);
router.post("/", controller.create);
router.post("/:id/approve", requireRole("tenant_admin", "accountant"), controller.approve);
router.post("/:id/payments", requireRole("tenant_admin", "accountant"), controller.recordPayment);

module.exports = router;
