const express = require("express");
const { pool } = require("../db/pool");
const { requireAuth } = require("../middleware/auth");
const { recordAudit } = require("../middleware/audit");
const { asyncHandler } = require("./asyncHandler");
const { attachImportExport } = require("./importExport");

// Generic list+create(+soft-delete) router for the modules whose full
// business logic (approval workflows, GL posting, depreciation runs, etc.)
// lands in a follow-up pass — see docs/02-modules.md for each module's
// target shape. Every page this backs is real and navigable now; the deeper
// logic is scaffolded, not faked.
//
// `table` must be a column-safe identifier we control (not user input).
// `importFields`, when given, attaches GET /import-template, POST /import,
// and GET /export using the same insert path as POST / — see importExport.js.
function simpleListRouter({ table, entityType, columns, hasDeletedAt = true, orderBy = "id DESC", importFields }) {
  const router = express.Router();
  router.use(requireAuth);

  const selectCols = hasDeletedAt ? `${table}.*` : `${table}.*`;
  const deletedFilter = hasDeletedAt ? `AND ${table}.deleted_at IS NULL` : "";

  // Pagination is opt-in via ?page= so every existing caller (the frontend's
  // own client-side-paginated SimpleListPage, until it's updated; any script
  // or integration hitting this endpoint today) keeps getting the plain
  // array it always has — only a caller that explicitly asks for a page
  // gets the {data, total, page, pageSize} shape back instead.
  router.get(
    "/",
    asyncHandler(async (req, res) => {
      if (req.query.page) {
        const page = Math.max(1, parseInt(req.query.page, 10) || 1);
        const pageSize = Math.min(200, Math.max(1, parseInt(req.query.pageSize, 10) || 25));
        const offset = (page - 1) * pageSize;
        const [{ rows }, { rows: countRows }] = await Promise.all([
          pool.query(
            `SELECT ${selectCols} FROM ${table} WHERE ${table}.tenant_id = $1 ${deletedFilter} ORDER BY ${table}.${orderBy} LIMIT $2 OFFSET $3`,
            [req.tenantId, pageSize, offset]
          ),
          pool.query(`SELECT COUNT(*)::int AS count FROM ${table} WHERE ${table}.tenant_id = $1 ${deletedFilter}`, [req.tenantId]),
        ]);
        return res.json({ data: rows, total: countRows[0].count, page, pageSize });
      }

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

  if (importFields) {
    attachImportExport(router, {
      fields: importFields,
      writeRoles: ["tenant_admin", "accountant"],
      entityType,
      createFn: async (record, tenantId, userId) => {
        const keys = columns.filter((c) => record[c.key] !== undefined);
        const colNames = keys.map((c) => c.column).join(", ");
        const placeholders = keys.map((_, i) => `$${i + 2}`).join(", ");
        const values = keys.map((c) => record[c.key]);
        const { rows } = await pool.query(
          `INSERT INTO ${table} (tenant_id, ${colNames}) VALUES ($1, ${placeholders}) RETURNING *`,
          [tenantId, ...values]
        );
        return rows[0];
      },
      listFn: async (tenantId) => {
        const { rows } = await pool.query(
          `SELECT ${table}.* FROM ${table} WHERE ${table}.tenant_id = $1 ${deletedFilter} ORDER BY ${table}.${orderBy}`,
          [tenantId]
        );
        return rows;
      },
    });
  }

  return router;
}

module.exports = { simpleListRouter };
