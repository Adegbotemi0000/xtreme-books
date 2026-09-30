-- Recurring Expenses: a template that generates real expenses on a
-- schedule, each one going through the exact same expensesModel.create()
-- path (and GL posting) a manually-entered expense would — never a separate
-- posting path. Matches xtreme-finance-system's recurring_expenses table,
-- minus supplier_id (Kora's own Expenses module doesn't track a supplier
-- on an expense either, so this doesn't add a field the base module lacks).
CREATE TABLE recurring_expenses (
  id SERIAL PRIMARY KEY,
  tenant_id INTEGER NOT NULL REFERENCES tenants(id),
  description TEXT NOT NULL,
  category_id INTEGER REFERENCES categories(id),
  amount NUMERIC(14, 2) NOT NULL,
  payment_method VARCHAR(20) NOT NULL DEFAULT 'cash',
  account_id INTEGER NOT NULL REFERENCES accounts(id),
  frequency VARCHAR(10) NOT NULL CHECK (frequency IN ('weekly', 'monthly', 'quarterly', 'yearly')),
  next_run_date DATE NOT NULL,
  end_date DATE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_generated_date DATE,
  last_generated_expense_id INTEGER,
  created_by INTEGER REFERENCES users(id),
  deleted_at TIMESTAMPTZ,
  deleted_by INTEGER REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_recurring_expenses_tenant ON recurring_expenses (tenant_id, next_run_date);
