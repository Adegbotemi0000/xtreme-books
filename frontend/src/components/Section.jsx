export function Section({ icon: Icon, title, description, children }) {
  return (
    <div className="card">
      <div style={{ display: "flex", alignItems: "flex-start", gap: 12, marginBottom: 16 }}>
        <span
          style={{
            width: 34,
            height: 34,
            borderRadius: 9,
            background: "var(--primary-light)",
            color: "var(--primary-dark)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <Icon size={17} />
        </span>
        <div>
          <h3 style={{ margin: 0, fontSize: "1rem" }}>{title}</h3>
          {description && <p style={{ margin: "2px 0 0", fontSize: "0.82rem", color: "var(--muted)" }}>{description}</p>}
        </div>
      </div>
      {children}
    </div>
  );
}
