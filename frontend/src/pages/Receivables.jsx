import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/client";

function fmt(n) {
  return `₦${Number(n || 0).toLocaleString()}`;
}

const BUCKETS = [
  { key: "current", label: "Current", test: (d) => d <= 0, color: "var(--lime-dark)" },
  { key: "1-30", label: "1-30 days", test: (d) => d >= 1 && d <= 30, color: "var(--warning)" },
  { key: "31-60", label: "31-60 days", test: (d) => d >= 31 && d <= 60, color: "var(--primary)" },
  { key: "61-90", label: "61-90 days", test: (d) => d >= 61 && d <= 90, color: "#ff8a75" },
  { key: "90+", label: "90+ days", test: (d) => d > 90, color: "var(--danger)" },
];

export function Receivables() {
  const [invoices, setInvoices] = useState([]);
  const [loans, setLoans] = useState([]);

  useEffect(() => {
    api.get("/sales/invoices/receivables-ageing").then(setInvoices);
    api.get("/loans").then((rows) => setLoans(rows.filter((l) => l.direction === "given" && l.status === "active")));
  }, []);

  const customersOwe = invoices.reduce((sum, r) => sum + Number(r.balance), 0);
  const loansOwedToUs = loans.reduce((sum, l) => sum + Number(l.principal_amount), 0);

  return (
    <div>
      <div className="page-header">
        <h1>Receivables</h1>
      </div>

      <div className="dashboard-row dashboard-row-3">
        <div className="stat-card">
          <div className="label">Customers owe (invoices)</div>
          <div className="value">{fmt(customersOwe)}</div>
        </div>
        <div className="stat-card">
          <div className="label">Loans owed to us</div>
          <div className="value">{fmt(loansOwedToUs)}</div>
        </div>
        <div className="stat-card">
          <div className="label">Total outstanding</div>
          <div className="value">{fmt(customersOwe + loansOwedToUs)}</div>
        </div>
      </div>

      <div className="card">
        <div className="dashboard-card-header">
          <h3>Aging summary</h3>
          <span style={{ fontSize: "0.78rem", color: "var(--muted)" }}>As of {new Date().toLocaleDateString()}</span>
        </div>
        <div className="dashboard-row dashboard-row-3" style={{ gridTemplateColumns: "repeat(5, 1fr)", marginTop: 14 }}>
          {BUCKETS.map((b) => {
            const rows = invoices.filter((r) => b.test(Number(r.days_overdue)));
            const total = rows.reduce((sum, r) => sum + Number(r.balance), 0);
            return (
              <div key={b.key} className="card" style={{ borderTop: `3px solid ${b.color}`, boxShadow: "none" }}>
                <div className="label">{b.label}</div>
                <div className="value" style={{ fontSize: "1.15rem" }}>
                  {fmt(total)}
                </div>
                <div className="label">
                  {rows.length} invoice{rows.length === 1 ? "" : "s"}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="card">
        <h3 style={{ marginTop: 0 }}>Invoices</h3>
        {invoices.length === 0 ? (
          <div className="empty-state">Nothing outstanding.</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Invoice</th>
                <th>Customer</th>
                <th>Due date</th>
                <th>Days overdue</th>
                <th>Balance</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((r) => (
                <tr key={r.id}>
                  <td>
                    <Link to={`/invoices/${r.id}`}>{r.invoice_number}</Link>
                  </td>
                  <td>{r.customer_name}</td>
                  <td>{r.due_date ? new Date(r.due_date).toLocaleDateString() : "—"}</td>
                  <td style={{ color: Number(r.days_overdue) > 0 ? "var(--danger)" : "var(--lime-dark)" }}>
                    {Number(r.days_overdue) > 0 ? r.days_overdue : "Current"}
                  </td>
                  <td>{fmt(r.balance)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="card">
        <h3 style={{ marginTop: 0 }}>
          Loans owed to us <span style={{ fontWeight: 400, fontSize: "0.8rem", color: "var(--muted)" }}>(manage on the Loans page)</span>
        </h3>
        {loans.length === 0 ? (
          <div className="empty-state">No outstanding loans given.</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Counterparty</th>
                <th>Due</th>
                <th>Principal</th>
              </tr>
            </thead>
            <tbody>
              {loans.map((l) => (
                <tr key={l.id}>
                  <td>{l.counterparty_name}</td>
                  <td>{l.due_date ? new Date(l.due_date).toLocaleDateString() : "—"}</td>
                  <td>{fmt(l.principal_amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
