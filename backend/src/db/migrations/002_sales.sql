-- Sales/invoicing vertical slice: customers, products, invoices, quotations,
-- cash/bank accounts, payments. Every invoice captures buyer/seller TIN,
-- date, number and VAT regardless of e-invoicing status (see CLAUDE.md).

CREATE TABLE customers (
  id SERIAL PRIMARY KEY,
  tenant_id INTEGER NOT NULL REFERENCES tenants(id),
  name TEXT NOT NULL,
  tin TEXT,
  email TEXT,
  phone TEXT,
  address TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  deleted_at TIMESTAMPTZ,
  deleted_by INTEGER REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE products (
  id SERIAL PRIMARY KEY,
  tenant_id INTEGER NOT NULL REFERENCES tenants(id),
  name TEXT NOT NULL,
  sku TEXT,
  unit_price NUMERIC(14, 2) NOT NULL DEFAULT 0,
  cost NUMERIC(14, 2) NOT NULL DEFAULT 0,
  vat_rate NUMERIC(5, 2) NOT NULL DEFAULT 7.5,
  stock_quantity NUMERIC(14, 2) NOT NULL DEFAULT 0,
  reorder_level NUMERIC(14, 2) NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  deleted_at TIMESTAMPTZ,
  deleted_by INTEGER REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE SEQUENCE invoice_number_seq;
CREATE SEQUENCE quotation_number_seq;

CREATE TABLE invoices (
  id SERIAL PRIMARY KEY,
  tenant_id INTEGER NOT NULL REFERENCES tenants(id),
  customer_id INTEGER NOT NULL REFERENCES customers(id),
  invoice_number TEXT NOT NULL,
  irn TEXT,
  buyer_tin TEXT,
  seller_tin TEXT,
  date DATE NOT NULL,
  due_date DATE,
  subtotal NUMERIC(14, 2) NOT NULL DEFAULT 0,
  vat_amount NUMERIC(14, 2) NOT NULL DEFAULT 0,
  total NUMERIC(14, 2) NOT NULL DEFAULT 0,
  amount_paid NUMERIC(14, 2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'issued', 'partially_paid', 'paid', 'cancelled')),
  e_invoice_status TEXT NOT NULL DEFAULT 'not_ready' CHECK (e_invoice_status IN ('not_ready', 'ready', 'transmitted', 'failed')),
  deleted_at TIMESTAMPTZ,
  deleted_by INTEGER REFERENCES users(id),
  created_by INTEGER REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, invoice_number)
);

CREATE TABLE invoice_items (
  id SERIAL PRIMARY KEY,
  invoice_id INTEGER NOT NULL REFERENCES invoices(id),
  product_id INTEGER REFERENCES products(id),
  description TEXT NOT NULL,
  quantity NUMERIC(14, 2) NOT NULL,
  unit_price NUMERIC(14, 2) NOT NULL,
  line_total NUMERIC(14, 2) NOT NULL
);

CREATE TABLE quotations (
  id SERIAL PRIMARY KEY,
  tenant_id INTEGER NOT NULL REFERENCES tenants(id),
  customer_id INTEGER NOT NULL REFERENCES customers(id),
  quotation_number TEXT NOT NULL,
  date DATE NOT NULL,
  expiry_date DATE,
  subtotal NUMERIC(14, 2) NOT NULL DEFAULT 0,
  vat_amount NUMERIC(14, 2) NOT NULL DEFAULT 0,
  total NUMERIC(14, 2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'accepted', 'declined', 'converted')),
  converted_invoice_id INTEGER REFERENCES invoices(id),
  deleted_at TIMESTAMPTZ,
  created_by INTEGER REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, quotation_number)
);

CREATE TABLE quotation_items (
  id SERIAL PRIMARY KEY,
  quotation_id INTEGER NOT NULL REFERENCES quotations(id),
  product_id INTEGER REFERENCES products(id),
  description TEXT NOT NULL,
  quantity NUMERIC(14, 2) NOT NULL,
  unit_price NUMERIC(14, 2) NOT NULL,
  line_total NUMERIC(14, 2) NOT NULL
);

CREATE TABLE accounts (
  id SERIAL PRIMARY KEY,
  tenant_id INTEGER NOT NULL REFERENCES tenants(id),
  name TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'bank' CHECK (type IN ('cash', 'bank')),
  opening_balance NUMERIC(14, 2) NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE payments (
  id SERIAL PRIMARY KEY,
  tenant_id INTEGER NOT NULL REFERENCES tenants(id),
  direction TEXT NOT NULL CHECK (direction IN ('in', 'out')),
  invoice_id INTEGER REFERENCES invoices(id),
  purchase_id INTEGER,
  amount NUMERIC(14, 2) NOT NULL,
  date DATE NOT NULL,
  method TEXT NOT NULL CHECK (method IN ('cash', 'bank_transfer', 'pos_card', 'split')),
  account_id INTEGER REFERENCES accounts(id),
  reference TEXT,
  is_reversed BOOLEAN NOT NULL DEFAULT false,
  created_by INTEGER REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
