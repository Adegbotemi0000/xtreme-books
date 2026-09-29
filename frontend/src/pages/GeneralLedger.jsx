import { useEffect, useState } from "react";
import { api } from "../api/client";

export function GeneralLedger() {
  const [rows, setRows] = useState([]);
  const [glAccounts, setGlAccounts] = useState([]);
  const [accountId, setAccountId] = useState("");

  useEffect(() => {
    api.get("/gl-accounts").then(setGlAccounts);
  }, []);

  useEffect(() => {
    api.get(accountId ? `/journals/general-ledger?accountId=${accountId}` : "/journals/general-ledger").then(setRows);
  }, [accountId]);

  return (
    <div>
      <div className="page-header">
        <h1>General Ledger</h1>
        <select value={accountId} onChange={(e) => setAccountId(e.target.value)}>
          <option value="">All accounts</option>
          {glAccounts.map((a) => (
            <option key={a.id} value={a.id}>
              {a.code} — {a.name}
            </option>
          ))}
        </select>
      </div>
      <div className="card">
        {rows.length === 0 ? (
          <div className="empty-state">No postings yet.</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Entry #</th>
                <th>Account</th>
                <th>Description</th>
                <th>Debit</th>
                <th>Credit</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={i}>
                  <td>{new Date(r.date).toLocaleDateString()}</td>
                  <td>{r.entry_number}</td>
                  <td>
                    {r.account_code} — {r.account_name}
                  </td>
                  <td>{r.description}</td>
                  <td>{Number(r.debit) > 0 ? `₦${Number(r.debit).toLocaleString()}` : ""}</td>
                  <td>{Number(r.credit) > 0 ? `₦${Number(r.credit).toLocaleString()}` : ""}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
