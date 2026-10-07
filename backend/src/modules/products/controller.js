const model = require("./model");
const { recordAudit } = require("../../middleware/audit");
const { asyncHandler } = require("../../utils/asyncHandler");

const list = asyncHandler(async (req, res) => res.json(await model.list(req.tenantId)));

const detail = asyncHandler(async (req, res) => {
  const product = await model.findById(req.tenantId, req.params.id);
  if (!product) return res.status(404).json({ error: "Product not found" });
  res.json(product);
});

const create = asyncHandler(async (req, res) => {
  const product = await model.create(req.tenantId, req.body);
  await recordAudit({ tenantId: req.tenantId, entityType: "product", entityId: product.id, userId: req.user.id, action: "create" });
  res.status(201).json(product);
});

const update = asyncHandler(async (req, res) => {
  const product = await model.update(req.tenantId, req.params.id, req.body);
  if (!product) return res.status(404).json({ error: "Product not found" });
  await recordAudit({ tenantId: req.tenantId, entityType: "product", entityId: product.id, userId: req.user.id, action: "update" });
  res.json(product);
});

const remove = asyncHandler(async (req, res) => {
  const product = await model.softDelete(req.tenantId, req.params.id, req.user.id);
  if (!product) return res.status(404).json({ error: "Product not found" });
  await recordAudit({ tenantId: req.tenantId, entityType: "product", entityId: product.id, userId: req.user.id, action: "archive" });
  res.json({ ok: true });
});

// Manual stock adjustments (damage, loss, stock counts, initial stock
// intake) — a required reason keeps every change traceable, matching
// docs/02-modules.md 2.4.
const adjustStock = asyncHandler(async (req, res) => {
  const { quantity, reason, branchId } = req.body;
  if (!reason || !reason.trim()) {
    return res.status(422).json({ error: "A reason is required for stock adjustments" });
  }
  const product = await model.adjustStock(req.tenantId, req.params.id, Number(quantity), branchId || null);
  if (!product) return res.status(404).json({ error: "Product not found" });
  await recordAudit({
    tenantId: req.tenantId,
    entityType: "product",
    entityId: product.id,
    userId: req.user.id,
    action: "stock_adjustment",
    newValue: String(quantity),
    reason: branchId ? `${reason} (branch #${branchId})` : reason,
  });
  res.json(product);
});

const stockByBranch = asyncHandler(async (req, res) => res.json(await model.listStockByBranch(req.tenantId)));

module.exports = { list, detail, create, update, remove, adjustStock, stockByBranch };
