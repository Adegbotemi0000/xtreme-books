const { pool } = require("../../db/pool");
const expensesModel = require("../expenses/model");

const SAFETY_MAX_OCCURRENCES = 24; // guards against a runaway loop if a template is very old/mis-set

// Adds one interval to a DATE string, clamping to the end of the resulting
// month when the original day doesn't exist there (31 Jan + 1 month lands on
// 28/29 Feb, never rolls into March) — the standard "recurring billing date"
// convention every subscription system uses.
function addInterval(dateStr, frequency) {
  const d = new Date(`${dateStr}T00:00:00Z`);
  const day = d.getUTCDate();
  if (frequency === "weekly") {
    d.setUTCDate(d.getUTCDate() + 7);
  } else {
    const months = frequency === "monthly" ? 1 : frequency === "quarterly" ? 3 : 12;
    d.setUTCMonth(d.getUTCMonth() + months);
    if (d.getUTCDate() !== day) d.setUTCDate(0);
  }
  return d.toISOString().slice(0, 10);
}

async function list(tenantId) {
  const { rows } = await pool.query(
    `SELECT r.*, c.name AS category_name, a.name AS account_name FROM recurring_expenses r
     LEFT JOIN categories c ON c.id = r.category_id
     JOIN accounts a ON a.id = r.account_id
     WHERE r.tenant_id = $1 AND r.deleted_at IS NULL
     ORDER BY r.next_run_date ASC, r.id ASC`,
    [tenantId]
  );
  return rows;
}

async function findById(tenantId, id) {
  const { rows } = await pool.query(
    "SELECT * FROM recurring_expenses WHERE tenant_id = $1 AND id = $2 AND deleted_at IS NULL",
    [tenantId, id]
  );
  return rows[0];
}

async function create(tenantId, { description, categoryId, amount, paymentMethod, accountId, frequency, nextRunDate, endDate }, userId) {
  const { rows } = await pool.query(
    `INSERT INTO recurring_expenses (tenant_id, description, category_id, amount, payment_method, account_id, frequency, next_run_date, end_date, created_by)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
    [tenantId, description, categoryId || null, amount, paymentMethod || "cash", accountId, frequency, nextRunDate, endDate || null, userId]
  );
  return rows[0];
}

async function setActive(tenantId, id, isActive) {
  const { rows } = await pool.query(
    "UPDATE recurring_expenses SET is_active = $3, updated_at = now() WHERE tenant_id = $1 AND id = $2 AND deleted_at IS NULL RETURNING *",
    [tenantId, id, isActive]
  );
  return rows[0];
}

async function softDelete(tenantId, id, userId) {
  const { rows } = await pool.query(
    "UPDATE recurring_expenses SET deleted_at = now(), deleted_by = $3 WHERE tenant_id = $1 AND id = $2 AND deleted_at IS NULL RETURNING *",
    [tenantId, id, userId]
  );
  return rows[0];
}

// Catches every template up to today, one generated expense per occurrence
// it missed — not one lump sum — so a template nobody looked at for three
// months still produces three separate dated expense rows, same as if
// someone had entered them by hand each month. Each occurrence goes through
// expensesModel.create() so it gets the exact same GL posting a manual
// expense would; a failure on one occurrence stops that template's catch-up
// loop there — its next_run_date is left at the failed occurrence so it's
// retried next time — but doesn't block any other template from generating.
async function generateDue(tenantId, userId) {
  const today = new Date().toISOString().slice(0, 10);
  const { rows: templates } = await pool.query(
    "SELECT * FROM recurring_expenses WHERE tenant_id = $1 AND is_active AND deleted_at IS NULL AND next_run_date <= $2",
    [tenantId, today]
  );

  let generated = 0;
  const errors = [];

  for (const t of templates) {
    let nextRunDate = t.next_run_date.toISOString().slice(0, 10);
    let lastGeneratedDate = t.last_generated_date;
    let lastGeneratedExpenseId = t.last_generated_expense_id;
    let occurrences = 0;
    const endDate = t.end_date ? t.end_date.toISOString().slice(0, 10) : null;

    while (nextRunDate <= today && occurrences < SAFETY_MAX_OCCURRENCES) {
      if (endDate && nextRunDate > endDate) break;
      try {
        const expense = await expensesModel.create(
          tenantId,
          {
            date: nextRunDate,
            categoryId: t.category_id,
            description: t.description,
            amount: t.amount,
            paymentMethod: t.payment_method,
            accountId: t.account_id,
          },
          userId
        );
        generated++;
        lastGeneratedDate = nextRunDate;
        lastGeneratedExpenseId = expense.id;
        nextRunDate = addInterval(nextRunDate, t.frequency);
        occurrences++;
      } catch (err) {
        errors.push({ recurringExpenseId: t.id, description: t.description, date: nextRunDate, error: err.message });
        break;
      }
    }

    const isStillActive = t.is_active && !(endDate && nextRunDate > endDate);
    await pool.query(
      `UPDATE recurring_expenses SET next_run_date = $3, last_generated_date = $4, last_generated_expense_id = $5,
         is_active = $6, updated_at = now()
       WHERE tenant_id = $1 AND id = $2`,
      [tenantId, t.id, nextRunDate, lastGeneratedDate, lastGeneratedExpenseId, isStillActive]
    );
  }

  return { generated, errors };
}

module.exports = { list, findById, create, setActive, softDelete, generateDue };
