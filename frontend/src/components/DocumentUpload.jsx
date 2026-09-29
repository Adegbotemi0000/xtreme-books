import { useEffect, useRef, useState } from "react";
import { Paperclip, Download, Trash2 } from "lucide-react";
import { api, apiDownload, apiUpload } from "../api/client";

function fmtSize(bytes) {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// Receipt/document attachments directly on a transaction form — the same
// "attach the source document to the record it belongs to" bar as
// xtreme-finance-system, backed here by documents/routes.js (tenant-scoped,
// file bytes in Postgres since this runs as a Vercel serverless function).
export function DocumentUpload({ entityType, entityId }) {
  const [docs, setDocs] = useState([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef(null);

  function load() {
    api.get(`/documents?entityType=${entityType}&entityId=${entityId}`).then(setDocs).catch((err) => setError(err.message));
  }

  useEffect(load, [entityType, entityId]);

  async function handleFileChange(e) {
    const file = e.target.files[0];
    if (!file) return;
    setBusy(true);
    setError("");
    try {
      await apiUpload("/documents", file, { entityType, entityId });
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function handleDelete(id) {
    if (!confirm("Remove this attachment?")) return;
    await api.delete(`/documents/${id}`).catch((err) => setError(err.message));
    load();
  }

  return (
    <div className="card">
      <div className="dashboard-card-header">
        <h3>Attachments</h3>
        <button type="button" className="btn secondary" disabled={busy} onClick={() => fileRef.current?.click()}>
          <Paperclip size={14} /> {busy ? "Uploading..." : "Attach file"}
        </button>
        <input ref={fileRef} type="file" hidden onChange={handleFileChange} />
      </div>
      {error && <div className="error-banner">{error}</div>}
      {docs.length === 0 ? (
        <div className="empty-state">No receipts or documents attached yet.</div>
      ) : (
        <ul className="document-list">
          {docs.map((d) => (
            <li key={d.id}>
              <Paperclip size={14} className="document-list-icon" />
              <span className="document-list-name">{d.original_filename}</span>
              <span className="document-list-size">{fmtSize(d.size_bytes)}</span>
              <button type="button" className="icon-btn" title="Download" onClick={() => apiDownload(`/documents/${d.id}/download`)}>
                <Download size={14} />
              </button>
              <button type="button" className="icon-btn" title="Remove" onClick={() => handleDelete(d.id)}>
                <Trash2 size={14} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
