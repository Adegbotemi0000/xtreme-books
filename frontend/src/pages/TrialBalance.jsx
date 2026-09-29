import { useEffect, useState } from "react";
import { api } from "../api/client";

export function TrialBalance() {
  const [rows, setRows] = useState([]);

  useEffect(() => {
    api.get("/journals/trial-balance").then(setRows);
  }, []);

  const totalDebit = rows.reduce((sum, r) => sum + Number(r.total_debit), 0);
  const totalCredit = rows.reduce((sum, r) => sum + Number(r.total_credit), 0);

  return (
    <div>
      <div className="page-header">
        <h1>Trial Balance</h1>
      </div>
      <div className="card">
        <table>
          <thead>
            <tr>
              <th>Code</th>
              <th>Account</th>
              <th>Type</th>
              <th>Debit</th>
              <th>Credit</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id}>
                <td>{r.code}</td>
                <td>{r.name}</td>
                <td>{r.type}</td>
                <td>₦{Number(r.total_debit).toLocaleString()}</td>
                <td>₦{Number(r.total_credit).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td colSpan={3} style={{ fontWeight: 700 }}>
                Total
              </td>
              <td style={{ fontWeight: 700 }}>₦{totalDebit.toLocaleString()}</td>
              <td style={{ fontWeight: 700 }}>₦{totalCredit.toLocaleString()}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
