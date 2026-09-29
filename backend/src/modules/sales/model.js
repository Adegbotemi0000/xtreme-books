const { pool } = require("../../db/pool");
const { postInvoiceIssued, postInvoicePaymentReceived } = require("../journals/postingRules");
const { reverseEntriesForSource } = require("../journals/model");

function computeTotals(items) {
  const subtotal = items.reduce((sum, i) => sum + Number(i.quantity) * Number(i.unitPrice), 0);
  const vatAmount = items.reduce(
    (sum, i) => sum + Number(i.quantity) * Number(i.unitPrice) * (Number(i.vatRate ?? 7.5) / 100),
    0
  );
  return { subtotal: round2(subtotal), vatAmount: round2(vatAmount), total: round2(subtotal + vatAmount) };
}

function round2(n) {
  return Math.round(n * 100) / 100;
}

async function listInvoices(tenantId) {
  const { rows } = await pool.query(
    `SELECT i.*, c.name AS customer_name FROM invoices i
     JOIN customers c ON c.id = i.customer_id
     WHERE i.tenant_id = $1 AND i.deleted_at IS NULL ORDER BY i.date DESC, i.id DESC`,
    [tenantId]
  );
  return rows;
}

async function getInvoice(tenantId, id) {
  const { rows: invoiceRows } = await pool.query(
    `SELECT i.*, c.name AS customer_name FROM invoices i
     JOIN customers c ON c.id = i.customer_id
     WHERE i.tenant_id = $1 AND i.id = $2 AND i.deleted_at IS NULL`,
    [tenantId, id]
  );
  if (!invoiceRows[0]) return null;
  const { rows: items } = await pool.query("SELECT * FROM invoice_items WHERE invoice_id = $1", [id]);
  const { rows: payments } = await pool.query(
    "SELECT * FROM payments WHERE invoice_id = $1 AND is_reversed = false ORDER BY date",
    [id]
  );
  return { ...invoiceRows[0], items, payments };
}

