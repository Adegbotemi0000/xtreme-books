import { useEffect, useState } from "react";
import { api } from "../api/client";

function fmt(n) {
  return `₦${Number(n || 0).toLocaleString()}`;
}

export function Expenses() {
  const [expenses, setExpenses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    description: "",
    amount: "",
    date: new Date().toISOString().slice(0, 10),
    paymentMethod: "cash",
    accountId: "",
    categoryId: "",
  });
  const [error, setError] = useState("");

  function load() {
    api.get("/expenses").then(setExpenses);
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
      await api.post("/expenses", { ...form, categoryId: form.categoryId || undefined });
      setShowForm(false);
      setForm({ description: "", amount: "", date: new Date().toISOString().slice(0, 10), paymentMethod: "cash", accountId: "", categoryId: "" });
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleArchive(id) {
    if (!confirm("Archive this expense? Its GL posting stays as a reversible record.")) return;
    await api.delete(`/expenses/${id}`).catch((err) => setError(err.message));
    load();
  }

  return (
    <div>
      <div className="page-header">
        <h1>Expenses</h1>
        <button className="btn" onClick={() => setShowForm((v) => !v)}>
          {showForm ? "Cancel" : "+ New expense"}
        </button>
      </div>

      {error && <div className="error-banner">{error}</div>}

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
              <label>Date</label>
              <input type="date" required value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
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
        {expenses.length === 0 ? (
          <div className="empty-state">No expenses yet.</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Description</th>
                <th>Category</th>
                <th>Account</th>
                <th>Amount</th>
                <th>Date</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {expenses.map((e) => (
                <tr key={e.id}>
                  <td>{e.description}</td>
                  <td>{e.category_name || "Uncategorized"}</td>
                  <td>{e.account_name}</td>
                  <td>{fmt(e.amount)}</td>
                  <td>{new Date(e.date).toLocaleDateString()}</td>
                  <td>
                    <button className="btn secondary" onClick={() => handleArchive(e.id)}>
                      Archive
                    </button>
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
