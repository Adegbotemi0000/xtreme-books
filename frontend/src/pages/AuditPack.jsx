import { useState } from "react";
import { Download } from "lucide-react";
import { apiDownload } from "../api/client";

export function AuditPack() {
  const [from, setFrom] = useState(`${new Date().getFullYear()}-01-01`);
  const [to, setTo] = useState(new Date().toISOString().slice(0, 10));
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState("");

  async function handleDownload() {
    setDownloading(true);
    setError("");
    try {
      await apiDownload(`/reports/audit-pack/download?from=${from}&to=${to}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setDownloading(false);
    }
  }

  return (
    <div>
      <div className="page-header">
        <h1>Audit-Ready Pack</h1>
      </div>
      <p style={{ color: "var(--muted)", marginTop: -12, marginBottom: 20 }}>
        A single Excel workbook bundling Trial Balance, Income Statement, Balance Sheet, Cash Flow
        Statement, and the full General Ledger detail for a chosen period — everything an external
        reviewer would ask for first.
      </p>

      {error && <div className="error-banner">{error}</div>}

      <div className="card">
        <div style={{ display: "flex", gap: 10, alignItems: "end", flexWrap: "wrap" }}>
          <div className="field">
            <label>From</label>
            <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
          </div>
          <div className="field">
            <label>To</label>
            <input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
          </div>
          <button className="btn" disabled={downloading} onClick={handleDownload}>
            <Download size={14} /> {downloading ? "Preparing..." : "Download Excel pack"}
          </button>
        </div>
      </div>

      <div className="card">
        <h3 style={{ marginTop: 0 }}>What's included</h3>
        <ul style={{ margin: 0, paddingLeft: 20, color: "var(--muted)", fontSize: "0.88rem", lineHeight: 1.9 }}>
          <li>Trial Balance — every GL account as of the period end</li>
          <li>Income Statement — revenue, cost of goods sold, and operating expenses for the period</li>
          <li>Balance Sheet — assets, liabilities, and equity as of the period end, with a balanced check</li>
          <li>Cash Flow Statement — operating, investing, and financing cash movements</li>
          <li>General Ledger Detail — every journal line posted in the period, across every account</li>
        </ul>
      </div>
    </div>
  );
}
