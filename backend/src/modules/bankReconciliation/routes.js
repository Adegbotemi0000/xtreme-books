const express = require("express");
const multer = require("multer");
const ExcelJS = require("exceljs");
const { requireAuth, requireRole } = require("../../middleware/auth");
const { recordAudit } = require("../../middleware/audit");
const { asyncHandler } = require("../../utils/asyncHandler");
const { parseImportDate, normalizeHeader } = require("../../utils/importExport");
const expensesModel = require("../expenses/model");
const model = require("./model");

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = "";
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; } else { inQuotes = false; }
      } else {
        field += c;
      }
    } else if (c === '"') {
      inQuotes = true;
    } else if (c === ",") {
      row.push(field); field = "";
    } else if (c === "\n" || c === "\r") {
      if (c === "\r" && text[i + 1] === "\n") i++;
      row.push(field); field = "";
      if (row.some((v) => v !== "")) rows.push(row);
      row = [];
    } else {
      field += c;
    }
  }
  if (field !== "" || row.length) { row.push(field); rows.push(row); }
  return rows;
}

async function extractXlsxRows(buffer) {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer);
  const sheet = workbook.worksheets[0];
  const rows = [];
  sheet.eachRow((row) => {
    rows.push(row.values.slice(1).map((v) => (v && v.text ? v.text : v ?? "")));
  });
  return rows;
}

// Banks export statements with wildly different headers, so this looks for
// the shape rather than requiring an exact template: either one signed
// "Amount" column, or separate "Debit"/"Credit" columns (the far more common
// real-world export) — auto-detected from whichever headers are present.
function parseRowsToLines(rows) {
  const header = rows[0]?.map(normalizeHeader) || [];
  const findCol = (patterns) => header.findIndex((h) => patterns.some((p) => p.test(h)));
  const dateCol = findCol([/^date$/, /transdate/, /valuedate/, /postingdate/]);
  const descCol = findCol([/desc/, /narration/, /detail/, /particular/, /remark/]);
  const amountCol = findCol([/^amount$/]);
  const debitCol = findCol([/debit/, /withdrawal/, /^dr$/]);
  const creditCol = findCol([/credit/, /deposit/, /^cr$/]);
  const refCol = findCol([/reference/, /cheque/, /^ref$/, /transactionid/]);

  if (dateCol === -1 || (amountCol === -1 && debitCol === -1 && creditCol === -1)) {
    throw Object.assign(
      new Error("Could not find a table with Date and Amount (or Debit/Credit) columns in this file."),
      { status: 400 }
    );
  }
  const maxColNeeded = Math.max(dateCol, descCol, amountCol, debitCol, creditCol, refCol);

  const lines = [];
  const errors = [];
  for (let r = 1; r < rows.length; r++) {
    const raw = rows[r];
    if (!raw || raw.every((v) => v === "" || v == null)) continue;
    if (raw.length <= maxColNeeded) {
      errors.push({ row: r + 1, error: "Row has fewer columns than expected — skipped" });
      continue;
    }
    try {
      const date = parseImportDate(raw[dateCol]);
      let amount;
      if (amountCol !== -1) {
        amount = Number(String(raw[amountCol]).replace(/[,()]/g, ""));
      } else {
        const debit = Number(String(raw[debitCol] || "0").replace(/[,()]/g, "")) || 0;
        const credit = Number(String(raw[creditCol] || "0").replace(/[,()]/g, "")) || 0;
        amount = credit - debit;
      }
      if (!date || Number.isNaN(amount)) throw new Error("Missing or invalid date/amount");
      lines.push({
        date,
        amount,
        description: descCol !== -1 ? raw[descCol] : null,
        reference: refCol !== -1 ? raw[refCol] : null,
      });
    } catch (err) {
      errors.push({ row: r + 1, error: err.message });
    }
  }
  return { lines, errors };
}

async function parseStatementFile(buffer, filename) {
  if (/\.csv$/i.test(filename)) return parseRowsToLines(parseCsv(buffer.toString("utf8")));
  if (/\.xlsx$/i.test(filename)) return parseRowsToLines(await extractXlsxRows(buffer));
  throw Object.assign(new Error("Unsupported file type — upload a CSV or XLSX statement."), { status: 400 });
}

const router = express.Router();
// The whole module is admin/accountant only — not just writes. Bank
// statement lines expose real transaction detail from a live bank account.
router.use(requireAuth, requireRole("tenant_admin", "accountant"));

