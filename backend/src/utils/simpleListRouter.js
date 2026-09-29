const express = require("express");
const { pool } = require("../db/pool");
const { requireAuth } = require("../middleware/auth");
const { recordAudit } = require("../middleware/audit");
const { asyncHandler } = require("./asyncHandler");

// Generic list+create(+soft-delete) router for the modules whose full
// business logic (approval workflows, GL posting, depreciation runs, etc.)
// lands in a follow-up pass — see docs/02-modules.md for each module's
// target shape. Every page this backs is real and navigable now; the deeper
// logic is scaffolded, not faked.
//
// `table` must be a column-safe identifier we control (not user input).
function simpleListRouter({ table, entityType, columns, hasDeletedAt = true, orderBy = "id DESC" }) {
  const router = express.Router();
  router.use(requireAuth);

  const selectCols = hasDeletedAt ? `${table}.*` : `${table}.*`;
  const deletedFilter = hasDeletedAt ? `AND ${table}.deleted_at IS NULL` : "";

  router.get(
    "/",
    asyncHandler(async (req, res) => {
      const { rows } = await pool.query(
        `SELECT ${selectCols} FROM ${table} WHERE ${table}.tenant_id = $1 ${deletedFilter} ORDER BY ${table}.${orderBy}`,
        [req.tenantId]
      );
      res.json(rows);
    })
  );

  router.post(
    "/",
    asyncHandler(async (req, res) => {
      const keys = columns.filter((c) => req.body[c.key] !== undefined);
      const colNames = keys.map((c) => c.column).join(", ");
      const placeholders = keys.map((_, i) => `$${i + 2}`).join(", ");
      const values = keys.map((c) => req.body[c.key]);

      const { rows } = await pool.query(
        `INSERT INTO ${table} (tenant_id, ${colNames}) VALUES ($1, ${placeholders}) RETURNING *`,
        [req.tenantId, ...values]
      );
      await recordAudit({
        tenantId: req.tenantId,
        entityType,
        entityId: rows[0].id,
        userId: req.user.id,
        action: "create",
      });
      res.status(201).json(rows[0]);
    })
  );

  if (hasDeletedAt) {
    router.delete(
      "/:id",
      asyncHandler(async (req, res) => {
        const { rows } = await pool.query(
          `UPDATE ${table} SET deleted_at = now() WHERE tenant_id = $1 AND id = $2 RETURNING *`,
          [req.tenantId, req.params.id]
        );
        if (!rows[0]) return res.status(404).json({ error: "Not found" });
        await recordAudit({
          tenantId: req.tenantId,
          entityType,
          entityId: rows[0].id,
          userId: req.user.id,
          action: "archive",
        });
        res.json({ ok: true });
      })
    );
  }

  return router;
}

module.exports = { simpleListRouter };
