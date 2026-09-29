const model = require("./model");
const { recordAudit } = require("../../middleware/audit");
const { asyncHandler } = require("../../utils/asyncHandler");

const list = asyncHandler(async (req, res) => res.json(await model.list(req.tenantId)));

const create = asyncHandler(async (req, res) => {
  const loan = await model.create(req.tenantId, req.body, req.user.id);
  await recordAudit({ tenantId: req.tenantId, entityType: "loan", entityId: loan.id, userId: req.user.id, action: "create" });
  res.status(201).json(loan);
});

const recordRepayment = asyncHandler(async (req, res) => {
  const loan = await model.recordRepayment(req.tenantId, req.params.id, req.body, req.user.id);
  await recordAudit({ tenantId: req.tenantId, entityType: "loan", entityId: loan.id, userId: req.user.id, action: "repayment" });
  res.json(loan);
});

module.exports = { list, create, recordRepayment };
