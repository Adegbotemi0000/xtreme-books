const model = require("./model");
const { recordAudit } = require("../../middleware/audit");
const { asyncHandler } = require("../../utils/asyncHandler");

const list = asyncHandler(async (req, res) => res.json(await model.list(req.tenantId)));

const detail = asyncHandler(async (req, res) => {
  const customer = await model.findById(req.tenantId, req.params.id);
  if (!customer) return res.status(404).json({ error: "Customer not found" });
  res.json(customer);
});

const create = asyncHandler(async (req, res) => {
  const customer = await model.create(req.tenantId, req.body);
  await recordAudit({
    tenantId: req.tenantId,
    entityType: "customer",
    entityId: customer.id,
    userId: req.user.id,
    action: "create",
  });
  res.status(201).json(customer);
});

const update = asyncHandler(async (req, res) => {
  const customer = await model.update(req.tenantId, req.params.id, req.body);
  if (!customer) return res.status(404).json({ error: "Customer not found" });
  await recordAudit({
    tenantId: req.tenantId,
    entityType: "customer",
    entityId: customer.id,
    userId: req.user.id,
    action: "update",
  });
  res.json(customer);
});

const remove = asyncHandler(async (req, res) => {
  const customer = await model.softDelete(req.tenantId, req.params.id, req.user.id);
  if (!customer) return res.status(404).json({ error: "Customer not found" });
  await recordAudit({
    tenantId: req.tenantId,
    entityType: "customer",
    entityId: customer.id,
    userId: req.user.id,
    action: "archive",
  });
  res.json({ ok: true });
});

module.exports = { list, detail, create, update, remove };
