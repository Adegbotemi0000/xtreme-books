-- Point of Sale: walk-in sale mode, tied into the same inventory and GL
-- posting engine as invoicing — docs/02-modules.md 2.2.
CREATE SEQUENCE pos_sale_number_seq;

CREATE TABLE pos_sales (
  id SERIAL PRIMARY KEY,
  tenant_id INTEGER NOT NULL REFERENCES tenants(id),
  branch_id INTEGER REFERENCES branches(id),
  sale_number TEXT NOT NULL,
  date DATE NOT NULL,
  subtotal NUMERIC(14, 2) NOT NULL DEFAULT 0,
  vat_amount NUMERIC(14, 2) NOT NULL DEFAULT 0,
  total NUMERIC(14, 2) NOT NULL DEFAULT 0,
  payment_method TEXT NOT NULL CHECK (payment_method IN ('cash', 'bank_transfer', 'pos_card', 'split')),
  status TEXT NOT NULL DEFAULT 'completed' CHECK (status IN ('completed', 'refunded', 'voided')),
  created_by INTEGER REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, sale_number)
);

CREATE TABLE pos_sale_items (
  id SERIAL PRIMARY KEY,
  pos_sale_id INTEGER NOT NULL REFERENCES pos_sales(id),
  product_id INTEGER NOT NULL REFERENCES products(id),
  description TEXT NOT NULL,
  quantity NUMERIC(14, 2) NOT NULL,
  unit_price NUMERIC(14, 2) NOT NULL,
  unit_cost NUMERIC(14, 2) NOT NULL DEFAULT 0,
  line_total NUMERIC(14, 2) NOT NULL
);
