const express = require("express");
const { requireAuth, requireRole } = require("../../middleware/auth");
const { recordAudit } = require("../../middleware/audit");
const { asyncHandler } = require("../../utils/asyncHandler");
const model = require("./model");

const router = express.Router();
router.use(requireAuth);

const canWrite = requireRole("tenant_admin", "accountant");

router.get(
  "/",
  asyncHandler(async (req, res) => res.json(await model.list(req.tenantId)))
);

// No cron in this app — this is the catch-up trigger, called lazily (a
// manual button on the page) rather than on a schedule.
router.post(
  "/generate-due",
  asyncHandler(async (req, res) => {
    const result = await model.generateDue(req.tenantId, req.user.id);
    if (result.generated > 0) {
      await recordAudit({
        tenantId: req.tenantId,
        entityType: "recurring_expense",
        entityId: 0,
        userId: req.user.id,
        action: "create",
        reason: `Generated ${result.generated} expense(s) from recurring templates`,
      });
    }
    res.json(result);
  })
);

router.post(
  "/",
  canWrite,
  asyncHandler(async (req, res) => {
    const { description, categoryId, amount, paymentMethod, accountId, frequency, nextRunDate, endDate } = req.body;
    if (!description) return res.status(422).json({ error: "description is required" });
    if (!amount || Number(amount) <= 0) return res.status(422).json({ error: "A positive amount is required" });
    if (!accountId) return res.status(422).json({ error: "accountId is required" });
    if (!["weekly", "monthly", "quarterly", "yearly"].includes(frequency)) {
      return res.status(422).json({ error: "frequency must be weekly, monthly, quarterly, or yearly" });
    }
    if (!nextRunDate) return res.status(422).json({ error: "nextRunDate is required" });

    const row = await model.create(req.tenantId, { description, categoryId, amount, paymentMethod, accountId, frequency, nextRunDate, endDate }, req.user.id);
    await recordAudit({
      tenantId: req.tenantId,
      entityType: "recurring_expense",
      entityId: row.id,
      userId: req.user.id,
      action: "create",
      reason: `${description}, ${frequency}, amount=${amount}, starting ${nextRunDate}`,
    });
    res.status(201).json(row);
  })
);

router.patch(
  "/:id/active",
  canWrite,
  asyncHandler(async (req, res) => {
    const row = await model.setActive(req.tenantId, req.params.id, !!req.body.isActive);
    if (!row) return res.status(404).json({ error: "Recurring expense not found" });
    await recordAudit({
      tenantId: req.tenantId,
      entityType: "recurring_expense",
      entityId: row.id,
      userId: req.user.id,
      action: req.body.isActive ? "update" : "archive",
      reason: `is_active -> ${row.is_active}`,
    });
    res.json(row);
  })
);

// Moves the template to Trash — never a hard delete. Any expenses it already
// generated stay exactly where they are; only the schedule itself is removed.
router.delete(
  "/:id",
  canWrite,
  asyncHandler(async (req, res) => {
    const row = await model.softDelete(req.tenantId, req.params.id, req.user.id);
    if (!row) return res.status(404).json({ error: "Recurring expense not found" });
    await recordAudit({
      tenantId: req.tenantId,
      entityType: "recurring_expense",
      entityId: row.id,
      userId: req.user.id,
      action: "delete",
      reason: row.description,
    });
    res.json({ ok: true });
  })
);

module.exports = router;
