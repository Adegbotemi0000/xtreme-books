import { useEffect, useMemo, useState } from "react";
import { Search } from "lucide-react";
import { api } from "../api/client";
import { ImportExport } from "./ImportExport";
import { Pagination, PAGE_SIZE } from "./Pagination";

// Generic list+create page for modules scaffolded at basic-CRUD depth for
// now (approval workflows / GL posting / depreciation runs land per-module
// next). Real data, real backend — just not the full business logic yet.
//
// Paging strategy: while the search box is empty, this fetches one page at
// a time from the server (?page=&pageSize=) rather than the whole table —
// the real fix for a tenant's list outgrowing a single request. The moment
// someone types a search, there's no way to match across the *whole* table
// from just the current page, so it falls back to fetching the full list
// once and filtering/paging client-side, same as before — correctness over
// server-side paging in that one case.
export function SimpleListPage({ title, description, apiPath, columns, formFields, hideDelete, importable }) {
  const [serverRows, setServerRows] = useState([]);
  const [serverTotal, setServerTotal] = useState(0);
  const [allRows, setAllRows] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);

  const searching = query.trim() !== "";

  function load() {
    setLoading(true);
    setError("");
    if (searching) {
      api
        .get(apiPath)
        .then(setAllRows)
        .catch((err) => setError(err.message))
        .finally(() => setLoading(false));
    } else {
      api
        .get(`${apiPath}?page=${page}&pageSize=${PAGE_SIZE}`)
        .then((res) => {
          setServerRows(res.data);
          setServerTotal(res.total);
        })
        .catch((err) => setError(err.message))
        .finally(() => setLoading(false));
    }
  }

  useEffect(load, [apiPath, searching ? null : page, searching]);

  const filteredRows = useMemo(() => {
    if (!searching || !allRows) return [];
    const q = query.toLowerCase();
    return allRows.filter((row) =>
      columns.some((c) => String(c.render ? c.render(row) : row[c.key] ?? "").toLowerCase().includes(q))
    );
  }, [allRows, searching, query, columns]);

  useEffect(() => setPage(1), [query]);

  const searchPagedRows = useMemo(
    () => filteredRows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [filteredRows, page]
  );

  const displayRows = searching ? searchPagedRows : serverRows;
  const displayTotal = searching ? filteredRows.length : serverTotal;
  const hasAnyRows = searching ? (allRows?.length ?? 0) > 0 : serverTotal > 0;

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
        {(hasAnyRows || searching) && (
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
        ) : !hasAnyRows ? (
          <div className="empty-state">No records yet.</div>
        ) : displayRows.length === 0 ? (
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
                {displayRows.map((row) => (
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
            <Pagination page={page} totalItems={displayTotal} onChange={setPage} />
          </>
        )}
      </div>
    </div>
  );
}
