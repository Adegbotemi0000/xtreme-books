import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { MailCheck } from "lucide-react";
import { api } from "../api/client";
import { useAuth } from "../AuthContext";
import { AuthLayout } from "../components/AuthLayout";

export function VerifyEmail() {
  const { state } = useLocation();
  const [code, setCode] = useState(state?.devVerificationCode || "");
  const [error, setError] = useState("");
  const [resent, setResent] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  if (!state?.email) {
    navigate("/signup");
    return null;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    try {
      const data = await api.post("/auth/verify-email", { email: state.email, code });
      login(data);
      navigate("/");
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleResend() {
    setError("");
    setResent(false);
    try {
      const data = await api.post("/auth/resend-verification", { email: state.email });
      if (data.devVerificationCode) setCode(data.devVerificationCode);
      setResent(true);
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <AuthLayout>
      <div className="auth-card">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                background: "var(--primary-light)",
                color: "var(--primary-dark)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <MailCheck size={18} />
            </span>
            <h1 style={{ margin: 0, fontSize: "1.4rem" }}>Verify your email</h1>
          </div>
          <span style={{ fontSize: "0.74rem", fontWeight: 700, color: "var(--muted)" }}>STEP 2 OF 2</span>
        </div>
        <p style={{ color: "var(--muted)", marginTop: 4, marginBottom: 20 }}>
          We sent a 6-digit code to <strong style={{ color: "var(--text)" }}>{state.email}</strong>.
          {state?.devVerificationCode && " No email service is configured yet, so it's pre-filled below for testing."}
        </p>
        {error && <div className="error-banner">{error}</div>}
        {resent && <p style={{ color: "var(--success)", fontSize: "0.88rem", marginTop: -8 }}>A new code was sent.</p>}
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div className="field">
            <label>6-digit code</label>
            <input
              value={code}
              onChange={(e) => setCode(e.target.value)}
              maxLength={6}
              required
              style={{ fontSize: "1.3rem", letterSpacing: "0.4em", textAlign: "center" }}
            />
          </div>
          <button className="btn" type="submit" style={{ justifyContent: "center", padding: "11px 18px" }}>
            Verify and continue
          </button>
        </form>
        <button className="btn secondary" style={{ marginTop: 12, width: "100%", justifyContent: "center" }} onClick={handleResend}>
          Resend code
        </button>
      </div>
    </AuthLayout>
  );
}
