const { pool } = require("../../db/pool");

async function nextVoucherNumber(client, tenantId) {
  const { rows } = await client.query("SELECT nextval('production_voucher_number_seq') AS n");
  const year = new Date().getFullYear();
  return `PV-${year}-${String(rows[0].n).padStart(4, "0")}`;
}

async function listTemplates(tenantId) {
  const { rows } = await pool.query(
    `SELECT bt.*, p.name AS finished_product_name FROM bom_templates bt
     JOIN products p ON p.id = bt.finished_product_id
     WHERE bt.tenant_id = $1 ORDER BY bt.name ASC`,
    [tenantId]
  );
  return rows;
}

async function findTemplateById(tenantId, id) {
  const { rows } = await pool.query(
    "SELECT * FROM bom_templates WHERE tenant_id = $1 AND id = $2",
    [tenantId, id]
  );
  if (!rows[0]) return null;
  const { rows: items } = await pool.query(
    `SELECT bti.*, p.name AS material_name FROM bom_template_items bti
     JOIN products p ON p.id = bti.material_product_id WHERE bti.bom_template_id = $1`,
    [id]
  );
  return { ...rows[0], items };
}

async function createTemplate(tenantId, { name, finishedProductId, items }, userId) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const { rows } = await client.query(
      "INSERT INTO bom_templates (tenant_id, name, finished_product_id, created_by) VALUES ($1, $2, $3, $4) RETURNING *",
      [tenantId, name, finishedProductId, userId]
    );
    const template = rows[0];
    for (const item of items) {
      await client.query(
        "INSERT INTO bom_template_items (bom_template_id, material_product_id, quantity_per_unit) VALUES ($1, $2, $3)",
        [template.id, item.materialProductId, item.quantityPerUnit]
      );
    }
    await client.query("COMMIT");
    return template;
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

// A production voucher either uses a template's recipe (scaled by quantity
// produced, giving each material line a quantity_expected for wastage
// comparison) or an explicit material list passed directly — both consume
// materials and produce the finished good against the same products.stock_quantity
// column Inventory/Products already read, so stock reports stay accurate
// either way. Runs inside one transaction: a shortfall on any material rolls
// back the whole voucher rather than leaving a half-consumed recipe.
async function createVoucher(tenantId, { bomTemplateId, finishedProductId, quantityProduced, materials, notes }, userId) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    let materialLines = materials;
    let productId = finishedProductId;
    if (bomTemplateId) {
      const { rows: templateRows } = await client.query(
        "SELECT * FROM bom_templates WHERE tenant_id = $1 AND id = $2",
        [tenantId, bomTemplateId]
      );
      const template = templateRows[0];
      if (!template) throw Object.assign(new Error("Production template not found"), { status: 404 });
      productId = template.finished_product_id;
      const { rows: items } = await client.query(
        "SELECT * FROM bom_template_items WHERE bom_template_id = $1",
        [bomTemplateId]
      );
      materialLines = items.map((i) => {
        const expected = Number(i.quantity_per_unit) * Number(quantityProduced);
        const override = materials?.find((m) => Number(m.materialProductId) === i.material_product_id);
        return {
          materialProductId: i.material_product_id,
          quantityUsed: override ? Number(override.quantityUsed) : expected,
          quantityExpected: expected,
        };
      });
    }

    if (!materialLines || materialLines.length === 0) {
      throw Object.assign(new Error("At least one material is required"), { status: 422 });
    }

    const voucherNumber = await nextVoucherNumber(client, tenantId);
    const { rows } = await client.query(
      `INSERT INTO production_vouchers (tenant_id, voucher_number, bom_template_id, finished_product_id, quantity_produced, notes, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [tenantId, voucherNumber, bomTemplateId || null, productId, quantityProduced, notes || null, userId]
    );
    const voucher = rows[0];

    for (const line of materialLines) {
      const { rows: stockRows } = await client.query(
        "SELECT stock_quantity FROM products WHERE tenant_id = $1 AND id = $2 FOR UPDATE",
        [tenantId, line.materialProductId]
      );
      if (!stockRows[0]) throw Object.assign(new Error(`Material product ${line.materialProductId} not found`), { status: 404 });
      if (Number(stockRows[0].stock_quantity) < Number(line.quantityUsed)) {
        throw Object.assign(new Error(`Insufficient stock for material product ${line.materialProductId}`), { status: 409 });
      }

      await client.query(
        "INSERT INTO production_materials (production_voucher_id, material_product_id, quantity_used, quantity_expected) VALUES ($1, $2, $3, $4)",
        [voucher.id, line.materialProductId, line.quantityUsed, line.quantityExpected ?? null]
      );
      await client.query(
        "UPDATE products SET stock_quantity = stock_quantity - $1 WHERE tenant_id = $2 AND id = $3",
        [line.quantityUsed, tenantId, line.materialProductId]
      );
    }

    await client.query(
      "UPDATE products SET stock_quantity = stock_quantity + $1 WHERE tenant_id = $2 AND id = $3",
      [quantityProduced, tenantId, productId]
    );

    await client.query("COMMIT");
    return voucher;
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

async function listVouchers(tenantId) {
  const { rows } = await pool.query(
    `SELECT pv.*, p.name AS finished_product_name FROM production_vouchers pv
     JOIN products p ON p.id = pv.finished_product_id
     WHERE pv.tenant_id = $1 ORDER BY pv.created_at DESC`,
    [tenantId]
  );
  return rows;
}

async function findVoucherById(tenantId, id) {
  const { rows: vRows } = await pool.query(
    `SELECT pv.*, p.name AS finished_product_name FROM production_vouchers pv
     JOIN products p ON p.id = pv.finished_product_id
     WHERE pv.tenant_id = $1 AND pv.id = $2`,
    [tenantId, id]
  );
  const voucher = vRows[0];
  if (!voucher) return null;
  const { rows: materials } = await pool.query(
    `SELECT pm.*, p.name AS material_name FROM production_materials pm
     JOIN products p ON p.id = pm.material_product_id WHERE production_voucher_id = $1`,
    [id]
  );
  return { ...voucher, materials };
}

module.exports = { listTemplates, findTemplateById, createTemplate, createVoucher, listVouchers, findVoucherById };
