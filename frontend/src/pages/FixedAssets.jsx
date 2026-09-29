import { useEffect, useState } from "react";
import { api } from "../api/client";

function fmt(n) {
  return `₦${Number(n || 0).toLocaleString()}`;
}

export function FixedAssets() {
  const [assets, setAssets] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", category: "", purchaseDate: new Date().toISOString().slice(0, 10), cost: "", usefulLifeYears: "", salvageValue: 0 });
  const [error, setError] = useState("");

  function load() {
    api.get("/fixed-assets").then(setAssets);
  }
  useEffect(load, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    try {
      await api.post("/fixed-assets", form);
      setShowForm(false);
      setForm({ name: "", category: "", purchaseDate: new Date().toISOString().slice(0, 10), cost: "", usefulLifeYears: "", salvageValue: 0 });
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleDepreciate(id) {
    setError("");
    try {
      await api.post(`/fixed-assets/${id}/depreciate`, {});
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleDispose(asset) {
    const bookValue = Number(asset.cost) - Number(asset.accumulated_depreciation);
    const proceeds = prompt(`Book value is ${fmt(bookValue)}. Enter disposal proceeds:`);
    if (proceeds === null) return;
    setError("");
    try {
      await api.post(`/fixed-assets/${asset.id}/dispose`, { date: new Date().toISOString().slice(0, 10), proceeds: Number(proceeds) });
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div>
      <div className="page-header">
        <h1>Fixed Assets</h1>
        <button className="btn" onClick={() => setShowForm((v) => !v)}>
          {showForm ? "Cancel" : "+ New asset"}
        </button>
      </div>

      {error && <div className="error-banner">{error}</div>}

      {showForm && (
        <div className="card" style={{ marginBottom: 16 }}>
          <form onSubmit={handleSubmit} className="form-grid">
            <div className="field">
              <label>Name</label>
              <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="field">
              <label>Category</label>
              <input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} />
            </div>
            <div className="field">
              <label>Purchase date</label>
              <input type="date" required value={form.purchaseDate} onChange={(e) => setForm({ ...form, purchaseDate: e.target.value })} />
            </div>
            <div className="field">
              <label>Cost</label>
              <input type="number" step="0.01" required value={form.cost} onChange={(e) => setForm({ ...form, cost: e.target.value })} />
            </div>
            <div className="field">
              <label>Useful life (years)</label>
              <input type="number" required value={form.usefulLifeYears} onChange={(e) => setForm({ ...form, usefulLifeYears: e.target.value })} />
            </div>
            <div className="field">
              <label>Salvage value</label>
              <input type="number" step="0.01" value={form.salvageValue} onChange={(e) => setForm({ ...form, salvageValue: e.target.value })} />
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
        {assets.length === 0 ? (
          <div className="empty-state">No fixed assets yet.</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Category</th>
                <th>Cost</th>
                <th>Accum. depreciation</th>
                <th>Book value</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {assets.map((a) => (
                <tr key={a.id}>
                  <td>{a.name}</td>
                  <td>{a.category || "—"}</td>
                  <td>{fmt(a.cost)}</td>
                  <td>{fmt(a.accumulated_depreciation)}</td>
                  <td>{fmt(a.cost - a.accumulated_depreciation)}</td>
                  <td>
                    {a.disposed_at ? (
                      <span className="status-pill cancelled">Disposed</span>
                    ) : (
                      <div style={{ display: "flex", gap: 6 }}>
                        <button className="btn secondary" onClick={() => handleDepreciate(a.id)}>
                          Run depreciation
                        </button>
                        <button className="btn secondary" onClick={() => handleDispose(a)}>
                          Dispose
                        </button>
                      </div>
                    )}
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
