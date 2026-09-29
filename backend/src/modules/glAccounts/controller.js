const model = require("./model");
const { asyncHandler } = require("../../utils/asyncHandler");

const list = asyncHandler(async (req, res) => {
  res.json(await model.list(req.tenantId));
});

const create = asyncHandler(async (req, res) => {
  const { code, name, type, parentId } = req.body;
  res.status(201).json(await model.create(req.tenantId, { code, name, type, parentId }));
});

module.exports = { list, create };
