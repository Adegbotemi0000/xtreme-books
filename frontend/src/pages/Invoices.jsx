import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/client";
import { StatusPill } from "../components/StatusPill";
import { ImportExport } from "../components/ImportExport";

export function Invoices() {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);

  function load() {
    api.get("/sales/invoices").then(setInvoices).finally(() => setLoading(false));
  }

  useEffect(load, []);

  return (
    <div>
      <div className="page-header">
        <h1>Invoices</h1>
        <Link className="btn" to="/invoices/new">
          + New invoice
        </Link>
      </div>
      <ImportExport basePath="/sales/invoices" onImported={load} />

      <div className="card">
        {loading ? (
          <p>Loading...</p>
        ) : invoices.length === 0 ? (
          <div className="empty-state">No invoices yet.</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Invoice #</th>
                <th>Customer</th>
                <th>Date</th>
                <th>Total</th>
                <th>Paid</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((inv) => (
                <tr key={inv.id}>
                  <td>
                    <Link to={`/invoices/${inv.id}`}>{inv.invoice_number}</Link>
                  </td>
                  <td>{inv.customer_name}</td>
                  <td>{new Date(inv.date).toLocaleDateString()}</td>
                  <td>₦{Number(inv.total).toLocaleString()}</td>
                  <td>₦{Number(inv.amount_paid).toLocaleString()}</td>
                  <td>
                    <StatusPill status={inv.status} />
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
