-- Production tracking: raw materials consumed into a finished good, with an
-- optional reusable recipe (bom_templates) so a production voucher can
-- auto-fill quantities instead of re-entering the material list every time.
-- quantity_expected on production_materials (recipe quantity_per_unit x
-- quantity_produced, when a template was used) lets the voucher detail show
-- wastage = quantity_used - quantity_expected per material — the gap
-- between what the recipe called for and what was actually consumed.
CREATE SEQUENCE production_voucher_number_seq;

CREATE TABLE bom_templates (
  id SERIAL PRIMARY KEY,
  tenant_id INTEGER NOT NULL REFERENCES tenants(id),
  name VARCHAR(150) NOT NULL,
  finished_product_id INTEGER NOT NULL REFERENCES products(id),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by INTEGER REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE bom_template_items (
  id SERIAL PRIMARY KEY,
  bom_template_id INTEGER NOT NULL REFERENCES bom_templates(id) ON DELETE CASCADE,
  material_product_id INTEGER NOT NULL REFERENCES products(id),
  quantity_per_unit NUMERIC(14, 4) NOT NULL CHECK (quantity_per_unit > 0)
);
CREATE INDEX idx_bom_items_template ON bom_template_items (bom_template_id);

CREATE TABLE production_vouchers (
  id SERIAL PRIMARY KEY,
  tenant_id INTEGER NOT NULL REFERENCES tenants(id),
  voucher_number VARCHAR(30) NOT NULL,
  bom_template_id INTEGER REFERENCES bom_templates(id),
  finished_product_id INTEGER NOT NULL REFERENCES products(id),
  quantity_produced NUMERIC(14, 2) NOT NULL CHECK (quantity_produced > 0),
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  notes TEXT,
  created_by INTEGER REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, voucher_number)
);

CREATE TABLE production_materials (
  id SERIAL PRIMARY KEY,
  production_voucher_id INTEGER NOT NULL REFERENCES production_vouchers(id) ON DELETE CASCADE,
  material_product_id INTEGER NOT NULL REFERENCES products(id),
  quantity_used NUMERIC(14, 4) NOT NULL CHECK (quantity_used > 0),
  quantity_expected NUMERIC(14, 4)
);
CREATE INDEX idx_production_materials_voucher ON production_materials (production_voucher_id);
