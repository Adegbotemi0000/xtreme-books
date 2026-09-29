const model = require("./model");
const { recordAudit } = require("../../middleware/audit");
const { asyncHandler } = require("../../utils/asyncHandler");

const list = asyncHandler(async (req, res) => res.json(await model.list(req.tenantId)));

const create = asyncHandler(async (req, res) => {
  const entry = await model.create(req.tenantId, req.body, req.user.id);
  await recordAudit({ tenantId: req.tenantId, entityType: "payroll_entry", entityId: entry.id, userId: req.user.id, action: "create" });
  res.status(201).json(entry);
});

// Live preview while filling the form — no row is written.
const preview = asyncHandler(async (req, res) => {
  const { grossPay, daysMissed, pensionAmount } = req.body;
  const missed = Number(daysMissed || 0);
  const proratedGross = Number(grossPay || 0) * (1 - missed / 30);
  const bands = await model.getBands(req.tenantId);
  const payeAmount = bands.length > 0 ? model.calculateProgressivePaye(proratedGross, bands) : 0;
  const pension = Number(pensionAmount || 0);
  res.json({
    proratedGross: Math.round(proratedGross * 100) / 100,
    payeAmount,
    netPay: Math.round((proratedGross - payeAmount - pension) * 100) / 100,
    bandsConfigured: bands.length > 0,
  });
});

module.exports = { list, create, preview };
