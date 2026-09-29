-- Supporting document attachments (receipts, supplier invoices, scanned POs)
-- for transaction forms — the "receipt/document upload directly in
-- transaction forms" baseline from xtreme-finance-system's feature-parity
-- bar. Polymorphic on purpose (entity_type + entity_id, no FK) so one table
-- serves every module rather than a per-module documents table each needing
-- its own upload/list/delete endpoints.
--
-- File bytes live in the row (file_data BYTEA) rather than on disk: this app
-- runs as a Vercel serverless function, whose filesystem is ephemeral and
-- shared by no two invocations, so disk storage (xtreme-finance-system's
-- approach) would silently lose every file. Receipts are small; Postgres
-- storing them directly keeps the stack boring with zero new infrastructure.
CREATE TABLE documents (
  id SERIAL PRIMARY KEY,
  tenant_id INTEGER NOT NULL REFERENCES tenants(id),
  entity_type VARCHAR(30) NOT NULL,
  entity_id INTEGER NOT NULL,
  original_filename VARCHAR(255) NOT NULL,
  mime_type VARCHAR(100),
  size_bytes INTEGER,
  file_data BYTEA NOT NULL,
  uploaded_by INTEGER REFERENCES users(id),
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_documents_entity ON documents (tenant_id, entity_type, entity_id);
