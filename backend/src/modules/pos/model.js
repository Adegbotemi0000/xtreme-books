const { pool } = require("../../db/pool");
const { postPosSale, postPosCogs } = require("../journals/postingRules");

function round2(n) {
  return Math.round(n * 100) / 100;
}

async function list(tenantId) {
  const { rows } = await pool.query(
    "SELECT * FROM pos_sales WHERE tenant_id = $1 ORDER BY date DESC, id DESC",
    [tenantId]
  );
  return rows;
}

async function getSale(tenantId, id) {
  const { rows: saleRows } = await pool.query("SELECT * FROM pos_sales WHERE tenant_id = $1 AND id = $2", [tenantId, id]);
  if (!saleRows[0]) return null;
  const { rows: items } = await pool.query("SELECT * FROM pos_sale_items WHERE pos_sale_id = $1", [id]);
  return { ...saleRows[0], items };
}

// A walk-in sale is real, immediate money movement — posted to the GL and
// decrements stock in the same transaction as the sale itself, not staged
// as a draft like invoices.
async function createSale(tenantId, { items, paymentMethod, date }, userId) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const productIds = items.map((i) => i.productId);
    const { rows: products } = await client.query(
      "SELECT * FROM products WHERE tenant_id = $1 AND id = ANY($2::int[]) FOR UPDATE",
      [tenantId, productIds]
    );
    const productById = Object.fromEntries(products.map((p) => [p.id, p]));

    let subtotal = 0;
    let vatAmount = 0;
    let cogsAmount = 0;
    const lineDetails = [];

    for (const item of items) {
      const product = productById[item.productId];
      if (!product) throw Object.assign(new Error(`Product ${item.productId} not found`), { status: 404 });
      if (Number(product.stock_quantity) < Number(item.quantity)) {
        throw Object.assign(new Error(`Not enough stock for ${product.name}`), { status: 422 });
      }
      const lineTotal = round2(item.quantity * product.unit_price);
      const lineVat = round2(lineTotal * (Number(product.vat_rate) / 100));
      subtotal += lineTotal;
      vatAmount += lineVat;
      cogsAmount += round2(item.quantity * Number(product.cost));
      lineDetails.push({ product, lineTotal });
    }
    subtotal = round2(subtotal);
    vatAmount = round2(vatAmount);
    cogsAmount = round2(cogsAmount);
    const total = round2(subtotal + vatAmount);

    const seq = await client.query("SELECT nextval('pos_sale_number_seq') AS n");
    const saleNumber = `POS-${new Date().getFullYear()}-${String(seq.rows[0].n).padStart(5, "0")}`;

    const sale = await client.query(
      `INSERT INTO pos_sales (tenant_id, sale_number, date, subtotal, vat_amount, total, payment_method, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [tenantId, saleNumber, date, subtotal, vatAmount, total, paymentMethod, userId]
    );

    for (const item of items) {
      const { product, lineTotal } = lineDetails.find((d) => d.product.id === item.productId);
      await client.query(
        `INSERT INTO pos_sale_items (pos_sale_id, product_id, description, quantity, unit_price, unit_cost, line_total)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [sale.rows[0].id, product.id, product.name, item.quantity, product.unit_price, product.cost, lineTotal]
      );
      await client.query("UPDATE products SET stock_quantity = stock_quantity - $1 WHERE id = $2", [item.quantity, product.id]);
    }

    await postPosSale(client, { tenantId, saleId: sale.rows[0].id, date, subtotal, vatAmount, total }, userId);
    await postPosCogs(client, { tenantId, saleId: sale.rows[0].id, date, cogsAmount }, userId);

    await client.query("COMMIT");
    return sale.rows[0];
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

module.exports = { list, getSale, createSale };
