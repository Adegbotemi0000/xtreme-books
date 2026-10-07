import { useEffect, useState } from "react";
import { Paperclip } from "lucide-react";
import { api } from "../api/client";
import { DocumentUpload } from "../components/DocumentUpload";
import { Pagination, PAGE_SIZE } from "../components/Pagination";

function BranchStockReport() {
  const [rows, setRows] = useState(null);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);

  useEffect(() => {
    api.get("/products/stock-by-branch").then(setRows).catch((err) => setError(err.message));
  }, []);

  if (error) return <div className="error-banner">{error}</div>;
  if (!rows) return <p>Loading...</p>;

  return (
    <div className="card">
      {rows.length === 0 ? (
        <div className="empty-state">No products yet — add some under Products.</div>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Product</th>
              <th>Total stock</th>
              <th>By branch</th>
              <th>Unallocated</th>
            </tr>
          </thead>
          <tbody>
            {rows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE).map((r) => (
              <tr key={r.productId}>
                <td>{r.productName}</td>
                <td>{r.totalStock}</td>
                <td>
                  {r.branches.length === 0 ? (
                    <span style={{ color: "var(--muted)" }}>—</span>
                  ) : (
                    r.branches.map((b) => (
                      <div key={b.branchId} style={{ fontSize: "0.84rem" }}>
                        {b.branchName}: <strong>{b.quantity}</strong>
                      </div>
                    ))
                  )}
                </td>
                <td style={{ color: r.unallocated !== r.totalStock ? "var(--text)" : "var(--muted)" }}>{r.unallocated}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      <Pagination page={page} totalItems={rows.length} onChange={setPage} />
    </div>
  );
}

export function Inventory() {
  const [products, setProducts] = useState([]);
  const [branches, setBranches] = useState([]);
  const [adjusting, setAdjusting] = useState(null);
  const [qty, setQty] = useState("");
  const [reason, setReason] = useState("");
  const [branchId, setBranchId] = useState("");
  const [error, setError] = useState("");
  const [attachId, setAttachId] = useState(null);
  const [page, setPage] = useState(1);
  const [view, setView] = useState("product");

  function load() {
    api.get("/products").then(setProducts);
  }
  useEffect(load, []);
  useEffect(() => {
    api.get("/branches").then(setBranches);
  }, []);

  function startAdjust(product) {
    setAdjusting(product.id);
    setQty("");
    setReason("");
    setBranchId("");
    setError("");
  }

  async function submitAdjust(id) {
    if (!qty || !reason.trim()) {
      setError("Enter a quantity and a reason.");
      return;
    }
    setError("");
    try {
      await api.post(`/products/${id}/adjust-stock`, { quantity: qty, reason, branchId: branchId || undefined });
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
        <div style={{ display: "flex", gap: 8 }}>
          <button className={`btn ${view === "product" ? "" : "secondary"}`} onClick={() => setView("product")}>
            By product
          </button>
          <button className={`btn ${view === "branch" ? "" : "secondary"}`} onClick={() => setView("branch")}>
            By branch
          </button>
        </div>
      </div>
      {error && <div className="error-banner">{error}</div>}

      {view === "branch" ? (
        <BranchStockReport />
      ) : (
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
                        <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
                          <input type="number" placeholder="±qty" style={{ width: 70 }} value={qty} onChange={(e) => setQty(e.target.value)} />
                          <input placeholder="Reason" style={{ width: 130 }} value={reason} onChange={(e) => setReason(e.target.value)} />
                          <select style={{ width: 130 }} value={branchId} onChange={(e) => setBranchId(e.target.value)}>
                            <option value="">No branch</option>
                            {branches.map((b) => (
                              <option key={b.id} value={b.id}>
                                {b.name}
                              </option>
                            ))}
                          </select>
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
      )}

      {attachId && <DocumentUpload entityType="product" entityId={attachId} />}
    </div>
  );
}
