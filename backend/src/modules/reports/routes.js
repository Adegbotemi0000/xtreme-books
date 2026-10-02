const express = require("express");
const { requireAuth } = require("../../middleware/auth");
const { asyncHandler } = require("../../utils/asyncHandler");
const model = require("./model");

const router = express.Router();
router.use(requireAuth);

router.get(
  "/income-statement",
  asyncHandler(async (req, res) => {
    const today = new Date();
    const from = req.query.from || `${today.getFullYear()}-01-01`;
    const to = req.query.to || today.toISOString().slice(0, 10);
    res.json(await model.getIncomeStatement(req.tenantId, from, to));
  })
);

router.get(
  "/balance-sheet",
  asyncHandler(async (req, res) => {
    const asOf = req.query.asOf || new Date().toISOString().slice(0, 10);
    res.json(await model.getBalanceSheet(req.tenantId, asOf));
  })
);

module.exports = router;
