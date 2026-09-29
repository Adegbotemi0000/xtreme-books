import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/client";

function fmt(n) {
  return `₦${Number(n || 0).toLocaleString()}`;
}

export function Payroll() {
  const [entries, setEntries] = useState([]);
  const [staff, setStaff] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ staffId: "", period: new Date().toISOString().slice(0, 7), grossPay: "", daysMissed: 0, pensionAmount: 0 });
  const [preview, setPreview] = useState(null);
  const [error, setError] = useState("");

  function load() {
    api.get("/payroll").then(setEntries);
  }
  useEffect(load, []);
  useEffect(() => {
    api.get("/staff").then(setStaff);
  }, []);

  function selectStaff(id) {
    const s = staff.find((x) => String(x.id) === String(id));
    setForm({ ...form, staffId: id, grossPay: s ? s.monthly_salary : form.grossPay });
  }

  useEffect(() => {
    if (!form.grossPay) {
      setPreview(null);
      return;
    }
    const t = setTimeout(() => {
      api.post("/payroll/preview", { grossPay: form.grossPay, daysMissed: form.daysMissed, pensionAmount: form.pensionAmount }).then(setPreview);
    }, 300);
    return () => clearTimeout(t);
  }, [form.grossPay, form.daysMissed, form.pensionAmount]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    try {
      await api.post("/payroll", form);
      setShowForm(false);
      setForm({ staffId: "", period: new Date().toISOString().slice(0, 7), grossPay: "", daysMissed: 0, pensionAmount: 0 });
      setPreview(null);
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div>
      <div className="page-header">
        <h1>Payroll</h1>
        <button className="btn" onClick={() => setShowForm((v) => !v)}>
          {showForm ? "Cancel" : "+ Run payroll"}
        </button>
      </div>

      {error && <div className="error-banner">{error}</div>}

      {showForm && (
        <div className="card" style={{ marginBottom: 16 }}>
          <form onSubmit={handleSubmit} className="form-grid">
            <div className="field">
              <label>Staff member</label>
              <select required value={form.staffId} onChange={(e) => selectStaff(e.target.value)}>
                <option value="">Select staff</option>
                {staff.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label>Period</label>
              <input type="month" required value={form.period} onChange={(e) => setForm({ ...form, period: e.target.value })} />
            </div>
            <div className="field">
              <label>Gross pay</label>
              <input type="number" step="0.01" required value={form.grossPay} onChange={(e) => setForm({ ...form, grossPay: e.target.value })} />
            </div>
            <div className="field">
              <label>Days missed</label>
              <input type="number" step="1" value={form.daysMissed} onChange={(e) => setForm({ ...form, daysMissed: e.target.value })} />
            </div>
            <div className="field">
              <label>Pension deduction</label>
              <input type="number" step="0.01" value={form.pensionAmount} onChange={(e) => setForm({ ...form, pensionAmount: e.target.value })} />
            </div>

            {preview && (
              <div style={{ gridColumn: "1 / -1", background: "var(--bg)", borderRadius: "var(--radius-sm)", padding: 14 }}>
                {!preview.bandsConfigured && (
                  <p style={{ margin: "0 0 8px", fontSize: "0.8rem", color: "var(--warning)" }}>
                    No PAYE bands configured yet under Tax Centre — PAYE will be recorded as ₦0.
                  </p>
                )}
                <p style={{ margin: 0, fontSize: "0.86rem" }}>Prorated gross: {fmt(preview.proratedGross)}</p>
                <p style={{ margin: 0, fontSize: "0.86rem" }}>PAYE: {fmt(preview.payeAmount)}</p>
                <p style={{ margin: 0, fontSize: "0.86rem", fontWeight: 700 }}>Net pay: {fmt(preview.netPay)}</p>
              </div>
            )}

            <div style={{ gridColumn: "1 / -1" }}>
              <button className="btn" type="submit">
                Save payroll entry
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="card">
        {entries.length === 0 ? (
          <div className="empty-state">No payroll entries yet.</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Staff</th>
                <th>Period</th>
                <th>Gross pay</th>
                <th>PAYE</th>
                <th>Pension</th>
                <th>Net pay</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((e) => (
                <tr key={e.id}>
                  <td>{e.staff_name}</td>
                  <td>{e.period}</td>
                  <td>{fmt(e.gross_pay)}</td>
                  <td>{fmt(e.paye_amount)}</td>
                  <td>{fmt(e.pension_amount)}</td>
                  <td>{fmt(e.net_pay)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="card">
        <p style={{ margin: 0, color: "var(--muted)" }}>
          PAYE is calculated from your own bands under{" "}
          <Link to="/tax">Tax Centre</Link>. Payslip generation and pension-rate configuration
          land with this module's next pass.
        </p>
      </div>
    </div>
  );
}
