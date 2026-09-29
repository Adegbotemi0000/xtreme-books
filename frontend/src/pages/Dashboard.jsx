import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { Building2, ArrowRight } from "lucide-react";
import { api } from "../api/client";
import { useAuth } from "../AuthContext";

// Validated categorical palette (dataviz skill: node scripts/validate_palette.js) —
// brand blue as slot 1, the rest snapped to the documented default order so
// every adjacent pair clears the CVD/contrast gates. Not raw brand hexes
// reused as chart colors — that reads as an unvalidated, "vibe-coded" choice.
const CATEGORY_COLORS = ["#0036f3", "#eb6834", "#1baf7a", "#eda100", "#e87ba4", "#008300", "#4a3aa7", "#e34948"];

const MONTH_LABELS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
function monthLabel(key) {
  const [, m] = key.split("-");
  return MONTH_LABELS[Number(m) - 1];
}

function fmt(n) {
  return `₦${Number(n || 0).toLocaleString("en-NG", { maximumFractionDigits: 0 })}`;
}

function Tile({ label, value, sub, warn, to }) {
  const content = (
    <>
      <div className="label">{label}</div>
      <div className="value">{value}</div>
      {sub && <div className="label" style={{ marginTop: 2 }}>{sub}</div>}
    </>
  );
  return to ? (
    <Link to={to} className={`stat-card stat-card-link ${warn ? "warn" : ""}`}>
      {content}
    </Link>
  ) : (
    <div className={`stat-card ${warn ? "warn" : ""}`}>{content}</div>
  );
}

// Single current-vs-overdue stacked bar — the shared shape behind both the
// Receivables and Payables cards, matching xtreme-finance-system's AgingBar.
function AgingBar({ buckets, currentColor }) {
  const current = buckets.find((b) => b.key === "current")?.total || 0;
  const overdue = buckets.find((b) => b.key === "overdue")?.total || 0;
  const total = current + overdue;
  const currentPct = total > 0 ? (current / total) * 100 : 50;

  return (
    <div>
      <div className="aging-bar-track">
        {total === 0 ? (
          <div className="aging-bar-segment" style={{ width: "100%", background: "var(--border)" }} />
        ) : (
          <>
            {current > 0 && <div className="aging-bar-segment" style={{ width: `${currentPct}%`, background: currentColor }} />}
            {overdue > 0 && <div className="aging-bar-segment" style={{ width: `${100 - currentPct}%`, background: "var(--danger)" }} />}
          </>
        )}
      </div>
      <div className="aging-bar-labels">
        <div>
          <span className="aging-bar-dot" style={{ background: currentColor }} />
          Current <strong>{fmt(current)}</strong>
        </div>
        <div>
          <span className="aging-bar-dot" style={{ background: "var(--danger)" }} />
          Overdue <strong>{fmt(overdue)}</strong>
        </div>
      </div>
    </div>
  );
}

