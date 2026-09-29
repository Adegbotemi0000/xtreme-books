import { useEffect, useState } from "react";
import { api } from "../api/client";
import { StatusPill } from "../components/StatusPill";

export function Quotations() {
  const [quotations, setQuotations] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [customerId, setCustomerId] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [items, setItems] = useState([{ description: "", quantity: 1, unitPrice: 0, vatRate: 7.5 }]);
  const [error, setError] = useState("");

  function load() {
    api.get("/sales/quotations").then(setQuotations);
  }

  useEffect(load, []);
  useEffect(() => {
    api.get("/customers").then(setCustomers);
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    try {
      await api.post("/sales/quotations", { customerId, date, items });
      setShowForm(false);
      setItems([{ description: "", quantity: 1, unitPrice: 0, vatRate: 7.5 }]);
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleConvert(id) {
    setError("");
    try {
      await api.post(`/sales/quotations/${id}/convert`);
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div>
      <div className="page-header">
        <h1>Quotations</h1>
        <button className="btn" onClick={() => setShowForm((v) => !v)}>
          {showForm ? "Cancel" : "+ New quotation"}
        </button>
      </div>

      {error && <div className="error-banner">{error}</div>}

      {showForm && (
        <div className="card">
          <form onSubmit={handleSubmit}>
            <div className="form-grid">
              <div className="field">
                <label>Customer</label>
                <select required value={customerId} onChange={(e) => setCustomerId(e.target.value)}>
                  <option value="">Select a customer</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label>Date</label>
                <input type="date" required value={date} onChange={(e) => setDate(e.target.value)} />
              </div>
            </div>

            {items.map((item, i) => (
              <div className="form-grid" key={i} style={{ marginTop: 10 }}>
                <input
                  placeholder="Description"
                  required
                  value={item.description}
                  onChange={(e) =>
                    setItems(items.map((it, idx) => (idx === i ? { ...it, description: e.target.value } : it)))
                  }
                />
                <input
                  type="number"
                  placeholder="Qty"
                  value={item.quantity}
                  onChange={(e) =>
                    setItems(items.map((it, idx) => (idx === i ? { ...it, quantity: e.target.value } : it)))
                  }
                />
                <input
                  type="number"
                  placeholder="Unit price"
                  value={item.unitPrice}
                  onChange={(e) =>
                    setItems(items.map((it, idx) => (idx === i ? { ...it, unitPrice: e.target.value } : it)))
                  }
                />
              </div>
            ))}
            <button
              type="button"
              className="btn secondary"
              style={{ marginTop: 10 }}
              onClick={() => setItems([...items, { description: "", quantity: 1, unitPrice: 0, vatRate: 7.5 }])}
            >
              + Add line
            </button>
            <div style={{ marginTop: 14 }}>
              <button className="btn" type="submit">
                Save quotation
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="card">
        {quotations.length === 0 ? (
          <div className="empty-state">No quotations yet.</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Quotation #</th>
                <th>Customer</th>
                <th>Total</th>
                <th>Status</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {quotations.map((q) => (
                <tr key={q.id}>
                  <td>{q.quotation_number}</td>
                  <td>{q.customer_name}</td>
                  <td>₦{Number(q.total).toLocaleString()}</td>
                  <td>
                    <StatusPill status={q.status} />
                  </td>
                  <td>
                    {q.status === "draft" || q.status === "sent" ? (
                      <button className="btn secondary" onClick={() => handleConvert(q.id)}>
                        Convert to invoice
                      </button>
                    ) : null}
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
