import { useEffect, useState } from "react";
import { api } from "../api/client";
import { StatusPill } from "../components/StatusPill";
import { Pagination, PAGE_SIZE } from "../components/Pagination";

function fmt(n) {
  return `₦${Number(n || 0).toLocaleString()}`;
}

export function Loans() {
  const [loans, setLoans] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    direction: "given",
    counterpartyName: "",
    principalAmount: "",
    date: new Date().toISOString().slice(0, 10),
    dueDate: "",
  });
  const [repayAmounts, setRepayAmounts] = useState({});
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);

  function load() {
    api.get("/loans").then(setLoans);
  }
  useEffect(load, []);
  useEffect(() => {
    api.get("/accounts").then(setAccounts);
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    try {
      await api.post("/loans", form);
      setShowForm(false);
      setForm({ direction: "given", counterpartyName: "", principalAmount: "", date: new Date().toISOString().slice(0, 10), dueDate: "" });
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleRepay(loan) {
    const amount = repayAmounts[loan.id];
    if (!amount) return;
    setError("");
    try {
      await api.post(`/loans/${loan.id}/repayments`, {
        amount,
        date: new Date().toISOString().slice(0, 10),
        accountId: accounts[0]?.id,
      });
      setRepayAmounts({ ...repayAmounts, [loan.id]: "" });
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div>
      <div className="page-header">
        <h1>Loans</h1>
        <button className="btn" onClick={() => setShowForm((v) => !v)}>
          {showForm ? "Cancel" : "+ New loan"}
        </button>
      </div>

      {error && <div className="error-banner">{error}</div>}

      {showForm && (
        <div className="card" style={{ marginBottom: 16 }}>
          <form onSubmit={handleSubmit} className="form-grid">
            <div className="field">
              <label>Direction</label>
              <select value={form.direction} onChange={(e) => setForm({ ...form, direction: e.target.value })}>
                <option value="given">Given (we lent it out)</option>
                <option value="taken">Taken (we borrowed it)</option>
              </select>
            </div>
            <div className="field">
              <label>Counterparty</label>
              <input required value={form.counterpartyName} onChange={(e) => setForm({ ...form, counterpartyName: e.target.value })} />
            </div>
            <div className="field">
              <label>Principal amount</label>
              <input type="number" step="0.01" required value={form.principalAmount} onChange={(e) => setForm({ ...form, principalAmount: e.target.value })} />
            </div>
            <div className="field">
              <label>Date</label>
              <input type="date" required value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
            </div>
            <div className="field">
              <label>Due date</label>
              <input type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} />
            </div>
            <div style={{ gridColumn: "1 / -1" }}>
              <button className="btn" type="submit">
                Save
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="card">
        {loans.length === 0 ? (
          <div className="empty-state">No loans yet.</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Direction</th>
                <th>Counterparty</th>
                <th>Principal</th>
                <th>Repaid</th>
                <th>Balance</th>
                <th>Status</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {loans.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE).map((l) => (
                <tr key={l.id}>
                  <td style={{ textTransform: "capitalize" }}>{l.direction}</td>
                  <td>{l.counterparty_name}</td>
                  <td>{fmt(l.principal_amount)}</td>
                  <td>{fmt(l.repaid)}</td>
                  <td>{fmt(l.principal_amount - l.repaid)}</td>
                  <td>
                    <StatusPill status={l.status} />
                  </td>
                  <td>
                    {l.status === "active" && (
                      <div style={{ display: "flex", gap: 6 }}>
                        <input
                          type="number"
                          placeholder="Amount"
                          style={{ width: 90 }}
                          value={repayAmounts[l.id] || ""}
                          onChange={(e) => setRepayAmounts({ ...repayAmounts, [l.id]: e.target.value })}
                        />
                        <button className="btn secondary" onClick={() => handleRepay(l)}>
                          Repay
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <Pagination page={page} totalItems={loans.length} onChange={setPage} />
      </div>
    </div>
  );
}
