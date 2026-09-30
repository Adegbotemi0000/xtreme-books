import { useEffect, useState } from "react";
import { ArrowLeft, Trash2 } from "lucide-react";
import { api } from "../api/client";
import { Pagination, PAGE_SIZE } from "../components/Pagination";

function fmt(n) {
  return `₦${Number(n || 0).toLocaleString()}`;
}

function BudgetDetail({ budgetId, onBack, onDeleted }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api.get(`/budgets/${budgetId}/vs-actual`).then(setData).catch((err) => setError(err.message));
  }, [budgetId]);

  async function handleDelete() {
    if (!confirm("Remove this budget?")) return;
    await api.delete(`/budgets/${budgetId}`).catch((err) => setError(err.message));
    onDeleted();
  }

  if (error) return <div className="error-banner">{error}</div>;
  if (!data) return <p>Loading...</p>;

  return (
    <div>
      <button className="btn secondary" style={{ marginBottom: 14 }} onClick={onBack}>
        <ArrowLeft size={14} /> Back to budgets
      </button>
      <div className="page-header">
        <h1>
          {data.name} <span style={{ fontWeight: 400, color: "var(--muted)" }}>FY{data.fiscal_year}</span>
        </h1>
        <button className="btn danger" onClick={handleDelete}>
          <Trash2 size={14} /> Remove
        </button>
      </div>
      <p style={{ color: "var(--muted)", marginTop: -12, marginBottom: 20 }}>
        Year-to-date budget reflects {data.monthsElapsed} month{data.monthsElapsed === 1 ? "" : "s"} elapsed in FY{data.fiscal_year}.
      </p>

      <div className="stat-grid" style={{ marginBottom: 16 }}>
        <div className="stat-card">
          <div className="label">Annual budget</div>
          <div className="value">{fmt(data.totals.annualBudget)}</div>
        </div>
        <div className="stat-card">
          <div className="label">YTD budget</div>
          <div className="value">{fmt(data.totals.ytdBudget)}</div>
        </div>
        <div className="stat-card">
          <div className="label">Actual spend</div>
          <div className="value">{fmt(data.totals.actual)}</div>
        </div>
        <div className={`stat-card ${data.totals.variance < 0 ? "warn" : ""}`}>
          <div className="label">Variance</div>
          <div className="value">{fmt(data.totals.variance)}</div>
        </div>
      </div>

      <div className="card">
        <table>
          <thead>
            <tr>
              <th>Category</th>
              <th>Monthly</th>
              <th>Annual budget</th>
              <th>YTD budget</th>
              <th>Actual</th>
              <th>Variance</th>
              <th>% used</th>
            </tr>
          </thead>
          <tbody>
            {data.lines.map((l) => (
              <tr key={l.categoryId}>
                <td>{l.categoryName}</td>
                <td>{fmt(l.monthlyAmount)}</td>
                <td>{fmt(l.annualBudget)}</td>
                <td>{fmt(l.ytdBudget)}</td>
                <td>{fmt(l.actual)}</td>
                <td style={{ color: l.variance < 0 ? "var(--danger)" : "var(--text)" }}>{fmt(l.variance)}</td>
                <td>{l.pctUsed.toFixed(0)}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function Budgets() {
  const [budgets, setBudgets] = useState([]);
  const [categories, setCategories] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [fiscalYear, setFiscalYear] = useState(new Date().getFullYear());
  const [lineAmounts, setLineAmounts] = useState({});
  const [error, setError] = useState("");
  const [openBudgetId, setOpenBudgetId] = useState(null);
  const [page, setPage] = useState(1);

  function load() {
    api.get("/budgets").then(setBudgets);
  }
  useEffect(load, []);
  useEffect(() => {
    api.get("/categories").then((rows) => setCategories(rows.filter((c) => c.type === "expense")));
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    const lines = Object.entries(lineAmounts)
      .filter(([, amount]) => Number(amount) > 0)
      .map(([categoryId, monthlyAmount]) => ({ categoryId: Number(categoryId), monthlyAmount: Number(monthlyAmount) }));
    try {
      await api.post("/budgets", { name, fiscalYear: Number(fiscalYear), lines });
      setShowForm(false);
      setName("");
      setLineAmounts({});
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  if (openBudgetId) {
    return (
      <BudgetDetail
        budgetId={openBudgetId}
        onBack={() => setOpenBudgetId(null)}
        onDeleted={() => {
          setOpenBudgetId(null);
          load();
        }}
      />
    );
  }

  return (
    <div>
      <div className="page-header">
        <h1>Budgets</h1>
        <button className="btn" onClick={() => setShowForm((v) => !v)}>
          {showForm ? "Cancel" : "+ New budget"}
        </button>
      </div>

      {error && <div className="error-banner">{error}</div>}

      {showForm && (
        <div className="card" style={{ marginBottom: 16 }}>
          <form onSubmit={handleSubmit}>
            <div className="form-grid">
              <div className="field">
                <label>Name</label>
                <input required value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div className="field">
                <label>Fiscal year</label>
                <input type="number" required value={fiscalYear} onChange={(e) => setFiscalYear(e.target.value)} />
              </div>
            </div>
            <h3 style={{ marginTop: 18, marginBottom: 8, fontSize: "0.9rem" }}>Monthly amount per category</h3>
            <div className="form-grid">
              {categories.length === 0 ? (
                <p style={{ color: "var(--muted)" }}>No expense categories yet — add some under Categories first.</p>
              ) : (
                categories.map((c) => (
                  <div className="field" key={c.id}>
                    <label>{c.name}</label>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="0"
                      value={lineAmounts[c.id] || ""}
                      onChange={(e) => setLineAmounts({ ...lineAmounts, [c.id]: e.target.value })}
                    />
                  </div>
                ))
              )}
            </div>
            <div style={{ marginTop: 14 }}>
              <button className="btn" type="submit">
                Save budget
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="card">
        {budgets.length === 0 ? (
          <div className="empty-state">No budgets yet.</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Fiscal year</th>
                <th>Annual total</th>
              </tr>
            </thead>
            <tbody>
              {budgets.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE).map((b) => (
                <tr key={b.id} style={{ cursor: "pointer" }} onClick={() => setOpenBudgetId(b.id)}>
                  <td>{b.name}</td>
                  <td>{b.fiscal_year}</td>
                  <td>{fmt(b.annual_total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <Pagination page={page} totalItems={budgets.length} onChange={setPage} />
      </div>
    </div>
  );
}
