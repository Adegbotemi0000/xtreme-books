import { useEffect, useMemo, useState } from "react";
import { Search } from "lucide-react";
import { api } from "../api/client";
import { ImportExport } from "./ImportExport";

// Generic list+create page for modules scaffolded at basic-CRUD depth for
// now (approval workflows / GL posting / depreciation runs land per-module
// next). Real data, real backend — just not the full business logic yet.
export function SimpleListPage({ title, description, apiPath, columns, formFields, hideDelete, importable }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [query, setQuery] = useState("");

  function load() {
    setLoading(true);
    api
      .get(apiPath)
      .then(setRows)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }

  useEffect(load, [apiPath]);

  const filteredRows = useMemo(() => {
    if (!query.trim()) return rows;
    const q = query.toLowerCase();
    return rows.filter((row) =>
      columns.some((c) => String(c.render ? c.render(row) : row[c.key] ?? "").toLowerCase().includes(q))
    );
  }, [rows, query, columns]);

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      await api.post(apiPath, form);
      setForm({});
      setShowForm(false);
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id) {
    if (!confirm("Archive this record?")) return;
    await api.delete(`${apiPath}/${id}`).catch((err) => setError(err.message));
    load();
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>{title}</h1>
          {description && <p style={{ color: "var(--muted)", marginTop: 4 }}>{description}</p>}
        </div>
        <button className="btn" onClick={() => setShowForm((v) => !v)}>
          {showForm ? "Cancel" : `+ New ${title.replace(/s$/, "")}`}
        </button>
      </div>

      {error && <div className="error-banner">{error}</div>}

      {showForm && (
        <div className="card" style={{ marginBottom: 16 }}>
          <form onSubmit={handleSubmit} className="form-grid">
            {formFields.map((f) => (
              <div className="field" key={f.key}>
                <label>{f.label}</label>
                <input
                  type={f.type || "text"}
                  step={f.type === "number" ? "0.01" : undefined}
                  required={f.required}
                  value={form[f.key] || ""}
                  onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
                />
              </div>
            ))}
            <div style={{ gridColumn: "1 / -1" }}>
              <button className="btn" disabled={saving} type="submit">
                {saving ? "Saving..." : "Save"}
              </button>
            </div>
          </form>
        </div>
      )}

      {importable && <ImportExport basePath={apiPath} onImported={load} />}

      <div className="card">
        {rows.length > 0 && (
          <div style={{ position: "relative", marginBottom: 16, maxWidth: 320 }}>
            <Search size={15} style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)", color: "var(--muted-light)" }} />
            <input
              placeholder={`Search ${title.toLowerCase()}...`}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              style={{
                width: "100%",
                padding: "8px 12px 8px 32px",
                borderRadius: "999px",
                border: "1px solid var(--border)",
                fontSize: "0.86rem",
              }}
            />
          </div>
        )}

        {loading ? (
          <p>Loading...</p>
        ) : rows.length === 0 ? (
          <div className="empty-state">No records yet.</div>
        ) : filteredRows.length === 0 ? (
          <div className="empty-state">No results for "{query}".</div>
        ) : (
          <>
            <table>
              <thead>
                <tr>
                  {columns.map((c) => (
                    <th key={c.key}>{c.label}</th>
                  ))}
                  {!hideDelete && <th />}
                </tr>
              </thead>
              <tbody>
                {filteredRows.map((row) => (
                  <tr key={row.id}>
                    {columns.map((c) => (
                      <td key={c.key}>{c.render ? c.render(row) : row[c.key]}</td>
                    ))}
                    {!hideDelete && (
                      <td>
                        <button className="btn secondary" onClick={() => handleDelete(row.id)}>
                          Archive
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
            <p style={{ fontSize: "0.78rem", color: "var(--muted)", marginTop: 14, marginBottom: 0 }}>
              Showing {filteredRows.length} of {rows.length}
            </p>
          </>
        )}
      </div>
    </div>
  );
}
