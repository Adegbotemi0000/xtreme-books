-- Per-category monthly budgets, tracked against actual expense spend.
-- budget_lines replaces its whole line set on every edit (see model.js
-- update()) rather than diffing — lines have no standalone audit value
-- worth preserving row-by-row.
CREATE TABLE budgets (
  id SERIAL PRIMARY KEY,
  tenant_id INTEGER NOT NULL REFERENCES tenants(id),
  name TEXT NOT NULL,
  fiscal_year INTEGER NOT NULL,
  created_by INTEGER REFERENCES users(id),
  deleted_at TIMESTAMPTZ,
  deleted_by INTEGER REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE budget_lines (
  id SERIAL PRIMARY KEY,
  budget_id INTEGER NOT NULL REFERENCES budgets(id) ON DELETE CASCADE,
  category_id INTEGER NOT NULL REFERENCES categories(id),
  monthly_amount NUMERIC(14, 2) NOT NULL
);

CREATE INDEX idx_budgets_tenant ON budgets (tenant_id, fiscal_year);
CREATE INDEX idx_budget_lines_budget ON budget_lines (budget_id);
