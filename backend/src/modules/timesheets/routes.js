const express = require("express");
const { requireAuth, requireRole } = require("../../middleware/auth");
const { recordAudit } = require("../../middleware/audit");
const { asyncHandler } = require("../../utils/asyncHandler");
const model = require("./model");

const router = express.Router();
// Staff records themselves are tenant_admin only for both read and write
// (see staff routes) — timesheets name a specific staff member on every
// row, so the same restriction applies here.
router.use(requireAuth, requireRole("tenant_admin"));

router.get(
  "/",
  asyncHandler(async (req, res) => res.json(await model.list(req.tenantId)))
);

router.post(
  "/",
  asyncHandler(async (req, res) => {
    const { staffId, projectId, date, hours, taskDescription } = req.body;
    if (!staffId) return res.status(422).json({ error: "staffId is required" });
    if (!date) return res.status(422).json({ error: "date is required" });
    if (!hours || Number(hours) <= 0) return res.status(422).json({ error: "A positive hours value is required" });

    const row = await model.create(req.tenantId, { staffId, projectId, date, hours, taskDescription }, req.user.id);
    await recordAudit({
      tenantId: req.tenantId,
      entityType: "timesheet_entry",
      entityId: row.id,
      userId: req.user.id,
      action: "create",
      reason: `${hours}h on ${date}`,
    });
    res.status(201).json(row);
  })
);

router.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    const row = await model.softDelete(req.tenantId, req.params.id, req.user.id);
    if (!row) return res.status(404).json({ error: "Timesheet entry not found" });
    await recordAudit({ tenantId: req.tenantId, entityType: "timesheet_entry", entityId: row.id, userId: req.user.id, action: "delete" });
    res.json({ ok: true });
  })
);

module.exports = router;
