import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api/client";

export function NewInvoice() {
  const [customers, setCustomers] = useState([]);
  const [customerId, setCustomerId] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [buyerTin, setBuyerTin] = useState("");
  const [sellerTin, setSellerTin] = useState("");
  const [items, setItems] = useState([{ description: "", quantity: 1, unitPrice: 0, vatRate: 7.5 }]);
  const [customerNotes, setCustomerNotes] = useState("Thanks for your business.");
  const [terms, setTerms] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    api.get("/customers").then(setCustomers);
  }, []);

  function updateItem(i, field, value) {
    setItems(items.map((item, idx) => (idx === i ? { ...item, [field]: value } : item)));
  }

  function addItem() {
    setItems([...items, { description: "", quantity: 1, unitPrice: 0, vatRate: 7.5 }]);
  }

  function removeItem(i) {
    setItems(items.filter((_, idx) => idx !== i));
  }

  const subtotal = items.reduce((sum, i) => sum + Number(i.quantity || 0) * Number(i.unitPrice || 0), 0);
  const vat = items.reduce(
    (sum, i) => sum + Number(i.quantity || 0) * Number(i.unitPrice || 0) * (Number(i.vatRate || 0) / 100),
    0
  );

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      const invoice = await api.post("/sales/invoices", {
        customerId,
        date,
        buyerTin,
        sellerTin,
        items,
        customerNotes,
        terms,
      });
      navigate(`/invoices/${invoice.id}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <div className="page-header">
        <h1>New invoice</h1>
      </div>
      {error && <div className="error-banner">{error}</div>}
      <form onSubmit={handleSubmit}>
        <div className="card">
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
            <div className="field">
              <label>Buyer TIN</label>
              <input value={buyerTin} onChange={(e) => setBuyerTin(e.target.value)} />
            </div>
            <div className="field">
              <label>Seller TIN</label>
              <input value={sellerTin} onChange={(e) => setSellerTin(e.target.value)} />
            </div>
          </div>
        </div>

        <div className="card">
          <h3 style={{ marginTop: 0 }}>Line items</h3>
          <table>
            <thead>
              <tr>
                <th>Description</th>
                <th>Qty</th>
                <th>Unit price</th>
                <th>VAT %</th>
                <th>Line total</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {items.map((item, i) => (
                <tr key={i}>
                  <td>
                    <input
                      required
                      value={item.description}
                      onChange={(e) => updateItem(i, "description", e.target.value)}
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      step="0.01"
                      style={{ width: 70 }}
                      value={item.quantity}
                      onChange={(e) => updateItem(i, "quantity", e.target.value)}
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      step="0.01"
                      style={{ width: 110 }}
                      value={item.unitPrice}
                      onChange={(e) => updateItem(i, "unitPrice", e.target.value)}
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      step="0.01"
                      style={{ width: 70 }}
                      value={item.vatRate}
                      onChange={(e) => updateItem(i, "vatRate", e.target.value)}
                    />
                  </td>
                  <td>₦{(Number(item.quantity || 0) * Number(item.unitPrice || 0)).toLocaleString()}</td>
                  <td>
                    {items.length > 1 && (
                      <button type="button" className="btn secondary" onClick={() => removeItem(i)}>
                        Remove
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <button type="button" className="btn secondary" style={{ marginTop: 10 }} onClick={addItem}>
            + Add line
          </button>

          <div style={{ marginTop: 18, textAlign: "right" }}>
            <p>Subtotal: ₦{subtotal.toLocaleString()}</p>
            <p>VAT: ₦{vat.toLocaleString()}</p>
            <p style={{ fontWeight: 700 }}>Total: ₦{(subtotal + vat).toLocaleString()}</p>
          </div>
        </div>

        <div className="card">
          <div className="form-grid">
            <div className="field">
              <label>Customer notes</label>
              <textarea rows={3} value={customerNotes} onChange={(e) => setCustomerNotes(e.target.value)} />
              <span style={{ fontSize: "0.76rem", color: "var(--muted)" }}>Will be displayed on the invoice.</span>
            </div>
            <div className="field">
              <label>Terms &amp; conditions (optional)</label>
              <textarea
                rows={3}
                placeholder="Enter the terms and conditions of your business to be displayed on this invoice"
                value={terms}
                onChange={(e) => setTerms(e.target.value)}
              />
            </div>
          </div>
        </div>

        <button className="btn" disabled={saving} type="submit">
          {saving ? "Saving..." : "Save as draft"}
        </button>
      </form>
    </div>
  );
}
