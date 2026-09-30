import { useEffect, useState } from "react";
import { Paperclip } from "lucide-react";
import { api } from "../api/client";
import { StatusPill } from "../components/StatusPill";
import { ImportExport } from "../components/ImportExport";
import { DocumentUpload } from "../components/DocumentUpload";
import { Pagination, PAGE_SIZE } from "../components/Pagination";

function fmt(n) {
  return `₦${Number(n || 0).toLocaleString()}`;
}

export function Purchases() {
  const [purchases, setPurchases] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ supplierId: "", date: new Date().toISOString().slice(0, 10), total: "" });
  const [error, setError] = useState("");
  const [attachId, setAttachId] = useState(null);
  const [page, setPage] = useState(1);

  function load() {
    api.get("/purchases").then(setPurchases);
  }
  useEffect(load, []);
  useEffect(() => {
    api.get("/suppliers").then(setSuppliers);
    api.get("/accounts").then(setAccounts);
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    try {
      await api.post("/purchases", form);
      setShowForm(false);
      setForm({ supplierId: "", date: new Date().toISOString().slice(0, 10), total: "" });
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleApprove(id) {
    setError("");
    try {
      await api.post(`/purchases/${id}/approve`);
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handlePay(purchase) {
    const accountId = accounts[0]?.id;
    if (!accountId) {
      setError("Add a cash/bank account first under Cash & Bank.");
      return;
    }
    const balance = Number(purchase.total) - Number(purchase.amount_paid);
    setError("");
    try {
      await api.post(`/purchases/${purchase.id}/payments`, {
        amount: balance,
        date: new Date().toISOString().slice(0, 10),
        accountId,
      });
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div>
      <div className="page-header">
        <h1>Purchases</h1>
        <button className="btn" onClick={() => setShowForm((v) => !v)}>
          {showForm ? "Cancel" : "+ New purchase"}
        </button>
      </div>

      {error && <div className="error-banner">{error}</div>}

      {showForm && (
        <div className="card" style={{ marginBottom: 16 }}>
          <form onSubmit={handleSubmit} className="form-grid">
            <div className="field">
              <label>Supplier</label>
              <select required value={form.supplierId} onChange={(e) => setForm({ ...form, supplierId: e.target.value })}>
                <option value="">Select a supplier</option>
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label>Date</label>
              <input type="date" required value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
            </div>
            <div className="field">
              <label>Total</label>
              <input type="number" step="0.01" required value={form.total} onChange={(e) => setForm({ ...form, total: e.target.value })} />
            </div>
            <div style={{ gridColumn: "1 / -1" }}>
              <button className="btn" type="submit">
                Save
              </button>
            </div>
          </form>
        </div>
      )}

      <ImportExport basePath="/purchases" onImported={load} />

      <div className="card">
        {purchases.length === 0 ? (
          <div className="empty-state">No purchases yet.</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Number</th>
                <th>Supplier</th>
                <th>Date</th>
                <th>Total</th>
                <th>Balance</th>
                <th>Status</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {purchases.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE).map((p) => (
                <tr key={p.id}>
                  <td>{p.purchase_number}</td>
                  <td>{p.supplier_name}</td>
                  <td>{new Date(p.date).toLocaleDateString()}</td>
                  <td>{fmt(p.total)}</td>
                  <td>{fmt(p.total - p.amount_paid)}</td>
                  <td>
                    <StatusPill status={p.status} />
                  </td>
                  <td style={{ display: "flex", gap: 6 }}>
                    <button className="icon-btn" title="Attachments" onClick={() => setAttachId(attachId === p.id ? null : p.id)}>
                      <Paperclip size={14} />
                    </button>
                    {p.status === "pending_approval" && (
                      <button className="btn secondary" onClick={() => handleApprove(p.id)}>
                        Approve
                      </button>
                    )}
                    {p.status === "approved" && (
                      <button className="btn secondary" onClick={() => handlePay(p)}>
                        Mark paid
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <Pagination page={page} totalItems={purchases.length} onChange={setPage} />
      </div>

      {attachId && <DocumentUpload entityType="purchase" entityId={attachId} />}
    </div>
  );
}
