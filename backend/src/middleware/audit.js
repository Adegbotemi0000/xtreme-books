const { pool } = require("../db/pool");

// Writes to audit_logs after the real business action already committed.
// Swallows its own errors (logs loudly, never throws) so a transient audit
// write can never turn a successful create/update into a 500 — matches
// xtreme-finance-system's recordAudit.
async function recordAudit({ tenantId, entityType, entityId, userId, action, oldValue, newValue, reason }) {
  try {
    await pool.query(
      `INSERT INTO audit_logs (tenant_id, entity_type, entity_id, user_id, action, old_value, new_value, reason)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [tenantId, entityType, entityId, userId, action, oldValue ?? null, newValue ?? null, reason ?? null]
    );
  } catch (err) {
    console.error("Failed to record audit log", err);
  }
}

module.exports = { recordAudit };
