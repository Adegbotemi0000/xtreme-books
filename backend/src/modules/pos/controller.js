const model = require("./model");
const { recordAudit } = require("../../middleware/audit");
const { asyncHandler } = require("../../utils/asyncHandler");

const list = asyncHandler(async (req, res) => res.json(await model.list(req.tenantId)));

const getSale = asyncHandler(async (req, res) => {
  const sale = await model.getSale(req.tenantId, req.params.id);
  if (!sale) return res.status(404).json({ error: "Sale not found" });
  res.json(sale);
});

const createSale = asyncHandler(async (req, res) => {
  const { items, paymentMethod } = req.body;
  if (!items || items.length === 0) return res.status(422).json({ error: "At least one item is required" });
  const date = req.body.date || new Date().toISOString().slice(0, 10);
  const sale = await model.createSale(req.tenantId, { items, paymentMethod, date }, req.user.id);
  await recordAudit({ tenantId: req.tenantId, entityType: "pos_sale", entityId: sale.id, userId: req.user.id, action: "create" });
  res.status(201).json(sale);
});

module.exports = { list, getSale, createSale };
