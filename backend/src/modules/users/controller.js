const model = require("./model");
const { recordAudit } = require("../../middleware/audit");
const { asyncHandler } = require("../../utils/asyncHandler");

const list = asyncHandler(async (req, res) => {
  res.json(await model.list(req.tenantId));
});

// tenant_admin-gated — matches xtreme-finance-system's admin-provisions-
// everyone-else flow, just scoped per tenant instead of platform-wide.
const create = asyncHandler(async (req, res) => {
  const { name, email, role, password } = req.body;
  const user = await model.create(req.tenantId, { name, email, role, password });
  await recordAudit({
    tenantId: req.tenantId,
    entityType: "user",
    entityId: user.id,
    userId: req.user.id,
    action: "create",
    reason: "Tenant admin created new login",
  });
  res.status(201).json(user);
});

const setActive = asyncHandler(async (req, res) => {
  const user = await model.setActive(req.tenantId, req.params.id, req.body.isActive);
  if (!user) return res.status(404).json({ error: "User not found" });
  await recordAudit({
    tenantId: req.tenantId,
    entityType: "user",
    entityId: user.id,
    userId: req.user.id,
    action: req.body.isActive ? "activate" : "deactivate",
  });
  res.json(user);
});

module.exports = { list, create, setActive };
