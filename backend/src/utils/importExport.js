// Generic Excel/CSV "download template / import filled-in file" pair for any
// list module (customers, suppliers, products, expenses, staff...) — one
// implementation, reused via attachImportExport() rather than each module
// hand-rolling its own parser. Ported from xtreme-finance-system's
// backend/src/utils/importExport.js, the same "don't build parallel entry
// points" principle applies here at tenant scope.
const ExcelJS = require("exceljs");
const multer = require("multer");
const { requireRole } = require("../middleware/auth");
const { recordAudit } = require("../middleware/audit");
const { asyncHandler } = require("./asyncHandler");

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

function normalizeHeader(h) {
  return String(h || "").trim().toLowerCase().replace(/[^a-z0-9]/g, "");
}

// Export reads straight off whatever listFn returns — a raw DB row, whose
// columns are snake_case, while field keys are camelCase (matching the
// createFn/import side, which builds its own INSERT and never needs this).
// Falls back to the snake_case form of the key so a field like "unitPrice"
// still finds a row's unit_price column without every module needing to
// hand-map its export shape.
function fieldValue(record, key) {
  if (record[key] !== undefined) return record[key];
  const snake = key.replace(/[A-Z]/g, (c) => `_${c.toLowerCase()}`);
  return record[snake];
}

// f.note is optional — attaches a hover comment to the header cell instead of
// lengthening the label itself, since the label is also what import parsing
// matches column names against (see normalizeHeader/colIndex below).
async function buildTemplateBuffer(fields) {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Template");
  const headerRow = sheet.addRow(fields.map((f) => f.label));
  headerRow.font = { bold: true };
  fields.forEach((f, i) => {
    if (f.note) headerRow.getCell(i + 1).note = f.note;
  });
  sheet.addRow(fields.map((f) => f.example ?? ""));
  sheet.columns = fields.map((f) => ({ width: Math.max(16, f.label.length + 2) }));
  return workbook.xlsx.writeBuffer();
}

// Minimal CSV parser — handles quoted fields and escaped quotes, which covers
// what Excel/Sheets produce when exporting CSV. No dependency needed for this.
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

async function parseUploadRows(file) {
  const isCsv = /\.csv$/i.test(file.originalname) || file.mimetype === "text/csv";
  if (isCsv) return parseCsv(file.buffer.toString("utf8"));

  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(file.buffer);
  const sheet = workbook.worksheets[0];
  const rows = [];
  sheet.eachRow((row) => {
    rows.push(row.values.slice(1).map((v) => (v && v.text ? v.text : v ?? "")));
  });
  return rows;
}

// fields: [{ key, label, required, example, parse? }]. createFn(record,
// tenantId, userId) does the actual insert — reuses whatever validation the
// module's normal create endpoint already has, so imported rows go through
// the same tenant-scoped rules as a manually-entered one.
//
// Also attaches GET /export — every existing (non-deleted) record for the
// tenant as an .xlsx, same column shape as the import template so a
// downloaded export can be re-imported unchanged.
function attachImportExport(router, { fields, createFn, listFn, writeRoles, entityType }) {
  router.get(
    "/import-template",
    requireRole(...writeRoles),
    asyncHandler(async (req, res) => {
      const buffer = await buildTemplateBuffer(fields);
      res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
      res.setHeader("Content-Disposition", 'attachment; filename="import-template.xlsx"');
      res.send(buffer);
    })
  );

  router.post(
    "/import",
    requireRole(...writeRoles),
    upload.single("file"),
    asyncHandler(async (req, res) => {
      if (!req.file) return res.status(400).json({ error: "No file uploaded" });

      const rows = await parseUploadRows(req.file);
      if (rows.length < 2) return res.status(400).json({ error: "File has no data rows" });

      const headerRow = rows[0].map(normalizeHeader);
      const colIndex = {};
      for (const f of fields) {
        const idx = headerRow.indexOf(normalizeHeader(f.label));
        if (idx !== -1) colIndex[f.key] = idx;
      }

      const missingRequired = fields.filter((f) => f.required && colIndex[f.key] === undefined);
      if (missingRequired.length) {
        return res.status(400).json({
          error: `Missing required column(s): ${missingRequired.map((f) => f.label).join(", ")}. Use the downloadable template so columns line up automatically.`,
        });
      }

      let created = 0;
      const errors = [];
      for (let r = 1; r < rows.length; r++) {
        const raw = rows[r];
        if (!raw || raw.every((v) => v === "" || v == null)) continue;

        const record = {};
        for (const f of fields) {
          const idx = colIndex[f.key];
          let value = idx !== undefined ? raw[idx] : undefined;
          if (value === "") value = undefined;
          if (value !== undefined && f.parse) value = f.parse(value);
          record[f.key] = value;
        }

        try {
          const createdRecord = await createFn(record, req.tenantId, req.user.id);
          created++;
          if (entityType && createdRecord?.id) {
            await recordAudit({
              tenantId: req.tenantId,
              entityType,
              entityId: createdRecord.id,
              userId: req.user.id,
              action: "create",
              reason: `Imported from ${req.file.originalname}`,
            });
          }
        } catch (err) {
          errors.push({ row: r + 1, error: err.message });
        }
      }

      res.json({ created, errorCount: errors.length, errors: errors.slice(0, 20) });
    })
  );

  router.get(
    "/export",
    asyncHandler(async (req, res) => {
      const records = await listFn(req.tenantId);
      const buffer = await buildTemplateBuffer(fields).then(async () => {
        const workbook = new ExcelJS.Workbook();
        const sheet = workbook.addWorksheet("Export");
        const headerRow = sheet.addRow(fields.map((f) => f.label));
        headerRow.font = { bold: true };
        sheet.columns = fields.map((f) => ({ width: Math.max(16, f.label.length + 2) }));
        for (const record of records) {
          sheet.addRow(fields.map((f) => fieldValue(record, f.key) ?? ""));
        }
        return workbook.xlsx.writeBuffer();
      });
      res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
      res.setHeader("Content-Disposition", 'attachment; filename="export.xlsx"');
      res.send(buffer);
    })
  );
}

module.exports = { attachImportExport, buildTemplateBuffer, parseUploadRows, parseImportDate: (v) => v };
