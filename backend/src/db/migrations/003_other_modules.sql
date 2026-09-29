-- Lightweight tables backing the modules scaffolded as basic list+create for
-- now (purchases, expenses, payroll, loans, fixed assets, tax, projects,
-- discounts, branches). GL posting and approval workflows for these land in
-- a follow-up pass — see docs/02-modules.md for the full target shape.

CREATE TABLE suppliers (
  id SERIAL PRIMARY KEY,
  tenant_id INTEGER NOT NULL REFERENCES tenants(id),
  name TEXT NOT NULL,
  tin TEXT,
  email TEXT,
  phone TEXT,
  address TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE SEQUENCE purchase_number_seq;

CREATE TABLE purchases (
  id SERIAL PRIMARY KEY,
  tenant_id INTEGER NOT NULL REFERENCES tenants(id),
  supplier_id INTEGER NOT NULL REFERENCES suppliers(id),
  purchase_number TEXT NOT NULL,
  date DATE NOT NULL,
  total NUMERIC(14, 2) NOT NULL DEFAULT 0,
  amount_paid NUMERIC(14, 2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending_approval' CHECK (status IN ('pending_approval', 'approved', 'paid', 'cancelled')),
  deleted_at TIMESTAMPTZ,
  created_by INTEGER REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, purchase_number)
);

CREATE TABLE categories (
  id SERIAL PRIMARY KEY,
  tenant_id INTEGER NOT NULL REFERENCES tenants(id),
  type TEXT NOT NULL CHECK (type IN ('expense', 'discount')),
  name TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true
);

CREATE TABLE expenses (
  id SERIAL PRIMARY KEY,
  tenant_id INTEGER NOT NULL REFERENCES tenants(id),
  category_id INTEGER REFERENCES categories(id),
  description TEXT NOT NULL,
  amount NUMERIC(14, 2) NOT NULL,
  date DATE NOT NULL,
  payment_method TEXT NOT NULL DEFAULT 'cash',
  account_id INTEGER REFERENCES accounts(id),
  approval_status TEXT NOT NULL DEFAULT 'approved' CHECK (approval_status IN ('pending', 'approved', 'rejected')),
  is_voided BOOLEAN NOT NULL DEFAULT false,
  deleted_at TIMESTAMPTZ,
  created_by INTEGER REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE staff (
  id SERIAL PRIMARY KEY,
  tenant_id INTEGER NOT NULL REFERENCES tenants(id),
  name TEXT NOT NULL,
  position TEXT,
  bank_name TEXT,
  bank_account_number TEXT,
  monthly_salary NUMERIC(14, 2) NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE payroll_entries (
  id SERIAL PRIMARY KEY,
  tenant_id INTEGER NOT NULL REFERENCES tenants(id),
  staff_id INTEGER NOT NULL REFERENCES staff(id),
  period TEXT NOT NULL,
  gross_pay NUMERIC(14, 2) NOT NULL,
  paye_amount NUMERIC(14, 2) NOT NULL DEFAULT 0,
  pension_amount NUMERIC(14, 2) NOT NULL DEFAULT 0,
  days_missed NUMERIC(5, 2) NOT NULL DEFAULT 0,
  net_pay NUMERIC(14, 2) NOT NULL,
  payment_status TEXT NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'partial', 'paid')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, staff_id, period)
);

CREATE TABLE paye_bands (
  id SERIAL PRIMARY KEY,
  tenant_id INTEGER NOT NULL REFERENCES tenants(id),
  min_income NUMERIC(14, 2) NOT NULL,
  max_income NUMERIC(14, 2),
  rate NUMERIC(5, 2) NOT NULL
);

CREATE TABLE loans (
  id SERIAL PRIMARY KEY,
  tenant_id INTEGER NOT NULL REFERENCES tenants(id),
  direction TEXT NOT NULL CHECK (direction IN ('given', 'taken')),
  counterparty_name TEXT NOT NULL,
  principal_amount NUMERIC(14, 2) NOT NULL,
  date DATE NOT NULL,
  due_date DATE,
  account_id INTEGER REFERENCES accounts(id),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'repaid', 'cancelled')),
  notes TEXT,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE fixed_assets (
  id SERIAL PRIMARY KEY,
  tenant_id INTEGER NOT NULL REFERENCES tenants(id),
  name TEXT NOT NULL,
  category TEXT,
  purchase_date DATE NOT NULL,
  cost NUMERIC(14, 2) NOT NULL,
  useful_life_years INTEGER NOT NULL,
  salvage_value NUMERIC(14, 2) NOT NULL DEFAULT 0,
  accumulated_depreciation NUMERIC(14, 2) NOT NULL DEFAULT 0,
  disposed_at DATE,
  disposal_proceeds NUMERIC(14, 2),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE tax_types (
  id SERIAL PRIMARY KEY,
  tenant_id INTEGER NOT NULL REFERENCES tenants(id),
  code TEXT NOT NULL CHECK (code IN ('vat', 'paye', 'wht', 'cit')),
  is_enabled BOOLEAN NOT NULL DEFAULT true,
  default_rate NUMERIC(5, 2),
  UNIQUE (tenant_id, code)
);

CREATE TABLE tax_periods (
  id SERIAL PRIMARY KEY,
  tenant_id INTEGER NOT NULL REFERENCES tenants(id),
  tax_type_id INTEGER NOT NULL REFERENCES tax_types(id),
  period TEXT NOT NULL,
  amount_due NUMERIC(14, 2) NOT NULL DEFAULT 0,
  filing_status TEXT NOT NULL DEFAULT 'not_filed' CHECK (filing_status IN ('not_filed', 'filed')),
  payment_status TEXT NOT NULL DEFAULT 'unpaid' CHECK (payment_status IN ('unpaid', 'paid')),
  is_locked BOOLEAN NOT NULL DEFAULT false
);

CREATE TABLE projects (
  id SERIAL PRIMARY KEY,
  tenant_id INTEGER NOT NULL REFERENCES tenants(id),
  name TEXT NOT NULL,
  code TEXT,
  customer_id INTEGER REFERENCES customers(id),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'on_hold')),
  budget NUMERIC(14, 2),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE discounts (
  id SERIAL PRIMARY KEY,
  tenant_id INTEGER NOT NULL REFERENCES tenants(id),
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('percentage', 'fixed')),
  value NUMERIC(14, 2) NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true
);

CREATE TABLE branches (
  id SERIAL PRIMARY KEY,
  tenant_id INTEGER NOT NULL REFERENCES tenants(id),
  name TEXT NOT NULL,
  address TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true
);

CREATE TABLE wallets (
  id SERIAL PRIMARY KEY,
  tenant_id INTEGER NOT NULL UNIQUE REFERENCES tenants(id),
  balance NUMERIC(14, 2) NOT NULL DEFAULT 0,
  virtual_account_number TEXT,
  partner_bank TEXT,
  kyc_status TEXT NOT NULL DEFAULT 'not_started' CHECK (kyc_status IN ('not_started', 'pending', 'verified', 'rejected'))
);
