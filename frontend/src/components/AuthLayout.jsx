import { ShieldCheck, Zap, Landmark } from "lucide-react";

const POINTS = [
  { icon: ShieldCheck, text: "NRS REV 360 e-invoicing, IRN on every invoice" },
  { icon: Zap, text: "Full double-entry books, posted automatically" },
  { icon: Landmark, text: "VAT, WHT, PAYE & CIT, always current" },
];

// Shared two-panel shell for every auth screen (login, signup, verify,
// OTP) — a branded left panel plus the form on the right, replacing the
// single centered card every screen used before.
export function AuthLayout({ children }) {
  return (
    <div style={{ minHeight: "100vh", display: "flex" }}>
      <div
        style={{
          flex: "0 0 42%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "48px 44px",
          background:
            "radial-gradient(circle at 85% 15%, rgba(188,237,0,0.22), transparent 45%), linear-gradient(160deg, #070707 0%, #0a0d2e 35%, #0036f3 100%)",
          color: "white",
        }}
        className="auth-brand-panel"
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span
            style={{
              width: 34,
              height: 34,
              borderRadius: 9,
              background: "var(--lime, #bced00)",
              color: "#070707",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 800,
            }}
          >
            K
          </span>
          <span style={{ fontWeight: 800, fontSize: "1.15rem" }}>Kora</span>
        </div>

        <div>
          <h1 style={{ fontSize: "2rem", fontWeight: 800, lineHeight: 1.15, maxWidth: 380 }}>
            Run your books like a world-class company.
          </h1>
          <div style={{ marginTop: 32, display: "flex", flexDirection: "column", gap: 16 }}>
            {POINTS.map((p) => (
              <div key={p.text} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <span
                  style={{
                    width: 30,
                    height: 30,
                    borderRadius: 8,
                    background: "rgba(255,255,255,0.16)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <p.icon size={16} />
                </span>
                <span style={{ fontSize: "0.92rem", color: "rgba(255,255,255,0.92)" }}>{p.text}</span>
              </div>
            ))}
          </div>
        </div>

        <p style={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.7)" }}>
          Kora by Xtreme Cr8 &middot; Built for Nigerian businesses
        </p>
      </div>

      <div
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "32px",
          background: "var(--bg)",
        }}
      >
        {children}
      </div>

      <style>{`
        @media (max-width: 860px) {
          .auth-brand-panel { display: none; }
        }
      `}</style>
    </div>
  );
}
