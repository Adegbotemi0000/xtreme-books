import { useEffect, useState } from "react";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";
import { api } from "../api/client";
import { Pagination, PAGE_SIZE } from "../components/Pagination";

function fmt(n) {
  return Number(n || 0).toLocaleString();
}

function VoucherDetail({ voucherId, onBack }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api.get(`/production/vouchers/${voucherId}`).then(setData).catch((err) => setError(err.message));
  }, [voucherId]);

  if (error) return <div className="error-banner">{error}</div>;
  if (!data) return <p>Loading...</p>;

  return (
    <div>
      <button className="btn secondary" style={{ marginBottom: 14 }} onClick={onBack}>
        <ArrowLeft size={14} /> Back to Production
      </button>
      <div className="page-header">
        <h1>{data.voucher_number}</h1>
      </div>
      <p style={{ color: "var(--muted)", marginTop: -12, marginBottom: 20 }}>
        {new Date(data.date).toLocaleDateString()} · Produced {fmt(data.quantity_produced)} {data.finished_product_name}
        {data.notes && ` — ${data.notes}`}
      </p>

      <div className="card">
        <h3 style={{ marginTop: 0 }}>Materials consumed</h3>
        <table>
          <thead>
            <tr>
              <th>Material</th>
              <th>Used</th>
              <th>Expected (recipe)</th>
              <th>Wastage</th>
            </tr>
          </thead>
          <tbody>
            {data.materials.map((m) => {
              const wastage = m.quantity_expected != null ? Number(m.quantity_used) - Number(m.quantity_expected) : null;
              return (
                <tr key={m.id}>
                  <td>{m.material_name}</td>
                  <td>{fmt(m.quantity_used)}</td>
                  <td>{m.quantity_expected != null ? fmt(m.quantity_expected) : "—"}</td>
                  <td style={{ color: wastage > 0 ? "var(--danger)" : "var(--text)" }}>
                    {wastage != null ? fmt(wastage) : "—"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function Production() {
  const [vouchers, setVouchers] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [products, setProducts] = useState([]);
  const [showTemplateForm, setShowTemplateForm] = useState(false);
  const [showVoucherForm, setShowVoucherForm] = useState(false);
  const [templateForm, setTemplateForm] = useState({ name: "", finishedProductId: "" });
  const [templateItems, setTemplateItems] = useState([{ materialProductId: "", quantityPerUnit: "" }]);
  const [voucherForm, setVoucherForm] = useState({ bomTemplateId: "", quantityProduced: "", notes: "" });
  const [error, setError] = useState("");
  const [openVoucherId, setOpenVoucherId] = useState(null);
  const [page, setPage] = useState(1);

  function load() {
    api.get("/production/vouchers").then(setVouchers);
    api.get("/production/templates").then(setTemplates);
  }
  useEffect(load, []);
  useEffect(() => {
    api.get("/products").then(setProducts);
  }, []);

  async function handleCreateTemplate(e) {
    e.preventDefault();
    setError("");
    try {
      await api.post("/production/templates", {
        ...templateForm,
        items: templateItems.filter((i) => i.materialProductId && i.quantityPerUnit),
      });
      setShowTemplateForm(false);
      setTemplateForm({ name: "", finishedProductId: "" });
      setTemplateItems([{ materialProductId: "", quantityPerUnit: "" }]);
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleCreateVoucher(e) {
    e.preventDefault();
    setError("");
    try {
      await api.post("/production/vouchers", voucherForm);
      setShowVoucherForm(false);
      setVoucherForm({ bomTemplateId: "", quantityProduced: "", notes: "" });
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  if (openVoucherId) {
    return <VoucherDetail voucherId={openVoucherId} onBack={() => { setOpenVoucherId(null); load(); }} />;
  }

  return (
    <div>
      <div className="page-header">
        <h1>Production</h1>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="btn secondary" onClick={() => setShowTemplateForm((v) => !v)}>
            {showTemplateForm ? "Cancel" : "+ New recipe"}
          </button>
          <button className="btn" onClick={() => setShowVoucherForm((v) => !v)}>
            {showVoucherForm ? "Cancel" : "+ Record production"}
          </button>
        </div>
      </div>
      <p style={{ color: "var(--muted)", marginTop: -12, marginBottom: 20 }}>
        Bill-of-materials runs that consume raw material stock and produce finished goods — each
        voucher compares actual material use against the recipe, so wastage is visible per run.
      </p>

      {error && <div className="error-banner">{error}</div>}

      {showTemplateForm && (
        <div className="card" style={{ marginBottom: 16 }}>
          <h3 style={{ marginTop: 0 }}>New recipe (BOM template)</h3>
          <form onSubmit={handleCreateTemplate}>
            <div className="form-grid">
              <div className="field">
                <label>Recipe name</label>
                <input required value={templateForm.name} onChange={(e) => setTemplateForm({ ...templateForm, name: e.target.value })} />
              </div>
              <div className="field">
                <label>Finished product</label>
                <select required value={templateForm.finishedProductId} onChange={(e) => setTemplateForm({ ...templateForm, finishedProductId: e.target.value })}>
                  <option value="">Select product</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <h4 style={{ marginBottom: 8 }}>Materials per unit produced</h4>
            {templateItems.map((item, i) => (
              <div className="form-grid" key={i} style={{ marginBottom: 8 }}>
                <select
                  value={item.materialProductId}
                  onChange={(e) => setTemplateItems(templateItems.map((it, idx) => (idx === i ? { ...it, materialProductId: e.target.value } : it)))}
                >
                  <option value="">Select material</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
                <input
                  type="number"
                  step="0.0001"
                  placeholder="Quantity per unit"
                  value={item.quantityPerUnit}
                  onChange={(e) => setTemplateItems(templateItems.map((it, idx) => (idx === i ? { ...it, quantityPerUnit: e.target.value } : it)))}
                />
              </div>
            ))}
            <button
              type="button"
              className="btn secondary"
              style={{ marginBottom: 14 }}
              onClick={() => setTemplateItems([...templateItems, { materialProductId: "", quantityPerUnit: "" }])}
            >
              + Add material
            </button>
            <div>
              <button className="btn" type="submit">
                Save recipe
              </button>
            </div>
          </form>
        </div>
      )}

      {showVoucherForm && (
        <div className="card" style={{ marginBottom: 16 }}>
          <h3 style={{ marginTop: 0 }}>Record production</h3>
          <form onSubmit={handleCreateVoucher} className="form-grid">
            <div className="field">
              <label>Recipe</label>
              <select required value={voucherForm.bomTemplateId} onChange={(e) => setVoucherForm({ ...voucherForm, bomTemplateId: e.target.value })}>
                <option value="">Select a recipe</option>
                {templates.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} → {t.finished_product_name}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label>Quantity produced</label>
              <input
                type="number"
                step="0.01"
                required
                value={voucherForm.quantityProduced}
                onChange={(e) => setVoucherForm({ ...voucherForm, quantityProduced: e.target.value })}
              />
            </div>
            <div className="field" style={{ gridColumn: "1 / -1" }}>
              <label>Notes</label>
              <input value={voucherForm.notes} onChange={(e) => setVoucherForm({ ...voucherForm, notes: e.target.value })} />
            </div>
            <div style={{ gridColumn: "1 / -1" }}>
              <button className="btn" type="submit">
                Save
              </button>
            </div>
          </form>
          {templates.length === 0 && (
            <p style={{ color: "var(--muted)", fontSize: "0.86rem", marginTop: 10 }}>
              Create a recipe first — a production voucher needs one to know what materials to consume.
            </p>
          )}
        </div>
      )}

      <div className="card">
        {vouchers.length === 0 ? (
          <div className="empty-state">No production runs yet.</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Voucher #</th>
                <th>Finished product</th>
                <th>Quantity produced</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {vouchers.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE).map((v) => (
                <tr key={v.id} style={{ cursor: "pointer" }} onClick={() => setOpenVoucherId(v.id)}>
                  <td>{v.voucher_number}</td>
                  <td>{v.finished_product_name}</td>
                  <td>{fmt(v.quantity_produced)}</td>
                  <td>{new Date(v.date).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <Pagination page={page} totalItems={vouchers.length} onChange={setPage} />
      </div>
    </div>
  );
}
