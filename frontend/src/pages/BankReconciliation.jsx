import { useEffect, useRef, useState } from "react";
import { Upload, Check, X, Plus, Trash2, ArrowLeft } from "lucide-react";
import { api, apiUpload } from "../api/client";

function fmt(n) {
  return `₦${Number(n || 0).toLocaleString()}`;
}

const STATUS_CLASS = { matched: "active", unmatched: "pending", ignored: "cancelled" };

function ImportDetail({ importId, onBack, onChanged }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [expenseForm, setExpenseForm] = useState({});

  function load() {
    api.get(`/bank-reconciliation/imports/${importId}`).then(setData).catch((err) => setError(err.message));
  }
  useEffect(load, [importId]);

  async function confirm(lineId, candidate) {
    setError("");
    try {
      await api.post(`/bank-reconciliation/lines/${lineId}/confirm`, { sourceType: candidate.sourceType, sourceId: candidate.sourceId });
      load();
      onChanged?.();
    } catch (err) {
      setError(err.message);
    }
  }

  async function unmatch(lineId) {
    setError("");
    try {
      await api.post(`/bank-reconciliation/lines/${lineId}/unmatch`, {});
      load();
      onChanged?.();
    } catch (err) {
      setError(err.message);
    }
  }

  async function ignore(lineId) {
    setError("");
    try {
      await api.post(`/bank-reconciliation/lines/${lineId}/ignore`, {});
      load();
      onChanged?.();
    } catch (err) {
      setError(err.message);
    }
  }

  async function createExpense(lineId) {
    setError("");
    try {
      await api.post(`/bank-reconciliation/lines/${lineId}/create-expense`, { description: expenseForm[lineId] });
      load();
      onChanged?.();
    } catch (err) {
      setError(err.message);
    }
  }

  if (!data) return <p>Loading...</p>;

  return (
    <div>
      <button className="btn secondary" style={{ marginBottom: 14 }} onClick={onBack}>
        <ArrowLeft size={14} /> Back to imports
      </button>
      <div className="page-header">
        <h1>{data.original_filename}</h1>
      </div>
      <p style={{ color: "var(--muted)", marginTop: -12, marginBottom: 20 }}>
        {data.account_name} · {data.lines.length} line{data.lines.length === 1 ? "" : "s"}
      </p>

      {error && <div className="error-banner">{error}</div>}

      <div className="card">
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Description</th>
              <th>Amount</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {data.lines.map((line) => (
              <tr key={line.id}>
                <td>{new Date(line.date).toLocaleDateString()}</td>
                <td>{line.description || "—"}</td>
                <td style={{ color: Number(line.amount) < 0 ? "var(--danger)" : "var(--text)" }}>{fmt(line.amount)}</td>
                <td>
                  <span className={`status-pill ${STATUS_CLASS[line.status]}`}>{line.status}</span>
                </td>
                <td>
                  {line.status === "unmatched" && (
                    <div style={{ display: "flex", flexDirection: "column", gap: 6, alignItems: "flex-start" }}>
                      {line.candidates.length > 0 && (
                        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                          {line.candidates.map((c) => (
                            <button
                              key={`${c.sourceType}-${c.sourceId}`}
                              className="btn secondary"
                              onClick={() => confirm(line.id, c)}
                            >
                              <Check size={14} /> Match {c.label} ({fmt(c.amount)})
                            </button>
                          ))}
                        </div>
                      )}
                      {Number(line.amount) < 0 && (
                        <div style={{ display: "flex", gap: 6 }}>
                          <input
                            placeholder="Expense description"
                            style={{ width: 160 }}
                            value={expenseForm[line.id] || ""}
                            onChange={(e) => setExpenseForm({ ...expenseForm, [line.id]: e.target.value })}
                          />
                          <button className="btn secondary" onClick={() => createExpense(line.id)}>
                            <Plus size={14} /> New expense
                          </button>
                        </div>
                      )}
                      <button className="btn secondary" onClick={() => ignore(line.id)}>
                        <X size={14} /> Ignore
                      </button>
                    </div>
                  )}
                  {line.status === "matched" && (
                    <button className="btn secondary" onClick={() => unmatch(line.id)}>
                      Unmatch
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function BankReconciliation() {
  const [imports, setImports] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [selectedAccount, setSelectedAccount] = useState("");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [openImportId, setOpenImportId] = useState(null);
  const fileRef = useRef(null);

  function load() {
    api.get("/bank-reconciliation/imports").then(setImports);
  }
  useEffect(load, []);
  useEffect(() => {
    api.get("/accounts").then(setAccounts);
  }, []);

  async function handleFileChange(e) {
    const file = e.target.files[0];
    if (!file) return;
    if (!selectedAccount) {
      setError("Select an account before uploading a statement.");
      if (fileRef.current) fileRef.current.value = "";
      return;
    }
    setUploading(true);
    setError("");
    try {
      const result = await apiUpload("/bank-reconciliation/imports", file, { accountId: selectedAccount });
      load();
      setOpenImportId(result.import.id);
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function removeImport(id) {
    if (!confirm("Remove this statement import? Matched payments/expenses are not affected.")) return;
    await api.delete(`/bank-reconciliation/imports/${id}`).catch((err) => setError(err.message));
    load();
  }

  if (openImportId) {
    return <ImportDetail importId={openImportId} onBack={() => { setOpenImportId(null); load(); }} onChanged={load} />;
  }

  return (
    <div>
      <div className="page-header">
        <h1>Bank Reconciliation</h1>
      </div>
      <p style={{ color: "var(--muted)", marginTop: -12, marginBottom: 20 }}>
        Upload a CSV or Excel bank statement, then match each line to an existing payment or
        expense — or create a new expense straight from an unmatched line.
      </p>

      {error && <div className="error-banner">{error}</div>}

      <div className="card" style={{ marginBottom: 16 }}>
        <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
          <select value={selectedAccount} onChange={(e) => setSelectedAccount(e.target.value)} style={{ maxWidth: 240 }}>
            <option value="">Select account</option>
            {accounts.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>
          <button className="btn" disabled={uploading} onClick={() => fileRef.current?.click()}>
            <Upload size={14} /> {uploading ? "Uploading..." : "Upload statement"}
          </button>
          <input ref={fileRef} type="file" accept=".csv,.xlsx" hidden onChange={handleFileChange} />
        </div>
      </div>

      <div className="card">
        {imports.length === 0 ? (
          <div className="empty-state">No statements imported yet.</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>File</th>
                <th>Account</th>
                <th>Imported</th>
                <th>Matched</th>
                <th>Unmatched</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {imports.map((i) => (
                <tr key={i.id}>
                  <td>
                    <button className="link-btn" onClick={() => setOpenImportId(i.id)} style={{ background: "none", border: "none", color: "var(--primary)", cursor: "pointer", padding: 0, font: "inherit" }}>
                      {i.original_filename}
                    </button>
                  </td>
                  <td>{i.account_name}</td>
                  <td>{new Date(i.imported_at).toLocaleDateString()}</td>
                  <td>{i.matched_lines} / {i.total_lines}</td>
                  <td style={{ color: i.unmatched_lines > 0 ? "var(--danger)" : "var(--text)" }}>{i.unmatched_lines}</td>
                  <td>
                    <button className="icon-btn" title="Remove" onClick={() => removeImport(i.id)}>
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
