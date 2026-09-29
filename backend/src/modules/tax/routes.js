const express = require("express");
const { pool } = require("../../db/pool");
const { requireAuth, requireRole } = require("../../middleware/auth");
const { asyncHandler } = require("../../utils/asyncHandler");

const router = express.Router();
router.use(requireAuth);

// Tax types are a fixed set (vat/paye/wht/cit) seeded per tenant at signup —
// admin-configurable (enable/disable, rate) but never created/deleted, per
// docs/09-compliance-and-integrations.md.
router.get(
  "/types",
  asyncHandler(async (req, res) => {
    const { rows } = await pool.query("SELECT * FROM tax_types WHERE tenant_id = $1 ORDER BY code", [req.tenantId]);
    res.json(rows);
  })
);

router.patch(
  "/types/:id",
  requireRole("tenant_admin"),
  asyncHandler(async (req, res) => {
    const { rows } = await pool.query(
      "UPDATE tax_types SET is_enabled = $1, default_rate = $2 WHERE tenant_id = $3 AND id = $4 RETURNING *",
      [req.body.isEnabled, req.body.defaultRate ?? null, req.tenantId, req.params.id]
    );
    if (!rows[0]) return res.status(404).json({ error: "Tax type not found" });
    res.json(rows[0]);
  })
);

router.get(
  "/periods",
  asyncHandler(async (req, res) => {
    const { rows } = await pool.query(
      `SELECT tp.*, tt.code AS tax_code FROM tax_periods tp
       JOIN tax_types tt ON tt.id = tp.tax_type_id
       WHERE tp.tenant_id = $1 ORDER BY tp.period DESC`,
      [req.tenantId]
    );
    res.json(rows);
  })
);

router.post(
  "/periods",
  requireRole("tenant_admin", "accountant"),
  asyncHandler(async (req, res) => {
    const { taxTypeId, period, amountDue } = req.body;
    const { rows } = await pool.query(
      `INSERT INTO tax_periods (tenant_id, tax_type_id, period, amount_due) VALUES ($1, $2, $3, $4) RETURNING *`,
      [req.tenantId, taxTypeId, period, amountDue || 0]
    );
    res.status(201).json(rows[0]);
  })
);

// PAYE bands are admin-configured data, never hard-coded — Nigerian PAYE
// bands change with tax reform (most recently NTA 2025) and this product
// must survive that without a code change. No default bands are seeded;
// a tenant's admin enters their own current bands (from their accountant),
// and payroll's PAYE calculation reads whatever is configured here.
router.get(
  "/paye-bands",
  asyncHandler(async (req, res) => {
    const { rows } = await pool.query(
      "SELECT * FROM paye_bands WHERE tenant_id = $1 ORDER BY min_income",
      [req.tenantId]
    );
    res.json(rows);
  })
);

router.post(
  "/paye-bands",
  requireRole("tenant_admin"),
  asyncHandler(async (req, res) => {
    const { minIncome, maxIncome, rate } = req.body;
    const { rows } = await pool.query(
      `INSERT INTO paye_bands (tenant_id, min_income, max_income, rate) VALUES ($1, $2, $3, $4) RETURNING *`,
      [req.tenantId, minIncome, maxIncome || null, rate]
    );
    res.status(201).json(rows[0]);
  })
);

router.delete(
  "/paye-bands/:id",
  requireRole("tenant_admin"),
  asyncHandler(async (req, res) => {
    await pool.query("DELETE FROM paye_bands WHERE tenant_id = $1 AND id = $2", [req.tenantId, req.params.id]);
    res.json({ ok: true });
  })
);

module.exports = router;
