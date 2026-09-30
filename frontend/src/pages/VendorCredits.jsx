import { useEffect, useState } from "react";
import { ArrowLeft, Plus, Ban } from "lucide-react";
import { api } from "../api/client";
import { Pagination, PAGE_SIZE } from "../components/Pagination";

function fmt(n) {
  return `₦${Number(n || 0).toLocaleString()}`;
}

function CreditDetail({ creditId, onBack, onChanged }) {
  const [data, setData] = useState(null);
  const [purchases, setPurchases] = useState([]);
  const [applyForm, setApplyForm] = useState({ purchaseId: "", amount: "" });
  const [error, setError] = useState("");

  function load() {
    api.get(`/vendor-credits/${creditId}`).then(setData).catch((err) => setError(err.message));
  }
  useEffect(load, [creditId]);
  useEffect(() => {
    api.get("/purchases").then(setPurchases);
  }, []);

  async function handleApply(e) {
    e.preventDefault();
    setError("");
    try {
      await api.post(`/vendor-credits/${creditId}/apply`, {
        purchaseId: applyForm.purchaseId,
        amount: applyForm.amount,
        date: new Date().toISOString().slice(0, 10),
      });
      setApplyForm({ purchaseId: "", amount: "" });
      load();
      onChanged?.();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleVoid() {
    const reason = prompt("Reason for voiding this credit:");
    if (reason === null) return;
    setError("");
    try {
      await api.post(`/vendor-credits/${creditId}/void`, { reason });
      load();
      onChanged?.();
    } catch (err) {
      setError(err.message);
    }
  }

  if (!data) return <p>Loading...</p>;

  const eligiblePurchases = purchases.filter((p) => p.supplier_name === data.supplier_name && Number(p.total) - Number(p.amount_paid) > 0);

  return (
    <div>
      <button className="btn secondary" style={{ marginBottom: 14 }} onClick={onBack}>
        <ArrowLeft size={14} /> Back to vendor credits
      </button>
      <div className="page-header">
        <div>
          <h1>{data.credit_number}</h1>
          <span className={`status-pill ${data.is_voided ? "cancelled" : "active"}`}>{data.is_voided ? "Voided" : "Active"}</span>
        </div>
        {!data.is_voided && data.amount_applied === 0 && (
          <button className="btn danger" onClick={handleVoid}>
            <Ban size={14} /> Void
          </button>
        )}
      </div>

      {error && <div className="error-banner">{error}</div>}

      <div className="card">
        <div className="form-grid">
          <p><strong>Supplier:</strong> {data.supplier_name}</p>
          <p><strong>Date:</strong> {new Date(data.date).toLocaleDateString()}</p>
          <p><strong>Category:</strong> {data.category_name || "—"}</p>
          <p><strong>Amount:</strong> {fmt(data.amount)}</p>
          <p><strong>Applied:</strong> {fmt(data.amount_applied)}</p>
          <p><strong>Balance:</strong> {fmt(data.balance)}</p>
        </div>
        {data.reason && <p style={{ color: "var(--muted)" }}>{data.reason}</p>}
      </div>

      {!data.is_voided && data.balance > 0 && (
        <div className="card">
          <h3 style={{ marginTop: 0 }}>Apply to a purchase</h3>
          <form onSubmit={handleApply} className="form-grid">
            <div className="field">
              <label>Purchase</label>
              <select required value={applyForm.purchaseId} onChange={(e) => setApplyForm({ ...applyForm, purchaseId: e.target.value })}>
                <option value="">Select an open purchase from this supplier</option>
                {eligiblePurchases.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.purchase_number} — balance {fmt(Number(p.total) - Number(p.amount_paid))}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label>Amount</label>
              <input type="number" step="0.01" required max={data.balance} value={applyForm.amount} onChange={(e) => setApplyForm({ ...applyForm, amount: e.target.value })} />
            </div>
            <div style={{ alignSelf: "end" }}>
              <button className="btn" type="submit">
                <Plus size={14} /> Apply
              </button>
            </div>
          </form>
        </div>
      )}

      {data.applications.length > 0 && (
        <div className="card">
          <h3 style={{ marginTop: 0 }}>Applications</h3>
          <table>
            <thead>
              <tr>
                <th>Purchase</th>
                <th>Date</th>
                <th>Amount</th>
              </tr>
            </thead>
            <tbody>
              {data.applications.map((a) => (
                <tr key={a.id}>
                  <td>{a.purchase_number}</td>
                  <td>{new Date(a.date).toLocaleDateString()}</td>
                  <td>{fmt(a.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export function VendorCredits() {
  const [credits, setCredits] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [categories, setCategories] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ supplierId: "", date: new Date().toISOString().slice(0, 10), categoryId: "", amount: "", reason: "" });
  const [error, setError] = useState("");
  const [openCreditId, setOpenCreditId] = useState(null);
  const [page, setPage] = useState(1);

  function load() {
    api.get("/vendor-credits").then(setCredits);
  }
  useEffect(load, []);
  useEffect(() => {
    api.get("/suppliers").then(setSuppliers);
    api.get("/categories").then((rows) => setCategories(rows.filter((c) => c.type === "expense")));
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    try {
      await api.post("/vendor-credits", { ...form, categoryId: form.categoryId || undefined });
      setShowForm(false);
      setForm({ supplierId: "", date: new Date().toISOString().slice(0, 10), categoryId: "", amount: "", reason: "" });
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  if (openCreditId) {
    return <CreditDetail creditId={openCreditId} onBack={() => { setOpenCreditId(null); load(); }} onChanged={load} />;
  }

  return (
    <div>
      <div className="page-header">
        <h1>Vendor Credits</h1>
        <button className="btn" onClick={() => setShowForm((v) => !v)}>
          {showForm ? "Cancel" : "+ New credit"}
        </button>
      </div>
      <p style={{ color: "var(--muted)", marginTop: -12, marginBottom: 20 }}>
        Credit notes from suppliers — apply them against future purchases to reduce what's owed.
      </p>

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
              <label>Amount</label>
              <input type="number" step="0.01" required value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
            </div>
            <div className="field">
              <label>Category</label>
              <select value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })}>
                <option value="">Uncategorized</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="field" style={{ gridColumn: "1 / -1" }}>
              <label>Reason</label>
              <input value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} />
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
        {credits.length === 0 ? (
          <div className="empty-state">No vendor credits yet.</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Credit #</th>
                <th>Supplier</th>
                <th>Date</th>
                <th>Amount</th>
                <th>Balance</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {credits.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE).map((c) => (
                <tr key={c.id} style={{ cursor: "pointer" }} onClick={() => setOpenCreditId(c.id)}>
                  <td>{c.credit_number}</td>
                  <td>{c.supplier_name}</td>
                  <td>{new Date(c.date).toLocaleDateString()}</td>
                  <td>{fmt(c.amount)}</td>
                  <td>{fmt(c.balance)}</td>
                  <td>
                    <span className={`status-pill ${c.is_voided ? "cancelled" : "active"}`}>{c.is_voided ? "Voided" : "Active"}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <Pagination page={page} totalItems={credits.length} onChange={setPage} />
      </div>
    </div>
  );
}

