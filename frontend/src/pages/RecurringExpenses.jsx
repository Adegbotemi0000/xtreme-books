import { useEffect, useState } from "react";
import { Paperclip, RefreshCw } from "lucide-react";
import { api } from "../api/client";
import { DocumentUpload } from "../components/DocumentUpload";
import { Pagination, PAGE_SIZE } from "../components/Pagination";

function fmt(n) {
  return `₦${Number(n || 0).toLocaleString()}`;
}

export function RecurringExpenses() {
  const [templates, setTemplates] = useState([]);
  const [categories, setCategories] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    description: "",
    amount: "",
    frequency: "monthly",
    nextRunDate: new Date().toISOString().slice(0, 10),
    endDate: "",
    paymentMethod: "cash",
    accountId: "",
    categoryId: "",
  });
  const [error, setError] = useState("");
  const [generating, setGenerating] = useState(false);
  const [generateResult, setGenerateResult] = useState(null);
  const [attachId, setAttachId] = useState(null);
  const [page, setPage] = useState(1);

  function load() {
    api.get("/recurring-expenses").then(setTemplates);
  }
  useEffect(load, []);
  useEffect(() => {
    api.get("/categories").then((rows) => setCategories(rows.filter((c) => c.type === "expense")));
    api.get("/accounts").then(setAccounts);
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    try {
      await api.post("/recurring-expenses", { ...form, categoryId: form.categoryId || undefined, endDate: form.endDate || undefined });
      setShowForm(false);
      setForm({
        description: "",
        amount: "",
        frequency: "monthly",
        nextRunDate: new Date().toISOString().slice(0, 10),
        endDate: "",
        paymentMethod: "cash",
        accountId: "",
        categoryId: "",
      });
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleToggleActive(t) {
    await api.patch(`/recurring-expenses/${t.id}/active`, { isActive: !t.is_active }).catch((err) => setError(err.message));
    load();
  }

  async function handleArchive(id) {
    if (!confirm("Remove this recurring expense template? Expenses it already generated are unaffected.")) return;
    await api.delete(`/recurring-expenses/${id}`).catch((err) => setError(err.message));
    load();
  }

  async function handleGenerateDue() {
    setGenerating(true);
    setGenerateResult(null);
    setError("");
    try {
      const result = await api.post("/recurring-expenses/generate-due", {});
      setGenerateResult(result);
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setGenerating(false);
    }
  }

  return (
    <div>
      <div className="page-header">
        <h1>Recurring Expenses</h1>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="btn secondary" disabled={generating} onClick={handleGenerateDue}>
            <RefreshCw size={14} /> {generating ? "Generating..." : "Generate due"}
          </button>
          <button className="btn" onClick={() => setShowForm((v) => !v)}>
            {showForm ? "Cancel" : "+ New template"}
          </button>
        </div>
      </div>

      <p style={{ color: "var(--muted)", marginTop: -12, marginBottom: 20 }}>
        Templates that repeat on a schedule — "Generate due" creates a real expense (posted to
        the GL, same as one entered by hand) for every occurrence that's come due since it was
        last run.
      </p>

      {error && <div className="error-banner">{error}</div>}
      {generateResult && (
        <p style={{ fontSize: "0.86rem", color: "var(--muted)" }}>
          Generated {generateResult.generated} expense{generateResult.generated === 1 ? "" : "s"}
          {generateResult.errors.length > 0 && `, ${generateResult.errors.length} failed`}.
        </p>
      )}

      {showForm && (
        <div className="card" style={{ marginBottom: 16 }}>
          <form onSubmit={handleSubmit} className="form-grid">
            <div className="field" style={{ gridColumn: "1 / -1" }}>
              <label>Description</label>
              <input required value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>
            <div className="field">
              <label>Amount</label>
              <input type="number" step="0.01" required value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
            </div>
            <div className="field">
              <label>Frequency</label>
              <select value={form.frequency} onChange={(e) => setForm({ ...form, frequency: e.target.value })}>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="quarterly">Quarterly</option>
                <option value="yearly">Yearly</option>
              </select>
            </div>
            <div className="field">
              <label>Next run date</label>
              <input type="date" required value={form.nextRunDate} onChange={(e) => setForm({ ...form, nextRunDate: e.target.value })} />
            </div>
            <div className="field">
              <label>End date (optional)</label>
              <input type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} />
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
            <div className="field">
              <label>Paid from account</label>
              <select required value={form.accountId} onChange={(e) => setForm({ ...form, accountId: e.target.value })}>
                <option value="">Select account</option>
                {accounts.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label>Payment method</label>
              <select value={form.paymentMethod} onChange={(e) => setForm({ ...form, paymentMethod: e.target.value })}>
                <option value="cash">Cash</option>
                <option value="bank_transfer">Bank transfer</option>
                <option value="pos_card">POS card</option>
              </select>
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
        {templates.length === 0 ? (
          <div className="empty-state">No recurring expenses yet.</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Description</th>
                <th>Category</th>
                <th>Account</th>
                <th>Amount</th>
                <th>Frequency</th>
                <th>Next run</th>
                <th>Status</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {templates.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE).map((t) => (
                <tr key={t.id}>
                  <td>{t.description}</td>
                  <td>{t.category_name || "Uncategorized"}</td>
                  <td>{t.account_name}</td>
                  <td>{fmt(t.amount)}</td>
                  <td style={{ textTransform: "capitalize" }}>{t.frequency}</td>
                  <td>{new Date(t.next_run_date).toLocaleDateString()}</td>
                  <td>
                    <span className={`status-pill ${t.is_active ? "active" : "cancelled"}`}>
                      {t.is_active ? "Active" : "Paused"}
                    </span>
                  </td>
                  <td style={{ display: "flex", gap: 6 }}>
                    <button className="icon-btn" title="Attachments" onClick={() => setAttachId(attachId === t.id ? null : t.id)}>
                      <Paperclip size={14} />
                    </button>
                    <button className="btn secondary" onClick={() => handleToggleActive(t)}>
                      {t.is_active ? "Pause" : "Resume"}
                    </button>
                    <button className="btn secondary" onClick={() => handleArchive(t.id)}>
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <Pagination page={page} totalItems={templates.length} onChange={setPage} />
      </div>

      {attachId && <DocumentUpload entityType="recurring_expense" entityId={attachId} />}
    </div>
  );
}
