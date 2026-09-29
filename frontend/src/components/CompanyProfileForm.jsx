import { useRef, useState } from "react";
import { Building2, Link2, Landmark, ShieldCheck, Upload, Palette } from "lucide-react";
import { api } from "../api/client";
import { useAuth } from "../AuthContext";
import { Section } from "./Section";

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const SWATCHES = ["#0036f3", "#ff381d", "#bced00", "#7c3aed", "#0ea5a4", "#e11d48", "#070707"];

// Fuller company profile, modeled on the field depth of comparable products'
// Organization Profile screens — logo, brand color, company details,
// contact/links, fiscal year, and KYC numbers. Shared between first-time
// setup (CompanySetup) and ongoing editing (Settings). CAC/NIN/BVN "Verify"
// is a stand-in: no verification vendor is selected yet
// (docs/11-open-questions.md #8), so this records the number against the
// profile rather than pretending to call a live registry.
export function CompanyProfileForm({ submitLabel = "Save changes" }) {
  const { tenant, refreshTenant } = useAuth();
  const [form, setForm] = useState({
    name: tenant?.name || "",
    cacNumber: tenant?.cac_number || "",
    tin: tenant?.tin || "",
    nin: tenant?.nin || "",
    bvn: tenant?.bvn || "",
    address: tenant?.address || "",
    industry: tenant?.industry || "",
    phone: tenant?.phone || "",
    website: tenant?.website || "",
    fiscalYearStartMonth: tenant?.fiscal_year_start_month || 1,
    brandColor: tenant?.brand_color || "#0036f3",
  });
  const [logoPreview, setLogoPreview] = useState(tenant?.logo_url || null);
  const [logoUrl, setLogoUrl] = useState("");
  const fileInputRef = useRef(null);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  function handleLogoChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 1024 * 1024) {
      setError("Logo must be 1MB or smaller.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setLogoPreview(reader.result);
      setLogoUrl(reader.result);
    };
    reader.readAsDataURL(file);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSaved(false);
    setSaving(true);
    try {
      await api.patch("/tenants/me", { ...form, logoUrl: logoUrl || undefined });
      await refreshTenant();
      setSaved(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {error && <div className="error-banner">{error}</div>}
      {saved && <p style={{ color: "var(--success)", fontSize: "0.88rem", margin: 0 }}>Saved.</p>}

      <Section icon={Upload} title="Organisation logo" description="Appears on invoices, receipts, and report exports.">
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div
            onClick={() => fileInputRef.current?.click()}
            style={{
              width: 72,
              height: 72,
              borderRadius: 12,
              border: "1.5px dashed var(--border)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              overflow: "hidden",
              background: "var(--bg)",
              flexShrink: 0,
            }}
          >
            {logoPreview ? (
              <img src={logoPreview} alt="Logo preview" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            ) : (
              <Upload size={20} color="var(--muted)" />
            )}
          </div>
          <div>
            <button type="button" className="btn secondary" onClick={() => fileInputRef.current?.click()}>
              Upload logo
            </button>
            <p style={{ fontSize: "0.76rem", color: "var(--muted)", marginTop: 6 }}>
              Preferred 240×240px &middot; PNG or JPG &middot; up to 1MB
            </p>
          </div>
          <input ref={fileInputRef} type="file" accept="image/png,image/jpeg" hidden onChange={handleLogoChange} />
        </div>
      </Section>

      <Section icon={Palette} title="Brand color" description="Used for buttons, links, and highlights throughout Kora.">
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          {SWATCHES.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setForm({ ...form, brandColor: c })}
              style={{
                width: 32,
                height: 32,
                borderRadius: "50%",
                background: c,
                border: form.brandColor === c ? "3px solid var(--text)" : "1px solid var(--border)",
                cursor: "pointer",
              }}
              aria-label={`Use ${c}`}
            />
          ))}
          <input
            type="color"
            value={form.brandColor}
            onChange={(e) => setForm({ ...form, brandColor: e.target.value })}
            style={{ width: 36, height: 32, padding: 0, border: "1px solid var(--border)", borderRadius: 8, cursor: "pointer" }}
          />
          <button type="button" className="btn secondary" onClick={() => setForm({ ...form, brandColor: "#0036f3" })}>
            Reset to default
          </button>
        </div>
      </Section>

      <Section icon={Building2} title="Company details">
        <div className="form-grid">
          <div className="field">
            <label>Company name</label>
            <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div className="field">
            <label>Industry</label>
            <input
              placeholder="e.g. Retail, Manufacturing, Services"
              value={form.industry}
              onChange={(e) => setForm({ ...form, industry: e.target.value })}
            />
          </div>
          <div className="field">
            <label>CAC registration number</label>
            <input value={form.cacNumber} onChange={(e) => setForm({ ...form, cacNumber: e.target.value })} />
          </div>
          <div className="field" style={{ gridColumn: "1 / -1" }}>
            <label>Company address</label>
            <input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
          </div>
        </div>
      </Section>

      <Section icon={Link2} title="Contact & links">
        <div className="form-grid">
          <div className="field">
            <label>Phone number</label>
            <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          </div>
          <div className="field">
            <label>Website</label>
            <input placeholder="https://" value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} />
          </div>
        </div>
      </Section>

      <Section icon={Landmark} title="Fiscal year" description="Reports run on this cycle.">
        <div className="form-grid">
          <div className="field">
            <label>Fiscal year starts in</label>
            <select
              value={form.fiscalYearStartMonth}
              onChange={(e) => setForm({ ...form, fiscalYearStartMonth: Number(e.target.value) })}
            >
              {MONTHS.map((m, i) => (
                <option key={m} value={i + 1}>
                  {m}
                </option>
              ))}
            </select>
          </div>
        </div>
      </Section>

      <Section
        icon={ShieldCheck}
        title="KYC information"
        description="Used for identity verification and to activate the Wallet. Never shown on invoices or reports."
      >
        <div className="form-grid">
          <div className="field">
            <label>TIN</label>
            <input value={form.tin} onChange={(e) => setForm({ ...form, tin: e.target.value })} />
          </div>
          <div className="field">
            <label>NIN</label>
            <input value={form.nin} onChange={(e) => setForm({ ...form, nin: e.target.value })} />
          </div>
          <div className="field">
            <label>BVN</label>
            <input value={form.bvn} onChange={(e) => setForm({ ...form, bvn: e.target.value })} />
          </div>
        </div>
        <p style={{ fontSize: "0.78rem", color: "var(--muted)", marginTop: 12, marginBottom: 0 }}>
          Automatic CAC/NIN/BVN verification is coming soon — these numbers are saved to your profile now and
          verified before Wallet activation.
        </p>
      </Section>

      <button className="btn" disabled={saving} type="submit" style={{ alignSelf: "flex-start", padding: "11px 28px" }}>
        {saving ? "Saving..." : submitLabel}
      </button>
    </form>
  );
}
