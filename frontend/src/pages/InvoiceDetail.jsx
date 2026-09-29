import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { api } from "../api/client";
import { StatusPill } from "../components/StatusPill";

export function InvoiceDetail() {
  const { id } = useParams();
  const [invoice, setInvoice] = useState(null);
  const [accounts, setAccounts] = useState([]);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentAccount, setPaymentAccount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("bank_transfer");
  const [error, setError] = useState("");

  function load() {
    api.get(`/sales/invoices/${id}`).then(setInvoice);
  }

  useEffect(load, [id]);
  useEffect(() => {
    api.get("/accounts").then(setAccounts);
  }, []);

  async function handleIssue() {
    setError("");
    try {
      await api.post(`/sales/invoices/${id}/issue`);
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleCancel() {
    if (!confirm("Cancel this invoice? This reverses any GL postings.")) return;
    setError("");
    try {
      await api.post(`/sales/invoices/${id}/cancel`);
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handlePayment(e) {
    e.preventDefault();
    setError("");
    try {
      await api.post(`/sales/invoices/${id}/payments`, {
        amount: paymentAmount,
        date: new Date().toISOString().slice(0, 10),
        method: paymentMethod,
        accountId: paymentAccount,
      });
      setPaymentAmount("");
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  if (!invoice) return <p>Loading...</p>;

  const balance = Number(invoice.total) - Number(invoice.amount_paid);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>{invoice.invoice_number}</h1>
          <StatusPill status={invoice.status} />
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          {invoice.status === "draft" && (
            <button className="btn" onClick={handleIssue}>
              Issue invoice
            </button>
          )}
          {invoice.status !== "cancelled" && (
            <button className="btn danger" onClick={handleCancel}>
              Cancel
            </button>
          )}
        </div>
      </div>

      {error && <div className="error-banner">{error}</div>}

      <div className="card">
        <div className="form-grid">
          <p>
            <strong>Customer:</strong> {invoice.customer_name}
          </p>
          <p>
            <strong>Date:</strong> {new Date(invoice.date).toLocaleDateString()}
          </p>
          <p>
            <strong>Buyer TIN:</strong> {invoice.buyer_tin || "—"}
          </p>
          <p>
            <strong>Seller TIN:</strong> {invoice.seller_tin || "—"}
          </p>
          <p>
            <strong>IRN:</strong> {invoice.irn || "Pending issue"}
          </p>
          <p>
            <strong>E-invoice status:</strong> {invoice.e_invoice_status}
          </p>
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
              <th>Line total</th>
            </tr>
          </thead>
          <tbody>
            {invoice.items.map((item) => (
              <tr key={item.id}>
                <td>{item.description}</td>
                <td>{item.quantity}</td>
                <td>₦{Number(item.unit_price).toLocaleString()}</td>
                <td>₦{Number(item.line_total).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div style={{ marginTop: 14, textAlign: "right" }}>
          <p>Subtotal: ₦{Number(invoice.subtotal).toLocaleString()}</p>
          <p>VAT: ₦{Number(invoice.vat_amount).toLocaleString()}</p>
          <p style={{ fontWeight: 700 }}>Total: ₦{Number(invoice.total).toLocaleString()}</p>
          <p>Paid: ₦{Number(invoice.amount_paid).toLocaleString()}</p>
          <p style={{ fontWeight: 700 }}>Balance: ₦{balance.toLocaleString()}</p>
        </div>
        {(invoice.customer_notes || invoice.terms) && (
          <div style={{ marginTop: 14, borderTop: "1px solid var(--border)", paddingTop: 14 }}>
            {invoice.customer_notes && (
              <p style={{ fontSize: "0.86rem" }}>
                <strong>Notes:</strong> {invoice.customer_notes}
              </p>
            )}
            {invoice.terms && (
              <p style={{ fontSize: "0.86rem", color: "var(--muted)" }}>
                <strong>Terms &amp; conditions:</strong> {invoice.terms}
              </p>
            )}
          </div>
        )}
      </div>

      {invoice.status === "issued" || invoice.status === "partially_paid" ? (
        <div className="card">
          <h3 style={{ marginTop: 0 }}>Record a payment</h3>
          <form onSubmit={handlePayment} className="form-grid">
            <div className="field">
              <label>Amount</label>
              <input type="number" step="0.01" required value={paymentAmount} onChange={(e) => setPaymentAmount(e.target.value)} />
            </div>
            <div className="field">
              <label>Account</label>
              <select required value={paymentAccount} onChange={(e) => setPaymentAccount(e.target.value)}>
                <option value="">Select account</option>
                {accounts.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label>Method</label>
              <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
                <option value="cash">Cash</option>
                <option value="bank_transfer">Bank transfer</option>
                <option value="pos_card">POS card</option>
                <option value="split">Split</option>
              </select>
            </div>
            <div style={{ alignSelf: "end" }}>
              <button className="btn" type="submit">
                Record payment
              </button>
            </div>
          </form>
        </div>
      ) : null}

      {invoice.payments.length > 0 && (
        <div className="card">
          <h3 style={{ marginTop: 0 }}>Payment history</h3>
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Amount</th>
                <th>Method</th>
              </tr>
            </thead>
            <tbody>
              {invoice.payments.map((p) => (
                <tr key={p.id}>
                  <td>{new Date(p.date).toLocaleDateString()}</td>
                  <td>₦{Number(p.amount).toLocaleString()}</td>
                  <td>{p.method}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