export function Dashboard() {
  const { tenant } = useAuth();
  const [summary, setSummary] = useState(null);
  const [kpis, setKpis] = useState(null);

  useEffect(() => {
    api.get("/dashboard/summary").then(setSummary);
    api.get("/dashboard/kpis").then(setKpis);
  }, []);

  const cashFlowTrend = (kpis?.cashFlowTrend || []).map((m) => ({ ...m, label: monthLabel(m.month) }));
  const expenseByCategory = kpis?.expenseByCategory || [];
  const totalExpenseCategory = expenseByCategory.reduce((sum, c) => sum + c.total, 0);
  const totalIncome = summary?.revenue || 0;
  const totalExpense = summary?.expenses || 0;
  const incomeExpenseData = [
    { name: "Revenue", value: totalIncome || 0.0001, color: "#0036f3" },
    { name: "Expenses", value: totalExpense || 0.0001, color: "#e2e8f0" },
  ];

  return (
    <div>
      <div className="page-header">
        <h1>Welcome, {tenant?.name}</h1>
      </div>

      {tenant && !tenant.setup_completed && (
        <Link to="/company-setup" className="setup-banner">
          <div className="setup-banner-icon">
            <Building2 size={18} />
          </div>
          <div className="setup-banner-copy">
            <strong>Finish setting up {tenant.name}</strong>
            <span>Add your logo, brand color, and company details — takes about two minutes.</span>
          </div>
          <ArrowRight size={18} />
        </Link>
      )}

      {summary && (
        <>
          <div className="dashboard-row dashboard-row-2">
            <div className="card">
              <div className="dashboard-card-header">
                <h3>Receivables</h3>
                <Link to="/invoices/new" className="btn secondary">
                  + New invoice
                </Link>
              </div>
              <p style={{ fontSize: "0.8rem", color: "var(--muted)", marginTop: -2 }}>
                Total outstanding: {fmt(summary.receivablesOutstanding)}
              </p>
              <AgingBar buckets={summary.receivablesAging || []} currentColor="#0036f3" />
            </div>

            <div className="card">
              <div className="dashboard-card-header">
                <h3>Payables</h3>
                <Link to="/purchases" className="btn secondary">
                  + New purchase
                </Link>
              </div>
              <p style={{ fontSize: "0.8rem", color: "var(--muted)", marginTop: -2 }}>
                Total unpaid bills: {fmt(summary.payablesTotal)}
              </p>
              <AgingBar buckets={[{ key: "current", total: summary.payablesTotal }]} currentColor="#0036f3" />
            </div>
          </div>

          <div className="dashboard-row dashboard-row-uneven">
            <div className="card">
              <div className="dashboard-card-header">
                <h3>Revenue &amp; expenses</h3>
                <span style={{ fontSize: "0.78rem", color: "var(--muted)" }}>All time</span>
              </div>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={incomeExpenseData} dataKey="value" nameKey="name" innerRadius={60} outerRadius={92} paddingAngle={2}>
                    {incomeExpenseData.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v) => fmt(v)} contentStyle={{ borderRadius: 8, fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="dashboard-chart-totals">
                <div>
                  <span className="aging-bar-dot" style={{ background: "#0036f3" }} /> Revenue<strong>{fmt(totalIncome)}</strong>
                </div>
                <div>
                  <span className="aging-bar-dot" style={{ background: "#94a3b8" }} /> Expenses<strong>{fmt(totalExpense)}</strong>
                </div>
              </div>
            </div>

            <div className="card">
              <div className="dashboard-card-header">
                <h3>Top expenses</h3>
                <span style={{ fontSize: "0.78rem", color: "var(--muted)" }}>This year</span>
              </div>
              {expenseByCategory.length === 0 ? (
                <div className="empty-state">No expenses recorded yet.</div>
              ) : (
                <>
                  <ResponsiveContainer width="100%" height={190}>
                    <PieChart>
                      <Pie data={expenseByCategory} dataKey="total" nameKey="category" innerRadius={52} outerRadius={80} paddingAngle={1}>
                        {expenseByCategory.map((entry, i) => (
                          <Cell key={entry.category} fill={CATEGORY_COLORS[i % CATEGORY_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(v) => fmt(v)} contentStyle={{ borderRadius: 8, fontSize: 12 }} />
                    </PieChart>
                  </ResponsiveContainer>
                  <ul className="dashboard-legend">
                    {expenseByCategory.slice(0, 6).map((entry, i) => (
                      <li key={entry.category}>
                        <span className="aging-bar-dot" style={{ background: CATEGORY_COLORS[i % CATEGORY_COLORS.length] }} />
                        {entry.category}
                        <strong>{totalExpenseCategory > 0 ? Math.round((entry.total / totalExpenseCategory) * 100) : 0}%</strong>
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </div>
          </div>

          <div className="card">
            <div className="dashboard-card-header">
              <h3>Cash flow</h3>
              <span style={{ fontSize: "0.78rem", color: "var(--muted)" }}>Last 6 months</span>
            </div>
            {cashFlowTrend.length === 0 ? (
              <div className="empty-state">No payments recorded yet.</div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={cashFlowTrend} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                  <XAxis dataKey="label" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis
                    tick={{ fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                    width={40}
                    tickFormatter={(v) => (v >= 1000000 ? `${(v / 1000000).toFixed(0)}M` : v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v)}
                  />
                  <Tooltip formatter={(v) => fmt(v)} contentStyle={{ borderRadius: 8, fontSize: 12 }} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Bar dataKey="cashIn" name="Cash in" fill="#0036f3" radius={[3, 3, 0, 0]} />
                  <Bar dataKey="cashOut" name="Cash out" fill="#ff381d" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className="stat-grid" style={{ marginTop: 16 }}>
            <Tile label="Revenue" value={fmt(summary.revenue)} to="/invoices" />
            <Tile label="Expenses" value={fmt(summary.expenses)} to="/expenses" />
            <Tile label="Profit" value={fmt(summary.profit)} warn={summary.profit < 0} to="/reports" />
            <Tile label="Cash position" value={fmt(summary.cashPosition)} to="/accounts" />
            <Tile label="Receivables outstanding" value={fmt(summary.receivablesOutstanding)} to="/receivables" />
            <Tile label="Products low on stock" value={summary.lowStockCount} warn={summary.lowStockCount > 0} to="/inventory" />
          </div>
        </>
      )}
    </div>
  );
}
