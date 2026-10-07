const express = require("express");
const { requireAuth } = require("../../middleware/auth");
const { asyncHandler } = require("../../utils/asyncHandler");
const model = require("./model");
const { generateAuditPackXlsx } = require("./document");

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

router.get(
  "/cash-flow",
  asyncHandler(async (req, res) => {
    const today = new Date();
    const from = req.query.from || `${today.getFullYear()}-01-01`;
    const to = req.query.to || today.toISOString().slice(0, 10);
    res.json(await model.getCashFlowStatement(req.tenantId, from, to));
  })
);

router.get(
  "/audit-pack",
  asyncHandler(async (req, res) => {
    const today = new Date();
    const from = req.query.from || `${today.getFullYear()}-01-01`;
    const to = req.query.to || today.toISOString().slice(0, 10);
    res.json(await model.buildAuditPack(req.tenantId, from, to));
  })
);

router.get(
  "/audit-pack/download",
  asyncHandler(async (req, res) => {
    const today = new Date();
    const from = req.query.from || `${today.getFullYear()}-01-01`;
    const to = req.query.to || today.toISOString().slice(0, 10);
    const pack = await model.buildAuditPack(req.tenantId, from, to);
    const buffer = await generateAuditPackXlsx(pack);
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", `attachment; filename="audit-pack-${from}-to-${to}.xlsx"`);
    res.send(buffer);
  })
);

module.exports = router;
