const { pool } = require("../../db/pool");

// Progressive calculation over whatever bands the tenant's admin has
// configured under Tax Centre — no rates or thresholds are hard-coded here.
// If no bands are configured yet, PAYE is 0 and the caller is expected to
// surface that as "not yet configured", not silently correct.
function calculateProgressivePaye(taxableIncome, bands) {
  let remaining = Number(taxableIncome);
  let paye = 0;
  const sorted = [...bands].sort((a, b) => Number(a.min_income) - Number(b.min_income));

  for (const band of sorted) {
    if (remaining <= 0) break;
    const min = Number(band.min_income);
    const max = band.max_income === null ? Infinity : Number(band.max_income);
    const bandWidth = max - min;
    if (taxableIncome <= min) continue;
    const amountInBand = Math.min(remaining, Math.min(taxableIncome, max) - min);
    if (amountInBand > 0) {
      paye += amountInBand * (Number(band.rate) / 100);
      remaining -= amountInBand;
    }
  }
  return Math.round(paye * 100) / 100;
}

async function getBands(tenantId) {
  const { rows } = await pool.query("SELECT * FROM paye_bands WHERE tenant_id = $1 ORDER BY min_income", [tenantId]);
  return rows;
}

async function list(tenantId) {
  const { rows } = await pool.query(
    `SELECT pe.*, s.name AS staff_name FROM payroll_entries pe
     JOIN staff s ON s.id = pe.staff_id
     WHERE pe.tenant_id = $1 ORDER BY pe.period DESC, pe.id DESC`,
    [tenantId]
  );
  return rows;
}

async function create(tenantId, { staffId, period, grossPay, daysMissed, pensionAmount }, userId) {
  const staffRows = await pool.query("SELECT * FROM staff WHERE tenant_id = $1 AND id = $2", [tenantId, staffId]);
  if (!staffRows.rows[0]) throw Object.assign(new Error("Staff member not found"), { status: 404 });

  const missed = Number(daysMissed || 0);
  const proratedGross = Number(grossPay) * (1 - missed / 30);

  const bands = await getBands(tenantId);
  const payeAmount = bands.length > 0 ? calculateProgressivePaye(proratedGross, bands) : 0;
  const pension = Number(pensionAmount || 0);
  const netPay = Math.round((proratedGross - payeAmount - pension) * 100) / 100;

  const { rows } = await pool.query(
    `INSERT INTO payroll_entries (tenant_id, staff_id, period, gross_pay, paye_amount, pension_amount, days_missed, net_pay)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
    [tenantId, staffId, period, Math.round(proratedGross * 100) / 100, payeAmount, pension, missed, netPay]
  );
  return { ...rows[0], bandsConfigured: bands.length > 0 };
}

module.exports = { calculateProgressivePaye, getBands, list, create };