// Creates as draft — issuing (postInvoiceIssued) happens as a separate step so
// a tenant can review before it hits the books, per docs/02-modules.md's
// Draft -> Issued -> ... status flow.
async function createInvoice(
  tenantId,
  { customerId, date, dueDate, items, buyerTin, sellerTin, customerNotes, terms },
  userId
) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const seq = await client.query("SELECT nextval('invoice_number_seq') AS n");
    const invoiceNumber = `INV-${new Date().getFullYear()}-${String(seq.rows[0].n).padStart(5, "0")}`;
    const { subtotal, vatAmount, total } = computeTotals(items);

    const invoice = await client.query(
      `INSERT INTO invoices (tenant_id, customer_id, invoice_number, buyer_tin, seller_tin, date, due_date,
         subtotal, vat_amount, total, customer_notes, terms, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13) RETURNING *`,
      [
        tenantId,
        customerId,
        invoiceNumber,
        buyerTin || null,
        sellerTin || null,
        date,
        dueDate || null,
        subtotal,
        vatAmount,
        total,
        customerNotes || null,
        terms || null,
        userId,
      ]
    );

    for (const item of items) {
      await client.query(
        `INSERT INTO invoice_items (invoice_id, product_id, description, quantity, unit_price, line_total)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [invoice.rows[0].id, item.productId || null, item.description, item.quantity, item.unitPrice, round2(item.quantity * item.unitPrice)]
      );
    }

    await client.query("COMMIT");
    return invoice.rows[0];
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

// The moment an invoice becomes a real accounting fact — posts to the GL in
// the same transaction as the status flip, so a bad posting rolls the status
// change back too.
async function issueInvoice(tenantId, id, userId) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const { rows } = await client.query(
      "SELECT * FROM invoices WHERE tenant_id = $1 AND id = $2 AND status = 'draft' FOR UPDATE",
      [tenantId, id]
    );
    if (!rows[0]) throw Object.assign(new Error("Invoice not found or not a draft"), { status: 404 });

    await postInvoiceIssued(
      client,
      { tenantId, invoiceId: id, date: rows[0].date, subtotal: rows[0].subtotal, vatAmount: rows[0].vat_amount, total: rows[0].total },
      userId
    );

    const updated = await client.query(
      `UPDATE invoices SET status = 'issued', e_invoice_status = 'ready' WHERE id = $1 RETURNING *`,
      [id]
    );
    await client.query("COMMIT");
    return updated.rows[0];
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

async function recordPayment(tenantId, invoiceId, { amount, date, method, accountId, reference }, userId) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const { rows } = await client.query(
      "SELECT * FROM invoices WHERE tenant_id = $1 AND id = $2 FOR UPDATE",
      [tenantId, invoiceId]
    );
    if (!rows[0]) throw Object.assign(new Error("Invoice not found"), { status: 404 });

    await client.query(
      `INSERT INTO payments (tenant_id, direction, invoice_id, amount, date, method, account_id, reference, created_by)
       VALUES ($1, 'in', $2, $3, $4, $5, $6, $7, $8)`,
      [tenantId, invoiceId, amount, date, method, accountId, reference || null, userId]
    );

    await postInvoicePaymentReceived(client, { tenantId, invoiceId, date, amount, accountId }, userId);

    const newAmountPaid = round2(Number(rows[0].amount_paid) + Number(amount));
    const status = newAmountPaid >= Number(rows[0].total) ? "paid" : "partially_paid";
    const updated = await client.query(
      `UPDATE invoices SET amount_paid = $1, status = $2 WHERE id = $3 RETURNING *`,
      [newAmountPaid, status, invoiceId]
    );

    await client.query("COMMIT");
    return updated.rows[0];
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

async function cancelInvoice(tenantId, id, userId) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await reverseEntriesForSource(client, tenantId, "invoice", id, userId, "Invoice cancelled");
    const { rows } = await client.query(
      `UPDATE invoices SET status = 'cancelled' WHERE tenant_id = $1 AND id = $2 RETURNING *`,
      [tenantId, id]
    );
    await client.query("COMMIT");
    return rows[0];
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

async function receivablesAgeing(tenantId) {
  const { rows } = await pool.query(
    `SELECT i.id, i.invoice_number, c.name AS customer_name, i.due_date,
            (i.total - i.amount_paid) AS balance,
            GREATEST(CURRENT_DATE - i.due_date, 0) AS days_overdue
     FROM invoices i JOIN customers c ON c.id = i.customer_id
     WHERE i.tenant_id = $1 AND i.status IN ('issued', 'partially_paid') AND i.deleted_at IS NULL
     ORDER BY days_overdue DESC`,
    [tenantId]
  );
  return rows;
}

// --- Quotations ---

async function listQuotations(tenantId) {
  const { rows } = await pool.query(
    `SELECT q.*, c.name AS customer_name FROM quotations q
     JOIN customers c ON c.id = q.customer_id
     WHERE q.tenant_id = $1 AND q.deleted_at IS NULL ORDER BY q.date DESC, q.id DESC`,
    [tenantId]
  );
  return rows;
}

async function createQuotation(tenantId, { customerId, date, expiryDate, items }, userId) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const seq = await client.query("SELECT nextval('quotation_number_seq') AS n");
    const quotationNumber = `QUO-${new Date().getFullYear()}-${String(seq.rows[0].n).padStart(5, "0")}`;
    const { subtotal, vatAmount, total } = computeTotals(items);

    const quotation = await client.query(
      `INSERT INTO quotations (tenant_id, customer_id, quotation_number, date, expiry_date, subtotal, vat_amount, total, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
      [tenantId, customerId, quotationNumber, date, expiryDate || null, subtotal, vatAmount, total, userId]
    );

    for (const item of items) {
      await client.query(
        `INSERT INTO quotation_items (quotation_id, product_id, description, quantity, unit_price, line_total)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [quotation.rows[0].id, item.productId || null, item.description, item.quantity, item.unitPrice, round2(item.quantity * item.unitPrice)]
      );
    }

    await client.query("COMMIT");
    return quotation.rows[0];
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

async function convertQuotationToInvoice(tenantId, quotationId, userId) {
  const { rows: quoRows } = await pool.query(
    "SELECT * FROM quotations WHERE tenant_id = $1 AND id = $2 AND deleted_at IS NULL",
    [tenantId, quotationId]
  );
  if (!quoRows[0]) throw Object.assign(new Error("Quotation not found"), { status: 404 });

  const { rows: items } = await pool.query("SELECT * FROM quotation_items WHERE quotation_id = $1", [quotationId]);
  const invoice = await createInvoice(
    tenantId,
    {
      customerId: quoRows[0].customer_id,
      date: new Date().toISOString().slice(0, 10),
      items: items.map((i) => ({ productId: i.product_id, description: i.description, quantity: i.quantity, unitPrice: i.unit_price })),
    },
    userId
  );

  await pool.query(
    "UPDATE quotations SET status = 'converted', converted_invoice_id = $1 WHERE id = $2",
    [invoice.id, quotationId]
  );

  return invoice;
}

module.exports = {
  listInvoices,
  getInvoice,
  createInvoice,
  issueInvoice,
  recordPayment,
  cancelInvoice,
  receivablesAgeing,
  listQuotations,
  createQuotation,
  convertQuotationToInvoice,
};
