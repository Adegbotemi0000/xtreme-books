const model = require("./model");
const { recordAudit } = require("../../middleware/audit");
const { asyncHandler } = require("../../utils/asyncHandler");

const list = asyncHandler(async (req, res) => res.json(await model.list(req.tenantId)));

const create = asyncHandler(async (req, res) => {
  const asset = await model.create(req.tenantId, req.body, req.user.id);
  await recordAudit({ tenantId: req.tenantId, entityType: "fixed_asset", entityId: asset.id, userId: req.user.id, action: "create" });
  res.status(201).json(asset);
});

const runDepreciation = asyncHandler(async (req, res) => {
  const date = req.body.date || new Date().toISOString().slice(0, 10);
  const asset = await model.runDepreciation(req.tenantId, req.params.id, { date }, req.user.id);
  await recordAudit({ tenantId: req.tenantId, entityType: "fixed_asset", entityId: asset.id, userId: req.user.id, action: "depreciation_run" });
  res.json(asset);
});

const dispose = asyncHandler(async (req, res) => {
  const asset = await model.dispose(req.tenantId, req.params.id, req.body, req.user.id);
  await recordAudit({ tenantId: req.tenantId, entityType: "fixed_asset", entityId: asset.id, userId: req.user.id, action: "dispose" });
  res.json(asset);
});

module.exports = { list, create, runDepreciation, dispose };
