const { pool } = require("../../db/pool");
const { postVendorCreditIssued } = require("../journals/postingRules");
const { reverseEntriesForSource } = require("../journals/model");

async function nextCreditNumber(client, tenantId) {
  const { rows } = await client.query("SELECT nextval('vendor_credit_number_seq') AS n");
  const year = new Date().getFullYear();
  return `VC-${year}-${String(rows[0].n).padStart(5, "0")}`;
}

// balance = amount - whatever's already been applied to purchases, computed
// fresh each time rather than stored — one source of truth (the
// applications table), never a cached number that can drift.
const BALANCE_SELECT = `
  vc.*, s.name AS supplier_name, c.name AS category_name,
  COALESCE((SELECT SUM(a.amount) FROM vendor_credit_applications a WHERE a.vendor_credit_id = vc.id), 0) AS amount_applied
`;

function decorate(row) {
  const amountApplied = Number(row.amount_applied);
  return { ...row, amount_applied: amountApplied, balance: Number(row.amount) - amountApplied };
}

async function list(tenantId) {
  const { rows } = await pool.query(
    `SELECT ${BALANCE_SELECT}
     FROM vendor_credits vc
     JOIN suppliers s ON s.id = vc.supplier_id
     LEFT JOIN categories c ON c.id = vc.category_id
     WHERE vc.tenant_id = $1 AND vc.deleted_at IS NULL
     ORDER BY vc.date DESC, vc.id DESC`,
    [tenantId]
  );
  return rows.map(decorate);
}

async function findById(tenantId, id) {
  const { rows } = await pool.query(
    `SELECT ${BALANCE_SELECT}
     FROM vendor_credits vc
     JOIN suppliers s ON s.id = vc.supplier_id
     LEFT JOIN categories c ON c.id = vc.category_id
     WHERE vc.tenant_id = $1 AND vc.id = $2 AND vc.deleted_at IS NULL`,
    [tenantId, id]
  );
  if (!rows[0]) return null;
  const applications = (
    await pool.query(
      `SELECT a.*, p.purchase_number FROM vendor_credit_applications a JOIN purchases p ON p.id = a.purchase_id
       WHERE a.vendor_credit_id = $1 ORDER BY a.date, a.id`,
      [id]
    )
  ).rows;
  return { ...decorate(rows[0]), applications };
}

async function create(tenantId, { supplierId, date, categoryId, amount, reason }, userId) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const creditNumber = await nextCreditNumber(client, tenantId);
    const { rows } = await client.query(
      `INSERT INTO vendor_credits (tenant_id, credit_number, supplier_id, date, category_id, amount, reason, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [tenantId, creditNumber, supplierId, date, categoryId || null, amount, reason || null, userId]
    );
    const credit = rows[0];
    await postVendorCreditIssued(
      client,
      { tenantId, creditId: credit.id, date, amount, reason, creditNumber },
      userId
    );
    await client.query("COMMIT");
    return credit;
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

// Applying a credit is pure allocation — which open purchase it offsets —
// not a new financial event (the Dr AP already happened when the credit was
// issued), so no GL entry is posted here; it just raises the purchase's
// amount_paid the same way recordPayment does. Validates against both the
// credit's remaining balance and the purchase's remaining balance so neither
// can be over-applied. Runs inside one transaction with row locks so an
// apply and a void racing each other can't both read a stale balance.
async function applyToPurchase(tenantId, { vendorCreditId, purchaseId, amount, date }, userId) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const creditRes = await client.query(
      `SELECT vc.*, COALESCE((SELECT SUM(a.amount) FROM vendor_credit_applications a WHERE a.vendor_credit_id = vc.id), 0) AS amount_applied
       FROM vendor_credits vc WHERE vc.tenant_id = $1 AND vc.id = $2 AND vc.deleted_at IS NULL AND NOT vc.is_voided FOR UPDATE`,
      [tenantId, vendorCreditId]
    );
    const credit = creditRes.rows[0];
    if (!credit) throw Object.assign(new Error("Vendor credit not found or voided"), { status: 404 });
    const creditBalance = Number(credit.amount) - Number(credit.amount_applied);
    if (Number(amount) > creditBalance) {
      throw Object.assign(new Error(`Only ${creditBalance} remains on this credit`), { status: 400 });
    }

    const purchaseRes = await client.query(
      "SELECT * FROM purchases WHERE tenant_id = $1 AND id = $2 AND deleted_at IS NULL FOR UPDATE",
      [tenantId, purchaseId]
    );
    const purchase = purchaseRes.rows[0];
    if (!purchase) throw Object.assign(new Error("Purchase not found"), { status: 404 });
    if (purchase.supplier_id !== credit.supplier_id) {
      throw Object.assign(new Error("This credit belongs to a different supplier than the purchase"), { status: 400 });
    }
    const purchaseBalance = Number(purchase.total) - Number(purchase.amount_paid);
    if (Number(amount) > purchaseBalance) {
      throw Object.assign(new Error(`Only ${purchaseBalance} remains outstanding on this purchase`), { status: 400 });
    }

    const { rows } = await client.query(
      `INSERT INTO vendor_credit_applications (vendor_credit_id, purchase_id, amount, date, created_by)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [vendorCreditId, purchaseId, amount, date || new Date().toISOString().slice(0, 10), userId]
    );

    const newAmountPaid = Number(purchase.amount_paid) + Number(amount);
    const status = newAmountPaid >= Number(purchase.total) ? "paid" : purchase.status;
    await client.query("UPDATE purchases SET amount_paid = $1, status = $2 WHERE id = $3", [newAmountPaid, status, purchaseId]);

    await client.query("COMMIT");
    return rows[0];
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

// Void is only allowed before anything's been applied — same "can't rewrite
// something already relied on elsewhere" reasoning as expenses/invoices not
// allowing edits after a decision was acted on. Reverses the original
// Dr AP / Cr expense posting.
async function voidCredit(tenantId, id, reason, userId) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const { rows: creditRows } = await client.query(
      `SELECT vc.*, COALESCE((SELECT SUM(a.amount) FROM vendor_credit_applications a WHERE a.vendor_credit_id = vc.id), 0) AS amount_applied
       FROM vendor_credits vc WHERE vc.tenant_id = $1 AND vc.id = $2 AND vc.deleted_at IS NULL FOR UPDATE`,
      [tenantId, id]
    );
    const existing = creditRows[0];
    if (!existing || existing.is_voided) {
      await client.query("ROLLBACK");
      return null;
    }
    if (Number(existing.amount_applied) > 0) {
      throw Object.assign(
        new Error("This credit has already been applied to a purchase and cannot be voided — void the application first if it was entered in error"),
        { status: 400 }
      );
    }
    const { rows } = await client.query(
      "UPDATE vendor_credits SET is_voided = TRUE, void_reason = $3, updated_at = now() WHERE tenant_id = $1 AND id = $2 RETURNING *",
      [tenantId, id, reason]
    );
    await reverseEntriesForSource(client, tenantId, "vendor_credit", id, userId, `Vendor credit voided: ${existing.credit_number}`);
    await client.query("COMMIT");
    return rows[0];
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

module.exports = { list, findById, create, applyToPurchase, voidCredit };
