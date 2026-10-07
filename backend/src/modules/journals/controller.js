const model = require("./model");
const { recordAudit } = require("../../middleware/audit");
const { asyncHandler } = require("../../utils/asyncHandler");

const list = asyncHandler(async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const pageSize = Math.min(200, Math.max(1, parseInt(req.query.pageSize, 10) || 25));
  const { data, total } = await model.listEntries(req.tenantId, { limit: pageSize, offset: (page - 1) * pageSize });
  res.json({ data, total, page, pageSize });
});

const detail = asyncHandler(async (req, res) => {
  const entry = await model.getEntry(req.tenantId, req.params.id);
  if (!entry) return res.status(404).json({ error: "Journal entry not found" });
  res.json(entry);
});

const create = asyncHandler(async (req, res) => {
  const { date, memo, lines } = req.body;
  const entry = await model.createEntry(
    { tenantId: req.tenantId, date, memo, sourceType: "manual", lines },
    req.user.id
  );
  await recordAudit({
    tenantId: req.tenantId,
    entityType: "journal_entry",
    entityId: entry.id,
    userId: req.user.id,
    action: "create",
    newValue: entry.entry_number,
    reason: "Manual journal entry",
  });
  res.status(201).json(entry);
});

const trialBalance = asyncHandler(async (req, res) => {
  res.json(await model.getTrialBalance(req.tenantId, req.query.asOf));
});

const generalLedger = asyncHandler(async (req, res) => {
  res.json(
    await model.getGeneralLedger(req.tenantId, {
      fromDate: req.query.from,
      toDate: req.query.to,
      accountId: req.query.accountId,
    })
  );
});

module.exports = { list, detail, create, trialBalance, generalLedger };
