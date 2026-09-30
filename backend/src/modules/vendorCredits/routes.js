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

router.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const row = await model.findById(req.tenantId, req.params.id);
    if (!row) return res.status(404).json({ error: "Vendor credit not found" });
    res.json(row);
  })
);

router.post(
  "/",
  canWrite,
  asyncHandler(async (req, res) => {
    const { supplierId, date, categoryId, amount, reason } = req.body;
    if (!supplierId) return res.status(422).json({ error: "supplierId is required" });
    if (!date) return res.status(422).json({ error: "date is required" });
    if (!amount || Number(amount) <= 0) return res.status(422).json({ error: "A positive amount is required" });

    const credit = await model.create(req.tenantId, { supplierId, date, categoryId, amount, reason }, req.user.id);
    await recordAudit({
      tenantId: req.tenantId,
      entityType: "vendor_credit",
      entityId: credit.id,
      userId: req.user.id,
      action: "create",
      reason: `${credit.credit_number}: ${amount}`,
    });
    res.status(201).json(credit);
  })
);

router.post(
  "/:id/apply",
  canWrite,
  asyncHandler(async (req, res) => {
    const { purchaseId, amount, date } = req.body;
    if (!purchaseId) return res.status(422).json({ error: "purchaseId is required" });
    if (!amount || Number(amount) <= 0) return res.status(422).json({ error: "A positive amount is required" });

    const application = await model.applyToPurchase(req.tenantId, { vendorCreditId: req.params.id, purchaseId, amount, date }, req.user.id);
    await recordAudit({
      tenantId: req.tenantId,
      entityType: "vendor_credit",
      entityId: req.params.id,
      userId: req.user.id,
      action: "update",
      reason: `Applied ${amount} to purchase #${purchaseId}`,
    });
    res.status(201).json(application);
  })
);

router.post(
  "/:id/void",
  canWrite,
  asyncHandler(async (req, res) => {
    const row = await model.voidCredit(req.tenantId, req.params.id, req.body.reason, req.user.id);
    if (!row) return res.status(404).json({ error: "Vendor credit not found or already voided" });
    await recordAudit({
      tenantId: req.tenantId,
      entityType: "vendor_credit",
      entityId: row.id,
      userId: req.user.id,
      action: "archive",
      reason: req.body.reason || "Voided",
    });
    res.json(row);
  })
);

module.exports = router;
