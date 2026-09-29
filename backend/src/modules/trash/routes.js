const express = require("express");
const { requireAuth, requireRole } = require("../../middleware/auth");
const { asyncHandler } = require("../../utils/asyncHandler");
const { recordAudit } = require("../../middleware/audit");
const model = require("./model");

const router = express.Router();
router.use(requireAuth, requireRole("tenant_admin"));

router.get("/", asyncHandler(async (req, res) => res.json(await model.list(req.tenantId))));

router.post(
  "/restore",
  asyncHandler(async (req, res) => {
    const { entityType, id } = req.body;
    const record = await model.restore(req.tenantId, entityType, id);
    if (!record) return res.status(404).json({ error: "Record not found" });
    await recordAudit({ tenantId: req.tenantId, entityType, entityId: id, userId: req.user.id, action: "restore" });
    res.json(record);
  })
);

module.exports = router;
