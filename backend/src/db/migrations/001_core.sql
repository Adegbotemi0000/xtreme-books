-- Platform + tenant core: tenants, users, GL accounts, journals, audit log.
-- Every tenant-scoped table below carries tenant_id with zero exceptions —
-- see docs/04-data-model.md's multi-tenancy shape.

CREATE TABLE tenants (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  cac_number TEXT,
  tin TEXT,
  address TEXT,
  plan_code TEXT NOT NULL DEFAULT 'foundation' CHECK (plan_code IN ('foundation', 'momentum', 'enterprise')),
  verification_status TEXT NOT NULL DEFAULT 'pending' CHECK (verification_status IN ('pending', 'verified', 'failed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- tenant_id is NULL for platform (super-admin) staff — see docs/04-data-model.md
-- "What's deliberately not copied": every tenant gets its own admin at signup,
-- there is no single shared admin account.
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  tenant_id INTEGER REFERENCES tenants(id),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('tenant_admin', 'accountant', 'sales_operations', 'management', 'super_admin')),
  otp_enabled BOOLEAN NOT NULL DEFAULT false,
  otp_secret TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, email)
);

CREATE TABLE gl_accounts (
  id SERIAL PRIMARY KEY,
  tenant_id INTEGER NOT NULL REFERENCES tenants(id),
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('asset', 'liability', 'equity', 'income', 'expense')),
  parent_id INTEGER REFERENCES gl_accounts(id),
  is_system_account BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  UNIQUE (tenant_id, code)
);

CREATE SEQUENCE journal_entry_seq;

CREATE TABLE journal_entries (
  id SERIAL PRIMARY KEY,
  tenant_id INTEGER NOT NULL REFERENCES tenants(id),
  entry_number TEXT NOT NULL,
  date DATE NOT NULL,
  memo TEXT,
  source_type TEXT,
  source_id INTEGER,
  created_by INTEGER REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, entry_number)
);

-- Balance (sum(debit) = sum(credit)) is enforced in application code
-- (postEntry), not a DB constraint — Postgres can't cleanly CHECK a
-- one-to-many aggregate without a trigger. Matches xtreme-finance-system.
CREATE TABLE journal_lines (
  id SERIAL PRIMARY KEY,
  journal_entry_id INTEGER NOT NULL REFERENCES journal_entries(id),
  account_id INTEGER NOT NULL REFERENCES gl_accounts(id),
  debit NUMERIC(14, 2) NOT NULL DEFAULT 0 CHECK (debit >= 0),
  credit NUMERIC(14, 2) NOT NULL DEFAULT 0 CHECK (credit >= 0),
  description TEXT
);

CREATE INDEX journal_lines_account_idx ON journal_lines(account_id);
CREATE INDEX journal_lines_entry_idx ON journal_lines(journal_entry_id);

CREATE TABLE audit_logs (
  id SERIAL PRIMARY KEY,
  tenant_id INTEGER REFERENCES tenants(id),
  entity_type TEXT NOT NULL,
  entity_id INTEGER,
  user_id INTEGER REFERENCES users(id),
  action TEXT NOT NULL,
  old_value TEXT,
  new_value TEXT,
  reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX audit_logs_entity_idx ON audit_logs(entity_type, entity_id);
CREATE INDEX audit_logs_tenant_idx ON audit_logs(tenant_id);
