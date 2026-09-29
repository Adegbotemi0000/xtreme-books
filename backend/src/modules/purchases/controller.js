const model = require("./model");
const { recordAudit } = require("../../middleware/audit");
const { asyncHandler } = require("../../utils/asyncHandler");

const list = asyncHandler(async (req, res) => res.json(await model.list(req.tenantId)));

const create = asyncHandler(async (req, res) => {
  const purchase = await model.create(req.tenantId, req.body, req.user.id);
  await recordAudit({ tenantId: req.tenantId, entityType: "purchase", entityId: purchase.id, userId: req.user.id, action: "create" });
  res.status(201).json(purchase);
});

const approve = asyncHandler(async (req, res) => {
  const purchase = await model.approve(req.tenantId, req.params.id, req.user.id);
  await recordAudit({ tenantId: req.tenantId, entityType: "purchase", entityId: purchase.id, userId: req.user.id, action: "approve" });
  res.json(purchase);
});

const recordPayment = asyncHandler(async (req, res) => {
  const purchase = await model.recordPayment(req.tenantId, req.params.id, req.body, req.user.id);
  await recordAudit({ tenantId: req.tenantId, entityType: "purchase", entityId: purchase.id, userId: req.user.id, action: "payment_made" });
  res.json(purchase);
});

module.exports = { list, create, approve, recordPayment };
