const express = require("express");
const { requireAuth, requireRole } = require("../../middleware/auth");
const { recordAudit } = require("../../middleware/audit");
const { asyncHandler } = require("../../utils/asyncHandler");
const model = require("./model");

const router = express.Router();
router.use(requireAuth);

const canWrite = requireRole("tenant_admin", "accountant");

router.get(
  "/templates",
  asyncHandler(async (req, res) => res.json(await model.listTemplates(req.tenantId)))
);

router.get(
  "/templates/:id",
  asyncHandler(async (req, res) => {
    const row = await model.findTemplateById(req.tenantId, req.params.id);
    if (!row) return res.status(404).json({ error: "Production template not found" });
    res.json(row);
  })
);

router.post(
  "/templates",
  canWrite,
  asyncHandler(async (req, res) => {
    const { name, finishedProductId, items } = req.body;
    if (!name) return res.status(422).json({ error: "name is required" });
    if (!finishedProductId) return res.status(422).json({ error: "finishedProductId is required" });
    if (!Array.isArray(items) || items.length === 0) return res.status(422).json({ error: "At least one material is required" });

    const template = await model.createTemplate(req.tenantId, { name, finishedProductId, items }, req.user.id);
    await recordAudit({
      tenantId: req.tenantId,
      entityType: "bom_template",
      entityId: template.id,
      userId: req.user.id,
      action: "create",
      reason: `${name}: ${items.length} material(s)`,
    });
    res.status(201).json(template);
  })
);

router.get(
  "/vouchers",
  asyncHandler(async (req, res) => res.json(await model.listVouchers(req.tenantId)))
);

router.get(
  "/vouchers/:id",
  asyncHandler(async (req, res) => {
    const row = await model.findVoucherById(req.tenantId, req.params.id);
    if (!row) return res.status(404).json({ error: "Production voucher not found" });
    res.json(row);
  })
);

router.post(
  "/vouchers",
  canWrite,
  asyncHandler(async (req, res) => {
    const { bomTemplateId, finishedProductId, quantityProduced, materials, notes } = req.body;
    if (!bomTemplateId && !finishedProductId) {
      return res.status(422).json({ error: "bomTemplateId or finishedProductId is required" });
    }
    if (!quantityProduced || Number(quantityProduced) <= 0) {
      return res.status(422).json({ error: "A positive quantityProduced is required" });
    }

    const voucher = await model.createVoucher(req.tenantId, { bomTemplateId, finishedProductId, quantityProduced, materials, notes }, req.user.id);
    await recordAudit({
      tenantId: req.tenantId,
      entityType: "production_voucher",
      entityId: voucher.id,
      userId: req.user.id,
      action: "create",
      reason: `${voucher.voucher_number}: produced ${quantityProduced}`,
    });
    res.status(201).json(voucher);
  })
);

module.exports = router;
