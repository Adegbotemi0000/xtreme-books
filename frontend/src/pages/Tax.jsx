import { useEffect, useState } from "react";
import { api } from "../api/client";

export function Tax() {
  const [types, setTypes] = useState([]);
  const [bands, setBands] = useState([]);
  const [showBandForm, setShowBandForm] = useState(false);
  const [bandForm, setBandForm] = useState({ minIncome: "", maxIncome: "", rate: "" });
  const [error, setError] = useState("");

  function load() {
    api.get("/tax/types").then(setTypes);
  }
  function loadBands() {
    api.get("/tax/paye-bands").then(setBands);
  }
  useEffect(load, []);
  useEffect(loadBands, []);

  async function toggle(t) {
    await api.patch(`/tax/types/${t.id}`, { isEnabled: !t.is_enabled, defaultRate: t.default_rate });
    load();
  }

  async function addBand(e) {
    e.preventDefault();
    setError("");
    try {
      await api.post("/tax/paye-bands", {
        minIncome: bandForm.minIncome,
        maxIncome: bandForm.maxIncome || null,
        rate: bandForm.rate,
      });
      setBandForm({ minIncome: "", maxIncome: "", rate: "" });
      setShowBandForm(false);
      loadBands();
    } catch (err) {
      setError(err.message);
    }
  }

  async function removeBand(id) {
    await api.delete(`/tax/paye-bands/${id}`);
    loadBands();
  }

  return (
    <div>
      <div className="page-header">
        <h1>Tax Centre</h1>
      </div>
      <div className="card">
        <table>
          <thead>
            <tr>
              <th>Tax type</th>
              <th>Status</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {types.map((t) => (
              <tr key={t.id}>
                <td style={{ textTransform: "uppercase" }}>{t.code}</td>
                <td>
                  <span className={`status-pill ${t.is_enabled ? "active" : "cancelled"}`}>
                    {t.is_enabled ? "Enabled" : "Disabled"}
                  </span>
                </td>
                <td>
                  <button className="btn secondary" onClick={() => toggle(t)}>
                    {t.is_enabled ? "Disable" : "Enable"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="card">
        <div className="dashboard-card-header">
          <h3>PAYE bands</h3>
          <button className="btn secondary" onClick={() => setShowBandForm((v) => !v)}>
            {showBandForm ? "Cancel" : "+ Add band"}
          </button>
        </div>
        <p style={{ fontSize: "0.82rem", color: "var(--muted)", marginTop: -4 }}>
          Enter your own current PAYE bands (from your accountant, under NTA 2025 or whatever's in
          force) — nothing is pre-filled, since tax law changes and Kora never hard-codes rates.
          Payroll's PAYE calculation uses exactly what's configured here.
        </p>
        {error && <div className="error-banner">{error}</div>}
        {showBandForm && (
          <form onSubmit={addBand} className="form-grid" style={{ marginBottom: 16 }}>
            <div className="field">
              <label>From (₦)</label>
              <input type="number" required value={bandForm.minIncome} onChange={(e) => setBandForm({ ...bandForm, minIncome: e.target.value })} />
            </div>
            <div className="field">
              <label>To (₦, blank = no limit)</label>
              <input type="number" value={bandForm.maxIncome} onChange={(e) => setBandForm({ ...bandForm, maxIncome: e.target.value })} />
            </div>
            <div className="field">
              <label>Rate (%)</label>
              <input type="number" step="0.01" required value={bandForm.rate} onChange={(e) => setBandForm({ ...bandForm, rate: e.target.value })} />
            </div>
            <div style={{ gridColumn: "1 / -1" }}>
              <button className="btn" type="submit">
                Save band
              </button>
            </div>
          </form>
        )}
        {bands.length === 0 ? (
          <div className="empty-state">No PAYE bands configured yet — payroll will calculate ₦0 PAYE until you add some.</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>From</th>
                <th>To</th>
                <th>Rate</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {bands.map((b) => (
                <tr key={b.id}>
                  <td>₦{Number(b.min_income).toLocaleString()}</td>
                  <td>{b.max_income ? `₦${Number(b.max_income).toLocaleString()}` : "No limit"}</td>
                  <td>{Number(b.rate)}%</td>
                  <td>
                    <button className="btn secondary" onClick={() => removeBand(b.id)}>
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="card">
        <p style={{ margin: 0, color: "var(--muted)" }}>
          VAT/WHT filing reports and CIT obligation tracking land with this module's full
          build-out — see docs/02-modules.md 2.11.
        </p>
      </div>
    </div>
  );
}
