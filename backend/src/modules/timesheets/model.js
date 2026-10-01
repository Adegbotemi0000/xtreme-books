const { pool } = require("../../db/pool");

async function list(tenantId) {
  const { rows } = await pool.query(
    `SELECT t.*, s.name AS staff_name, p.name AS project_name
     FROM timesheet_entries t
     JOIN staff s ON s.id = t.staff_id
     LEFT JOIN projects p ON p.id = t.project_id
     WHERE t.tenant_id = $1 AND t.deleted_at IS NULL
     ORDER BY t.date DESC, t.id DESC`,
    [tenantId]
  );
  return rows;
}

async function create(tenantId, { staffId, projectId, date, hours, taskDescription }, userId) {
  const { rows } = await pool.query(
    `INSERT INTO timesheet_entries (tenant_id, staff_id, project_id, date, hours, task_description, created_by)
     VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
    [tenantId, staffId, projectId || null, date, hours, taskDescription || null, userId]
  );
  return rows[0];
}

async function softDelete(tenantId, id, userId) {
  const { rows } = await pool.query(
    "UPDATE timesheet_entries SET deleted_at = now(), deleted_by = $3 WHERE tenant_id = $1 AND id = $2 AND deleted_at IS NULL RETURNING *",
    [tenantId, id, userId]
  );
  return rows[0];
}

module.exports = { list, create, softDelete };
