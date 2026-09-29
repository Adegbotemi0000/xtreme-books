import { useRef, useState } from "react";
import { Download, Upload, FileSpreadsheet } from "lucide-react";
import { apiDownload, apiUpload } from "../api/client";

// Reusable "download template / import filled-in file / export" bar for any
// module whose backend attached importFields via attachImportExport (see
// backend/src/utils/importExport.js). basePath is the module's API root,
// e.g. "/customers". Ported from xtreme-finance-system's ImportExport.jsx.
export function ImportExport({ basePath, onImported }) {
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const fileRef = useRef(null);

  async function handleTemplate() {
    setError("");
    try {
      await apiDownload(`${basePath}/import-template`);
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleExport() {
    setError("");
    try {
      await apiDownload(`${basePath}/export`);
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleFileChange(e) {
    const file = e.target.files[0];
    if (!file) return;
    setBusy(true);
    setError("");
    setResult(null);
    try {
      const res = await apiUpload(`${basePath}/import`, file);
      setResult(res);
      onImported?.();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  return (
    <div className="import-export-bar">
      <button type="button" className="btn secondary" onClick={handleTemplate}>
        <Download size={14} /> Template
      </button>
      <button type="button" className="btn secondary" disabled={busy} onClick={() => fileRef.current?.click()}>
        <Upload size={14} /> {busy ? "Importing..." : "Import"}
      </button>
      <button type="button" className="btn secondary" onClick={handleExport}>
        <FileSpreadsheet size={14} /> Export
      </button>
      <input ref={fileRef} type="file" accept=".xlsx,.csv" hidden onChange={handleFileChange} />
      {error && <span className="import-export-msg import-export-error">{error}</span>}
      {result && (
        <span className="import-export-msg">
          Imported {result.created}
          {result.errorCount > 0 && `, ${result.errorCount} failed`}
        </span>
      )}
    </div>
  );
}
