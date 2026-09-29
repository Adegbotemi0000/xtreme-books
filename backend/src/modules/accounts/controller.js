const model = require("./model");
const { asyncHandler } = require("../../utils/asyncHandler");

const list = asyncHandler(async (req, res) => res.json(await model.list(req.tenantId)));

const create = asyncHandler(async (req, res) => res.status(201).json(await model.create(req.tenantId, req.body)));

const statement = asyncHandler(async (req, res) => res.json(await model.statement(req.tenantId, req.params.id)));

module.exports = { list, create, statement };
