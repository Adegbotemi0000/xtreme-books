const express = require("express");
const { pool } = require("../../db/pool");
const { requireAuth, requireRole } = require("../../middleware/auth");
const { asyncHandler } = require("../../utils/asyncHandler");

const router = express.Router();
router.use(requireAuth, requireRole("tenant_admin"));

router.get(
  "/",
  asyncHandler(async (req, res) => {
    const { rows } = await pool.query(
      `SELECT al.*, u.name AS user_name FROM audit_logs al
       LEFT JOIN users u ON u.id = al.user_id
       WHERE al.tenant_id = $1 ORDER BY al.created_at DESC LIMIT 200`,
      [req.tenantId]
    );
    res.json(rows);
  })
);

module.exports = router;
