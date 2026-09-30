import { useEffect, useState } from "react";
import { Paperclip } from "lucide-react";
import { api } from "../api/client";
import { DocumentUpload } from "../components/DocumentUpload";
import { Pagination, PAGE_SIZE } from "../components/Pagination";

// Real-time stock read from the same products table Products.jsx manages —
// multi-branch tracking and stock movement history land alongside
// Production's build-out, per docs/02-modules.md 2.4.
export function Inventory() {
  const [products, setProducts] = useState([]);
  const [adjusting, setAdjusting] = useState(null);
  const [qty, setQty] = useState("");
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");
  const [attachId, setAttachId] = useState(null);
  const [page, setPage] = useState(1);

  function load() {
    api.get("/products").then(setProducts);
  }
  useEffect(load, []);

  function startAdjust(product) {
    setAdjusting(product.id);
    setQty("");
    setReason("");
    setError("");
  }

  async function submitAdjust(id) {
    if (!qty || !reason.trim()) {
      setError("Enter a quantity and a reason.");
      return;
    }
    setError("");
    try {
      await api.post(`/products/${id}/adjust-stock`, { quantity: qty, reason });
      setAdjusting(null);
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div>
      <div className="page-header">
        <h1>Inventory</h1>
      </div>
      {error && <div className="error-banner">{error}</div>}
      <div className="card">
        {products.length === 0 ? (
          <div className="empty-state">No products yet — add some under Products.</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Product</th>
                <th>SKU</th>
                <th>Stock on hand</th>
                <th>Reorder level</th>
                <th>Status</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {products.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE).map((p) => (
                <tr key={p.id}>
                  <td>{p.name}</td>
                  <td>{p.sku}</td>
                  <td>{p.stock_quantity}</td>
                  <td>{p.reorder_level}</td>
                  <td>
                    <span className={`status-pill ${Number(p.stock_quantity) <= Number(p.reorder_level) ? "pending" : "active"}`}>
                      {Number(p.stock_quantity) <= Number(p.reorder_level) ? "Low stock" : "OK"}
                    </span>
                  </td>
                  <td>
                    {adjusting === p.id ? (
                      <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                        <input type="number" placeholder="±qty" style={{ width: 70 }} value={qty} onChange={(e) => setQty(e.target.value)} />
                        <input placeholder="Reason" style={{ width: 140 }} value={reason} onChange={(e) => setReason(e.target.value)} />
                        <button className="btn secondary" onClick={() => submitAdjust(p.id)}>
                          Save
                        </button>
                        <button className="btn secondary" onClick={() => setAdjusting(null)}>
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <div style={{ display: "flex", gap: 6 }}>
                        <button className="icon-btn" title="Attachments" onClick={() => setAttachId(attachId === p.id ? null : p.id)}>
                          <Paperclip size={14} />
                        </button>
                        <button className="btn secondary" onClick={() => startAdjust(p)}>
                          Adjust stock
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <Pagination page={page} totalItems={products.length} onChange={setPage} />
      </div>

      {attachId && <DocumentUpload entityType="product" entityId={attachId} />}
    </div>
  );
}
