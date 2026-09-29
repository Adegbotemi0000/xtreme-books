import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { LogIn } from "lucide-react";
import { api } from "../api/client";
import { useAuth } from "../AuthContext";
import { AuthLayout } from "../components/AuthLayout";

export function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const data = await api.post("/auth/login", { email, password });
      if (data.otpRequired) {
        navigate("/login/otp", { state: { pendingToken: data.pendingToken } });
        return;
      }
      login(data);
      navigate("/");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
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
            <LogIn size={18} />
          </span>
          <h1 style={{ margin: 0, fontSize: "1.4rem" }}>Welcome back</h1>
        </div>
        <p style={{ color: "var(--muted)", marginTop: 4, marginBottom: 20 }}>Log in to your Kora account.</p>
        {error && <div className="error-banner">{error}</div>}
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div className="field">
            <label>Email</label>
            <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="field">
            <label>Password</label>
            <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
          <button className="btn" disabled={loading} type="submit" style={{ justifyContent: "center", padding: "11px 18px" }}>
            {loading ? "Logging in..." : "Log in"}
          </button>
        </form>
        <p style={{ marginTop: 18, fontSize: "0.9rem", textAlign: "center" }}>
          No account? <Link to="/signup">Start your free trial</Link>
        </p>
      </div>
    </AuthLayout>
  );
}
