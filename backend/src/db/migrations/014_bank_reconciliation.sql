-- Bank statement reconciliation, phase 1: CSV/XLSX upload only (PDF/OCR is a
-- separate, much bigger lift — xtreme-finance-system added it as a later
-- pass for the same reason). Each upload becomes an "import" (a worksheet)
-- with one row per statement line; lines start unmatched and get tied to an
-- existing payment/expense the admin confirms, or a new expense created
-- directly from the unmatched line. Deleting an import removes the
-- worksheet only — it never touches the real payments/expenses a line was
-- matched to, so this isn't "financial record deletion" in the CLAUDE.md
-- sense and doesn't need Trash/soft-delete.
CREATE TABLE bank_statement_imports (
  id SERIAL PRIMARY KEY,
  tenant_id INTEGER NOT NULL REFERENCES tenants(id),
  account_id INTEGER NOT NULL REFERENCES accounts(id),
  original_filename VARCHAR(255) NOT NULL,
  imported_by INTEGER REFERENCES users(id),
  imported_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE bank_statement_lines (
  id SERIAL PRIMARY KEY,
  import_id INTEGER NOT NULL REFERENCES bank_statement_imports(id) ON DELETE CASCADE,
  tenant_id INTEGER NOT NULL REFERENCES tenants(id),
  account_id INTEGER NOT NULL REFERENCES accounts(id),
  date DATE NOT NULL,
  description VARCHAR(500),
  amount NUMERIC(14, 2) NOT NULL, -- signed: positive = money in, negative = money out, matching the statement's own convention
  reference VARCHAR(100),
  status VARCHAR(20) NOT NULL DEFAULT 'unmatched' CHECK (status IN ('unmatched', 'matched', 'ignored')),
  matched_source_type VARCHAR(20) CHECK (matched_source_type IN ('payment', 'expense')),
  matched_source_id INTEGER,
  matched_by INTEGER REFERENCES users(id),
  matched_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_bank_statement_lines_import ON bank_statement_lines (import_id);
CREATE INDEX idx_bank_statement_lines_tenant_account_date ON bank_statement_lines (tenant_id, account_id, date);
