const express = require("express");
const { pool } = require("../../db/pool");
const { requireAuth, requireRole } = require("../../middleware/auth");
const { asyncHandler } = require("../../utils/asyncHandler");

const router = express.Router();
router.use(requireAuth, requireRole("tenant_admin"));

// One wallet row per tenant, created lazily on first view. Requires KYC
// verification before activation — see docs/09-compliance-and-integrations.md;
// the actual KYC/banking-partner integration is an open vendor question, so
// this stays a status-tracking stub until that's resolved.
router.get(
  "/",
  asyncHandler(async (req, res) => {
    const { rows } = await pool.query("SELECT * FROM wallets WHERE tenant_id = $1", [req.tenantId]);
    if (rows[0]) return res.json(rows[0]);
    const created = await pool.query(
      "INSERT INTO wallets (tenant_id) VALUES ($1) RETURNING *",
      [req.tenantId]
    );
    res.json(created.rows[0]);
  })
);

router.post(
  "/kyc/start",
  asyncHandler(async (req, res) => {
    const { rows } = await pool.query(
      "UPDATE wallets SET kyc_status = 'pending' WHERE tenant_id = $1 RETURNING *",
      [req.tenantId]
    );
    res.json(rows[0]);
  })
);

module.exports = router;