router.get(
  "/imports",
  asyncHandler(async (req, res) => res.json(await model.listImports(req.tenantId, req.query.accountId || null)))
);

router.post(
  "/imports",
  upload.single("file"),
  asyncHandler(async (req, res) => {
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });
    const { accountId } = req.body;
    if (!accountId) return res.status(400).json({ error: "accountId is required" });

    const { lines, errors } = await parseStatementFile(req.file.buffer, req.file.originalname);
    if (lines.length === 0) {
      return res.status(400).json({ error: "No usable rows found in this file", errors: errors.slice(0, 20) });
    }

    const importRow = await model.createImport(req.tenantId, { accountId: Number(accountId), filename: req.file.originalname, lines }, req.user.id);
    await recordAudit({
      tenantId: req.tenantId,
      entityType: "bank_statement_import",
      entityId: importRow.id,
      userId: req.user.id,
      action: "create",
      reason: `${req.file.originalname}: ${lines.length} line(s) imported${errors.length ? `, ${errors.length} skipped` : ""}`,
    });
    res.status(201).json({ import: importRow, lineCount: lines.length, errorCount: errors.length, errors: errors.slice(0, 20) });
  })
);

router.get(
  "/imports/:id",
  asyncHandler(async (req, res) => {
    const importRow = await model.findImportById(req.tenantId, req.params.id);
    if (!importRow) return res.status(404).json({ error: "Import not found" });
    const lines = await model.listLines(req.tenantId, req.params.id);
    res.json({ ...importRow, lines });
  })
);

router.delete(
  "/imports/:id",
  asyncHandler(async (req, res) => {
    const row = await model.deleteImport(req.tenantId, req.params.id);
    if (!row) return res.status(404).json({ error: "Import not found" });
    await recordAudit({
      tenantId: req.tenantId,
      entityType: "bank_statement_import",
      entityId: row.id,
      userId: req.user.id,
      action: "delete",
      reason: row.original_filename,
    });
    res.json({ ok: true });
  })
);

router.post(
  "/lines/:lineId/confirm",
  asyncHandler(async (req, res) => {
    const { sourceType, sourceId } = req.body;
    if (!["payment", "expense"].includes(sourceType) || !sourceId) {
      return res.status(400).json({ error: "sourceType (payment|expense) and sourceId are required" });
    }
    const line = await model.confirmMatch(req.tenantId, req.params.lineId, { sourceType, sourceId }, req.user.id);
    if (!line) return res.status(404).json({ error: "Line not found or already matched" });
    res.json(line);
  })
);

// Records a brand-new expense straight from an unmatched statement line (via
// expensesModel.create() — the same entry point the Expenses page itself
// uses, so it gets the same GL posting), then marks the line matched to it.
router.post(
  "/lines/:lineId/create-expense",
  asyncHandler(async (req, res) => {
    const line = await model.findLineById(req.tenantId, req.params.lineId);
    if (!line) return res.status(404).json({ error: "Line not found" });
    if (line.status !== "unmatched") return res.status(400).json({ error: "This line is already matched or ignored" });
    if (Number(line.amount) >= 0) return res.status(400).json({ error: "Only an outgoing (negative) line can become an expense" });

    const { categoryId, description } = req.body;
    const expense = await expensesModel.create(
      req.tenantId,
      {
        date: line.date,
        categoryId: categoryId || null,
        description: description || line.description || "Bank statement entry",
        amount: Math.abs(Number(line.amount)),
        accountId: line.account_id,
      },
      req.user.id
    );
    await recordAudit({
      tenantId: req.tenantId,
      entityType: "expense",
      entityId: expense.id,
      userId: req.user.id,
      action: "create",
      reason: `Created from bank statement line #${line.id}`,
    });
    const matched = await model.confirmMatch(req.tenantId, line.id, { sourceType: "expense", sourceId: expense.id }, req.user.id);
    res.status(201).json({ expense, line: matched });
  })
);

router.post(
  "/lines/:lineId/unmatch",
  asyncHandler(async (req, res) => {
    const line = await model.unmatchLine(req.tenantId, req.params.lineId);
    if (!line) return res.status(404).json({ error: "Line not found" });
    res.json(line);
  })
);

router.post(
  "/lines/:lineId/ignore",
  asyncHandler(async (req, res) => {
    const line = await model.ignoreLine(req.tenantId, req.params.lineId, req.user.id);
    if (!line) return res.status(404).json({ error: "Line not found" });
    res.json(line);
  })
);

module.exports = router;
