import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { api } from "../api/client";

export function JournalDetail() {
  const { id } = useParams();
  const [entry, setEntry] = useState(null);

  useEffect(() => {
    api.get(`/journals/${id}`).then(setEntry);
  }, [id]);

  if (!entry) return <p>Loading...</p>;

  return (
    <div>
      <div className="page-header">
        <h1>{entry.entry_number}</h1>
      </div>
      <div className="card">
        <p>
          <strong>Date:</strong> {new Date(entry.date).toLocaleDateString()}
        </p>
        <p>
          <strong>Memo:</strong> {entry.memo}
        </p>
        <table>
          <thead>
            <tr>
              <th>Account</th>
              <th>Description</th>
              <th>Debit</th>
              <th>Credit</th>
            </tr>
          </thead>
          <tbody>
            {entry.lines.map((l) => (
              <tr key={l.id}>
                <td>
                  {l.account_code} — {l.account_name}
                </td>
                <td>{l.description}</td>
                <td>{Number(l.debit) > 0 ? `₦${Number(l.debit).toLocaleString()}` : ""}</td>
                <td>{Number(l.credit) > 0 ? `₦${Number(l.credit).toLocaleString()}` : ""}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
