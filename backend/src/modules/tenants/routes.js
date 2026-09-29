const express = require("express");
const { pool } = require("../../db/pool");
const { requireAuth, requireRole } = require("../../middleware/auth");
const { asyncHandler } = require("../../utils/asyncHandler");
const { recordAudit } = require("../../middleware/audit");

const router = express.Router();
router.use(requireAuth);

router.get(
  "/me",
  asyncHandler(async (req, res) => {
    const { rows } = await pool.query("SELECT * FROM tenants WHERE id = $1", [req.tenantId]);
    res.json(rows[0]);
  })
);

// The "in dashboard overview, they set up their company details" step —
// gates the full nav in the frontend until this completes.
router.patch(
  "/me",
  requireRole("tenant_admin"),
  asyncHandler(async (req, res) => {
    const {
      name,
      cacNumber,
      tin,
      nin,
      bvn,
      address,
      logoUrl,
      industry,
      phone,
      website,
      fiscalYearStartMonth,
      brandColor,
    } = req.body;
    const { rows } = await pool.query(
      `UPDATE tenants SET name = COALESCE($1, name), cac_number = COALESCE($2, cac_number), tin = COALESCE($3, tin),
         nin = COALESCE($4, nin), bvn = COALESCE($5, bvn), address = $6, logo_url = COALESCE($7, logo_url),
         industry = $8, phone = $9, website = $10,
         fiscal_year_start_month = COALESCE($11, fiscal_year_start_month),
         brand_color = COALESCE($12, brand_color), setup_completed = true
       WHERE id = $13 RETURNING *`,
      [
        name || null,
        cacNumber || null,
        tin || null,
        nin || null,
        bvn || null,
        address || null,
        logoUrl || null,
        industry || null,
        phone || null,
        website || null,
        fiscalYearStartMonth || null,
        brandColor || null,
        req.tenantId,
      ]
    );
    await recordAudit({
      tenantId: req.tenantId,
      entityType: "tenant",
      entityId: req.tenantId,
      userId: req.user.id,
      action: "update",
      reason: "Company setup completed",
    });
    res.json(rows[0]);
  })
);

module.exports = router;
