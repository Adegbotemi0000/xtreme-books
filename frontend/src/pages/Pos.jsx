import { useEffect, useState } from "react";
import { api } from "../api/client";
import { StatusPill } from "../components/StatusPill";

function fmt(n) {
  return `₦${Number(n || 0).toLocaleString()}`;
}

export function Pos() {
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [sales, setSales] = useState([]);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  function loadSales() {
    api.get("/pos").then(setSales);
  }
  useEffect(loadSales, []);
  useEffect(() => {
    api.get("/products").then(setProducts);
  }, []);

  function addToCart(product) {
    setCart((c) => {
      const existing = c.find((i) => i.productId === product.id);
      if (existing) {
        return c.map((i) => (i.productId === product.id ? { ...i, quantity: i.quantity + 1 } : i));
      }
      return [...c, { productId: product.id, name: product.name, unitPrice: product.unit_price, vatRate: product.vat_rate, quantity: 1 }];
    });
  }

  function updateQty(productId, quantity) {
    setCart((c) => c.map((i) => (i.productId === productId ? { ...i, quantity: Number(quantity) } : i)));
  }

  function removeFromCart(productId) {
    setCart((c) => c.filter((i) => i.productId !== productId));
  }

  const subtotal = cart.reduce((sum, i) => sum + i.quantity * i.unitPrice, 0);
  const vat = cart.reduce((sum, i) => sum + i.quantity * i.unitPrice * (i.vatRate / 100), 0);

  async function checkout() {
    setError("");
    setSaving(true);
    try {
      await api.post("/pos", {
        items: cart.map((i) => ({ productId: i.productId, quantity: i.quantity })),
        paymentMethod,
      });
      setCart([]);
      loadSales();
      api.get("/products").then(setProducts);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <div className="page-header">
        <h1>Point of Sale</h1>
      </div>

      {error && <div className="error-banner">{error}</div>}

      <div className="dashboard-row dashboard-row-uneven">
        <div className="card">
          <h3 style={{ marginTop: 0 }}>Products</h3>
          {products.length === 0 ? (
            <div className="empty-state">No products yet — add some under Products.</div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: 10 }}>
              {products.map((p) => (
                <button
                  key={p.id}
                  className="btn secondary"
                  style={{ flexDirection: "column", alignItems: "flex-start", padding: "12px 14px", height: "auto" }}
                  onClick={() => addToCart(p)}
                >
                  <span style={{ fontWeight: 700 }}>{p.name}</span>
                  <span style={{ fontSize: "0.78rem", color: "var(--muted)" }}>{fmt(p.unit_price)}</span>
                  <span style={{ fontSize: "0.72rem", color: "var(--muted-light)" }}>{p.stock_quantity} in stock</span>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="card">
          <h3 style={{ marginTop: 0 }}>Cart</h3>
          {cart.length === 0 ? (
            <div className="empty-state">Tap a product to add it.</div>
          ) : (
            <>
              <table>
                <tbody>
                  {cart.map((i) => (
                    <tr key={i.productId}>
                      <td>{i.name}</td>
                      <td>
                        <input
                          type="number"
                          min="1"
                          value={i.quantity}
                          onChange={(e) => updateQty(i.productId, e.target.value)}
                          style={{ width: 55 }}
                        />
                      </td>
                      <td>{fmt(i.quantity * i.unitPrice)}</td>
                      <td>
                        <button className="btn secondary" onClick={() => removeFromCart(i.productId)}>
                          ×
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div style={{ marginTop: 14, textAlign: "right" }}>
                <p style={{ margin: 0 }}>Subtotal: {fmt(subtotal)}</p>
                <p style={{ margin: 0 }}>VAT: {fmt(vat)}</p>
                <p style={{ margin: 0, fontWeight: 700 }}>Total: {fmt(subtotal + vat)}</p>
              </div>
              <div className="field" style={{ marginTop: 14 }}>
                <label>Payment method</label>
                <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
                  <option value="cash">Cash</option>
                  <option value="bank_transfer">Bank transfer</option>
                  <option value="pos_card">POS card</option>
                  <option value="split">Split</option>
                </select>
              </div>
              <button className="btn" style={{ marginTop: 14, width: "100%", justifyContent: "center" }} disabled={saving} onClick={checkout}>
                {saving ? "Processing..." : `Charge ${fmt(subtotal + vat)}`}
              </button>
            </>
          )}
        </div>
      </div>

      <div className="card">
        <h3 style={{ marginTop: 0 }}>Recent sales</h3>
        {sales.length === 0 ? (
          <div className="empty-state">No sales yet.</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Sale #</th>
                <th>Date</th>
                <th>Total</th>
                <th>Method</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {sales.map((s) => (
                <tr key={s.id}>
                  <td>{s.sale_number}</td>
                  <td>{new Date(s.date).toLocaleDateString()}</td>
                  <td>{fmt(s.total)}</td>
                  <td style={{ textTransform: "capitalize" }}>{s.payment_method.replace("_", " ")}</td>
                  <td>
                    <StatusPill status={s.status} />
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
