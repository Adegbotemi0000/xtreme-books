// Branded loading state — the Cr8 mark pops (scale pulse) while cycling
// through the brand's hue range via a CSS filter animation (one asset,
// no extra color variants needed).
export function LoadingScreen() {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "var(--bg, #f8fafc)",
      }}
    >
      <img
        src="/cr8-logo.png"
        alt="Loading Kora"
        width={72}
        height={72}
        style={{ animation: "kora-pop 1.1s ease-in-out infinite, kora-hue 3.2s linear infinite" }}
      />
      <style>{`
        @keyframes kora-pop {
          0%, 100% { transform: scale(0.85); }
          50% { transform: scale(1.08); }
        }
        @keyframes kora-hue {
          0% { filter: hue-rotate(0deg) saturate(1.3); }
          100% { filter: hue-rotate(360deg) saturate(1.3); }
        }
        @media (prefers-reduced-motion: reduce) {
          img { animation: none !important; }
        }
      `}</style>
    </div>
  );
}
