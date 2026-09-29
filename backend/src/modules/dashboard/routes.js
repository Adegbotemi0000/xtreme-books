const express = require("express");
const { requireAuth } = require("../../middleware/auth");
const { asyncHandler } = require("../../utils/asyncHandler");
const model = require("./model");

const router = express.Router();
router.use(requireAuth);

router.get("/summary", asyncHandler(async (req, res) => res.json(await model.getSummary(req.tenantId))));
router.get("/kpis", asyncHandler(async (req, res) => res.json(await model.getKpis(req.tenantId))));

module.exports = router;
