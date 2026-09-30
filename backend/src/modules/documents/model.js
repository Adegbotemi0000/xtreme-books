const { pool } = require("../../db/pool");

const ALLOWED_ENTITY_TYPES = ["invoice", "purchase", "expense", "fixed_asset", "quotation", "loan", "product"];

async function create({ tenantId, entityType, entityId, originalFilename, mimeType, sizeBytes, buffer, userId }) {
  const { rows } = await pool.query(
    `INSERT INTO documents (tenant_id, entity_type, entity_id, original_filename, mime_type, size_bytes, file_data, uploaded_by)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     RETURNING id, tenant_id, entity_type, entity_id, original_filename, mime_type, size_bytes, uploaded_by, uploaded_at`,
    [tenantId, entityType, entityId, originalFilename, mimeType || null, sizeBytes || null, buffer, userId]
  );
  return rows[0];
}

async function listForEntity(tenantId, entityType, entityId) {
  const { rows } = await pool.query(
    `SELECT d.id, d.entity_type, d.entity_id, d.original_filename, d.mime_type, d.size_bytes, d.uploaded_at, u.name AS uploaded_by_name
     FROM documents d LEFT JOIN users u ON u.id = d.uploaded_by
     WHERE d.tenant_id = $1 AND d.entity_type = $2 AND d.entity_id = $3
     ORDER BY d.uploaded_at DESC`,
    [tenantId, entityType, entityId]
  );
  return rows;
}

async function findById(tenantId, id) {
  const { rows } = await pool.query("SELECT * FROM documents WHERE tenant_id = $1 AND id = $2", [tenantId, id]);
  return rows[0];
}

async function remove(tenantId, id) {
  const { rows } = await pool.query(
    "DELETE FROM documents WHERE tenant_id = $1 AND id = $2 RETURNING id, entity_type, entity_id, original_filename",
    [tenantId, id]
  );
  return rows[0];
}

module.exports = { ALLOWED_ENTITY_TYPES, create, listForEntity, findById, remove };
