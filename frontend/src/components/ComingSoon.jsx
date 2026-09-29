export function ComingSoon({ module, description }) {
  return (
    <div>
      <div className="page-header">
        <h1>{module}</h1>
      </div>
      <div className="coming-soon">
        <p style={{ fontWeight: 600, color: "var(--text)" }}>{module} is scaffolded, full build coming next</p>
        <p>{description}</p>
      </div>
    </div>
  );
}
