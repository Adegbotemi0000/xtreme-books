const express = require("express");
const { requireAuth, requireRole } = require("../../middleware/auth");
const controller = require("./controller");

const router = express.Router();
router.use(requireAuth);

router.get("/trial-balance", controller.trialBalance);
router.get("/general-ledger", controller.generalLedger);
router.get("/", controller.list);
router.get("/:id", controller.detail);
router.post("/", requireRole("tenant_admin", "accountant"), controller.create);

module.exports = router;
