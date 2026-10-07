-- Multi-branch stock reporting: products.stock_quantity stays the single
-- tenant-wide total (every write path — POS, Production, manual adjust —
-- already targets it, and rewiring all of them to require a branch would be
-- a much bigger, riskier change than the reporting gap this closes). This
-- table adds an optional per-branch breakdown of that same total: an
-- adjustment can optionally say which branch it affects, building up a real
-- per-branch ledger over time. Stock never explicitly allocated to a branch
-- stays visible as "Unallocated" in the report (stock_quantity minus the
-- sum of branch rows) rather than silently vanishing.
CREATE TABLE product_branch_stock (
  id SERIAL PRIMARY KEY,
  tenant_id INTEGER NOT NULL REFERENCES tenants(id),
  product_id INTEGER NOT NULL REFERENCES products(id),
  branch_id INTEGER NOT NULL REFERENCES branches(id),
  quantity NUMERIC(14, 2) NOT NULL DEFAULT 0,
  UNIQUE (product_id, branch_id)
);
CREATE INDEX idx_product_branch_stock_tenant ON product_branch_stock (tenant_id, branch_id);
