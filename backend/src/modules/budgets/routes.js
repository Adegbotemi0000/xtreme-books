const express = require("express");
const { requireAuth, requireRole } = require("../../middleware/auth");
const { recordAudit } = require("../../middleware/audit");
const { asyncHandler } = require("../../utils/asyncHandler");
const model = require("./model");

const router = express.Router();
router.use(requireAuth);

// Readable by anyone authenticated (no more sensitive than the categories/
// totals already visible on the Expenses page); writes need admin/accountant.
const canWrite = requireRole("tenant_admin", "accountant");

function validateLines(lines) {
  return Array.isArray(lines) && lines.every((l) => l.categoryId && Number(l.monthlyAmount) >= 0);
}

router.get(
  "/",
  asyncHandler(async (req, res) => res.json(await model.list(req.tenantId)))
);

router.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const row = await model.findById(req.tenantId, req.params.id);
    if (!row) return res.status(404).json({ error: "Budget not found" });
    res.json(row);
  })
);

router.get(
  "/:id/vs-actual",
  asyncHandler(async (req, res) => {
    const row = await model.getBudgetVsActual(req.tenantId, req.params.id);
    if (!row) return res.status(404).json({ error: "Budget not found" });
    res.json(row);
  })
);

router.post(
  "/",
  canWrite,
  asyncHandler(async (req, res) => {
    const { name, fiscalYear, lines } = req.body;
    if (!name) return res.status(422).json({ error: "name is required" });
    if (!fiscalYear) return res.status(422).json({ error: "fiscalYear is required" });
    if (!validateLines(lines)) return res.status(422).json({ error: "lines must each have a categoryId and a non-negative monthlyAmount" });

    const budget = await model.create(req.tenantId, { name, fiscalYear, lines }, req.user.id);
    await recordAudit({
      tenantId: req.tenantId,
      entityType: "budget",
      entityId: budget.id,
      userId: req.user.id,
      action: "create",
      reason: `${name}, FY${fiscalYear}, ${lines.length} categor${lines.length === 1 ? "y" : "ies"}`,
    });
    res.status(201).json(budget);
  })
);

router.patch(
  "/:id",
  canWrite,
  asyncHandler(async (req, res) => {
    const before = await model.findById(req.tenantId, req.params.id);
    if (!before) return res.status(404).json({ error: "Budget not found" });
    const { name, fiscalYear, lines } = req.body;
    if (!name) return res.status(422).json({ error: "name is required" });
    if (!fiscalYear) return res.status(422).json({ error: "fiscalYear is required" });
    if (!validateLines(lines)) return res.status(422).json({ error: "lines must each have a categoryId and a non-negative monthlyAmount" });

    const budget = await model.update(req.tenantId, req.params.id, { name, fiscalYear, lines });
    await recordAudit({
      tenantId: req.tenantId,
      entityType: "budget",
      entityId: budget.id,
      userId: req.user.id,
      action: "update",
      reason: `${before.name}, FY${before.fiscal_year} -> ${name}, FY${fiscalYear}`,
    });
    res.json(budget);
  })
);

router.delete(
  "/:id",
  canWrite,
  asyncHandler(async (req, res) => {
    const row = await model.softDelete(req.tenantId, req.params.id, req.user.id);
    if (!row) return res.status(404).json({ error: "Budget not found" });
    await recordAudit({ tenantId: req.tenantId, entityType: "budget", entityId: row.id, userId: req.user.id, action: "delete", reason: row.name });
    res.json({ ok: true });
  })
);

module.exports = router;
