-- Repayment tracking for loans (docs/02-modules.md 2.9) — partial repayments
-- supported, never hard-deleted.
CREATE TABLE loan_repayments (
  id SERIAL PRIMARY KEY,
  loan_id INTEGER NOT NULL REFERENCES loans(id),
  tenant_id INTEGER NOT NULL REFERENCES tenants(id),
  amount NUMERIC(14, 2) NOT NULL,
  date DATE NOT NULL,
  account_id INTEGER REFERENCES accounts(id),
  created_by INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
