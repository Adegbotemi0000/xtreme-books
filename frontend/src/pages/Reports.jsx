import { useEffect, useState } from "react";
import { ArrowLeft, FileBarChart, Scale3d } from "lucide-react";
import { api } from "../api/client";

function fmt(n) {
  return `₦${Number(n || 0).toLocaleString()}`;
}

function IncomeStatementReport({ onBack }) {
  const today = new Date().toISOString().slice(0, 10);
  const [from, setFrom] = useState(`${new Date().getFullYear()}-01-01`);
  const [to, setTo] = useState(today);
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  function load() {
    api.get(`/reports/income-statement?from=${from}&to=${to}`).then(setData).catch((err) => setError(err.message));
  }
  useEffect(load, []);

  return (
    <div>
      <button className="btn secondary" style={{ marginBottom: 14 }} onClick={onBack}>
        <ArrowLeft size={14} /> Back to Reports
      </button>
      <div className="page-header">
        <h1>Income Statement</h1>
      </div>

      <div className="card" style={{ marginBottom: 16 }}>
        <div style={{ display: "flex", gap: 10, alignItems: "end", flexWrap: "wrap" }}>
          <div className="field">
            <label>From</label>
            <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
          </div>
          <div className="field">
            <label>To</label>
            <input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
          </div>
          <button className="btn" onClick={load}>
            Run report
          </button>
        </div>
      </div>

      {error && <div className="error-banner">{error}</div>}
      {!data ? (
        <p>Loading...</p>
      ) : (
        <div className="card">
          <h3 style={{ marginTop: 0 }}>Revenue</h3>
          <table>
            <tbody>
              {data.income.length === 0 ? (
                <tr><td className="empty-state">No revenue posted in this period.</td></tr>
              ) : (
                data.income.map((i) => (
                  <tr key={i.code}>
                    <td>{i.name}</td>
                    <td style={{ textAlign: "right" }}>{fmt(i.amount)}</td>
                  </tr>
                ))
              )}
              <tr style={{ fontWeight: 700, borderTop: "2px solid var(--border)" }}>
                <td>Total Revenue</td>
                <td style={{ textAlign: "right" }}>{fmt(data.totalRevenue)}</td>
              </tr>
            </tbody>
          </table>

          <h3>Cost of Goods Sold</h3>
          <table>
            <tbody>
              <tr>
                <td>Cost of Goods Sold</td>
                <td style={{ textAlign: "right" }}>{fmt(data.costOfGoodsSold)}</td>
              </tr>
              <tr style={{ fontWeight: 700, borderTop: "2px solid var(--border)" }}>
                <td>Gross Profit</td>
                <td style={{ textAlign: "right" }}>{fmt(data.grossProfit)}</td>
              </tr>
            </tbody>
          </table>

          <h3>Operating Expenses</h3>
          <table>
            <tbody>
              {data.operatingExpenses.length === 0 ? (
                <tr><td className="empty-state">No operating expenses posted in this period.</td></tr>
              ) : (
                data.operatingExpenses.map((e) => (
                  <tr key={e.code}>
                    <td>{e.name}</td>
                    <td style={{ textAlign: "right" }}>{fmt(e.amount)}</td>
                  </tr>
                ))
              )}
              <tr style={{ fontWeight: 700, borderTop: "2px solid var(--border)" }}>
                <td>Total Expenses</td>
                <td style={{ textAlign: "right" }}>{fmt(data.totalExpenses)}</td>
              </tr>
            </tbody>
          </table>

          <table>
            <tbody>
              <tr style={{ fontWeight: 800, fontSize: "1.05rem", borderTop: "3px double var(--text)" }}>
                <td>Net Profit</td>
                <td style={{ textAlign: "right", color: data.netProfit < 0 ? "var(--danger)" : "var(--text)" }}>{fmt(data.netProfit)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function BalanceSheetReport({ onBack }) {
  const [asOf, setAsOf] = useState(new Date().toISOString().slice(0, 10));
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  function load() {
    api.get(`/reports/balance-sheet?asOf=${asOf}`).then(setData).catch((err) => setError(err.message));
  }
  useEffect(load, []);

  return (
    <div>
      <button className="btn secondary" style={{ marginBottom: 14 }} onClick={onBack}>
        <ArrowLeft size={14} /> Back to Reports
      </button>
      <div className="page-header">
        <h1>Balance Sheet</h1>
      </div>

      <div className="card" style={{ marginBottom: 16 }}>
        <div style={{ display: "flex", gap: 10, alignItems: "end", flexWrap: "wrap" }}>
          <div className="field">
            <label>As of</label>
            <input type="date" value={asOf} onChange={(e) => setAsOf(e.target.value)} />
          </div>
          <button className="btn" onClick={load}>
            Run report
          </button>
        </div>
      </div>

      {error && <div className="error-banner">{error}</div>}
      {!data ? (
        <p>Loading...</p>
      ) : (
        <>
          {!data.isBalanced && (
            <div className="error-banner">
              Assets do not equal Liabilities + Equity — this indicates an unbalanced posting somewhere and should
              be investigated before relying on this report.
            </div>
          )}
          <div className="dashboard-row dashboard-row-2">
            <div className="card">
              <h3 style={{ marginTop: 0 }}>Assets</h3>
              <table>
                <tbody>
                  {data.assets.map((a) => (
                    <tr key={a.code}>
                      <td>{a.name}</td>
                      <td style={{ textAlign: "right" }}>{fmt(a.amount)}</td>
                    </tr>
                  ))}
                  <tr style={{ fontWeight: 700, borderTop: "2px solid var(--border)" }}>
                    <td>Total Assets</td>
                    <td style={{ textAlign: "right" }}>{fmt(data.totalAssets)}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="card">
              <h3 style={{ marginTop: 0 }}>Liabilities</h3>
              <table>
                <tbody>
                  {data.liabilities.map((l) => (
                    <tr key={l.code}>
                      <td>{l.name}</td>
                      <td style={{ textAlign: "right" }}>{fmt(l.amount)}</td>
                    </tr>
                  ))}
                  <tr style={{ fontWeight: 700, borderTop: "2px solid var(--border)" }}>
                    <td>Total Liabilities</td>
                    <td style={{ textAlign: "right" }}>{fmt(data.totalLiabilities)}</td>
                  </tr>
                </tbody>
              </table>

              <h3>Equity</h3>
              <table>
                <tbody>
                  {data.equity.map((e) => (
                    <tr key={e.code}>
                      <td>{e.name}</td>
                      <td style={{ textAlign: "right" }}>{fmt(e.amount)}</td>
                    </tr>
                  ))}
                  <tr>
                    <td>Current Retained Earnings</td>
                    <td style={{ textAlign: "right" }}>{fmt(data.netIncomeToDate)}</td>
                  </tr>
                  <tr style={{ fontWeight: 700, borderTop: "2px solid var(--border)" }}>
                    <td>Total Equity</td>
                    <td style={{ textAlign: "right" }}>{fmt(data.totalEquity)}</td>
                  </tr>
                </tbody>
              </table>
              <table>
                <tbody>
                  <tr style={{ fontWeight: 800, fontSize: "1.05rem", borderTop: "3px double var(--text)" }}>
                    <td>Total Liabilities &amp; Equity</td>
                    <td style={{ textAlign: "right" }}>{fmt(data.totalLiabilitiesAndEquity)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

const REPORT_CATALOG = [
  {
    key: "income-statement",
    title: "Income Statement",
    description: "Revenue, cost of goods sold, and operating expenses for a chosen period.",
    icon: FileBarChart,
  },
  {
    key: "balance-sheet",
    title: "Balance Sheet",
    description: "Assets, liabilities, and equity as of a chosen date.",
    icon: Scale3d,
  },
];

export function Reports() {
  const [openReport, setOpenReport] = useState(null);

  if (openReport === "income-statement") return <IncomeStatementReport onBack={() => setOpenReport(null)} />;
  if (openReport === "balance-sheet") return <BalanceSheetReport onBack={() => setOpenReport(null)} />;

  return (
    <div>
      <div className="page-header">
        <h1>Reports</h1>
      </div>
      <p style={{ color: "var(--muted)", marginTop: -12, marginBottom: 20 }}>
        Core financial statements, computed directly from the General Ledger.
      </p>
      <div className="dashboard-row dashboard-row-2">
        {REPORT_CATALOG.map((r) => {
          const Icon = r.icon;
          return (
            <button
              key={r.key}
              className="card report-card"
              onClick={() => setOpenReport(r.key)}
              style={{ textAlign: "left", cursor: "pointer", border: "1px solid var(--border)" }}
            >
              <div className="report-card-icon">
                <Icon size={18} />
              </div>
              <h3 style={{ margin: "10px 0 4px" }}>{r.title}</h3>
              <p style={{ margin: 0, color: "var(--muted)", fontSize: "0.86rem" }}>{r.description}</p>
            </button>
          );
        })}
      </div>
    </div>
  );
}
