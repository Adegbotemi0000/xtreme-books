import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/client";

export function Journals() {
  const [entries, setEntries] = useState([]);
  const [glAccounts, setGlAccounts] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [memo, setMemo] = useState("");
  const [lines, setLines] = useState([
    { accountId: "", debit: "", credit: "" },
    { accountId: "", debit: "", credit: "" },
  ]);
  const [error, setError] = useState("");

  function load() {
    api.get("/journals").then(setEntries);
  }
  useEffect(load, []);
  useEffect(() => {
    api.get("/gl-accounts").then(setGlAccounts);
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    try {
      await api.post("/journals", {
        date,
        memo,
        lines: lines.map((l) => ({ accountId: l.accountId, debit: Number(l.debit || 0), credit: Number(l.credit || 0) })),
      });
      setShowForm(false);
      setMemo("");
      setLines([
        { accountId: "", debit: "", credit: "" },
        { accountId: "", debit: "", credit: "" },
      ]);
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div>
      <div className="page-header">
        <h1>Journals</h1>
        <button className="btn" onClick={() => setShowForm((v) => !v)}>
          {showForm ? "Cancel" : "+ Manual entry"}
        </button>
      </div>

      {error && <div className="error-banner">{error}</div>}

      {showForm && (
        <div className="card">
          <form onSubmit={handleSubmit}>
            <div className="form-grid">
              <div className="field">
                <label>Date</label>
                <input type="date" required value={date} onChange={(e) => setDate(e.target.value)} />
              </div>
              <div className="field">
                <label>Memo</label>
                <input value={memo} onChange={(e) => setMemo(e.target.value)} />
              </div>
            </div>
            {lines.map((line, i) => (
              <div className="form-grid" key={i} style={{ marginTop: 10 }}>
                <select
                  required
                  value={line.accountId}
                  onChange={(e) => setLines(lines.map((l, idx) => (idx === i ? { ...l, accountId: e.target.value } : l)))}
                >
                  <option value="">Account</option>
                  {glAccounts.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.code} — {a.name}
                    </option>
                  ))}
                </select>
                <input
                  type="number"
                  placeholder="Debit"
                  value={line.debit}
                  onChange={(e) => setLines(lines.map((l, idx) => (idx === i ? { ...l, debit: e.target.value } : l)))}
                />
                <input
                  type="number"
                  placeholder="Credit"
                  value={line.credit}
                  onChange={(e) => setLines(lines.map((l, idx) => (idx === i ? { ...l, credit: e.target.value } : l)))}
                />
              </div>
            ))}
            <button
              type="button"
              className="btn secondary"
              style={{ marginTop: 10 }}
              onClick={() => setLines([...lines, { accountId: "", debit: "", credit: "" }])}
            >
              + Add line
            </button>
            <div style={{ marginTop: 14 }}>
              <button className="btn" type="submit">
                Post entry
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="card">
        {entries.length === 0 ? (
          <div className="empty-state">No journal entries yet.</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Entry #</th>
                <th>Date</th>
                <th>Memo</th>
                <th>Source</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((e) => (
                <tr key={e.id}>
                  <td>
                    <Link to={`/journals/${e.id}`}>{e.entry_number}</Link>
                  </td>
                  <td>{new Date(e.date).toLocaleDateString()}</td>
                  <td>{e.memo}</td>
                  <td>{e.source_type}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
