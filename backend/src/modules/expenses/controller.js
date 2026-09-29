const model = require("./model");
const { recordAudit } = require("../../middleware/audit");
const { asyncHandler } = require("../../utils/asyncHandler");

const list = asyncHandler(async (req, res) => res.json(await model.list(req.tenantId)));

const create = asyncHandler(async (req, res) => {
  if (!req.body.accountId) {
    return res.status(422).json({ error: "accountId is required — which account was this paid from?" });
  }
  const expense = await model.create(req.tenantId, req.body, req.user.id);
  await recordAudit({ tenantId: req.tenantId, entityType: "expense", entityId: expense.id, userId: req.user.id, action: "create" });
  res.status(201).json(expense);
});

const archive = asyncHandler(async (req, res) => {
  const expense = await model.archive(req.tenantId, req.params.id, req.user.id);
  if (!expense) return res.status(404).json({ error: "Expense not found" });
  await recordAudit({ tenantId: req.tenantId, entityType: "expense", entityId: expense.id, userId: req.user.id, action: "archive" });
  res.json({ ok: true });
});

module.exports = { list, create, archive };
