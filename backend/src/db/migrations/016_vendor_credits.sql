-- Vendor/Supplier Credits: a credit note from a supplier, issued against a
-- category (reduces what we owe them, Dr AP / Cr General Expense — see
-- postVendorCreditIssued), then applied against one or more open purchases.
-- Applying a credit is pure allocation, not a new financial event (the Dr AP
-- already happened when the credit was issued), so it posts no GL entry of
-- its own — it just increases the purchase's amount_paid the same way a
-- real payment would, via vendor_credit_applications as the audit trail of
-- which credit paid down which purchase.
CREATE SEQUENCE vendor_credit_number_seq;

CREATE TABLE vendor_credits (
  id SERIAL PRIMARY KEY,
  tenant_id INTEGER NOT NULL REFERENCES tenants(id),
  credit_number TEXT NOT NULL,
  supplier_id INTEGER NOT NULL REFERENCES suppliers(id),
  date DATE NOT NULL,
  category_id INTEGER REFERENCES categories(id),
  amount NUMERIC(14, 2) NOT NULL,
  reason TEXT,
  is_voided BOOLEAN NOT NULL DEFAULT false,
  void_reason TEXT,
  created_by INTEGER REFERENCES users(id),
  deleted_at TIMESTAMPTZ,
  deleted_by INTEGER REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, credit_number)
);

CREATE TABLE vendor_credit_applications (
  id SERIAL PRIMARY KEY,
  vendor_credit_id INTEGER NOT NULL REFERENCES vendor_credits(id),
  purchase_id INTEGER NOT NULL REFERENCES purchases(id),
  amount NUMERIC(14, 2) NOT NULL,
  date DATE NOT NULL,
  created_by INTEGER REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_vendor_credits_tenant ON vendor_credits (tenant_id);
CREATE INDEX idx_vendor_credit_applications_credit ON vendor_credit_applications (vendor_credit_id);
CREATE INDEX idx_vendor_credit_applications_purchase ON vendor_credit_applications (purchase_id);
