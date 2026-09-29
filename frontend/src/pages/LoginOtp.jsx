import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ShieldCheck } from "lucide-react";
import { api } from "../api/client";
import { useAuth } from "../AuthContext";
import { AuthLayout } from "../components/AuthLayout";

export function LoginOtp() {
  const { state } = useLocation();
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const { login } = useAuth();
  const navigate = useNavigate();

  if (!state?.pendingToken) {
    navigate("/login");
    return null;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    try {
      const data = await api.post("/auth/login/otp", { pendingToken: state.pendingToken, code });
      login(data);
      navigate("/");
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <AuthLayout>
      <div className="auth-card">
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
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
            <ShieldCheck size={18} />
          </span>
          <h1 style={{ margin: 0, fontSize: "1.4rem" }}>Enter your OTP code</h1>
        </div>
        <p style={{ color: "var(--muted)", marginTop: 4, marginBottom: 20 }}>
          Open your authenticator app for the current 6-digit code.
        </p>
        {error && <div className="error-banner">{error}</div>}
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
            Verify
          </button>
        </form>
      </div>
    </AuthLayout>
  );
}
