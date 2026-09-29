import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { UserPlus } from "lucide-react";
import { api } from "../api/client";
import { AuthLayout } from "../components/AuthLayout";

const PASSWORD_RULE = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;

function passwordStrength(password) {
  let score = 0;
  if (password.length >= 8) score++;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
  if (/\d/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  return score;
}

const STRENGTH_COLORS = ["#e4e6ea", "#ff381d", "#b8860b", "#0036f3", "#6b9600"];
const STRENGTH_LABELS = ["", "Weak", "Fair", "Good", "Strong"];

export function Signup() {
  const [form, setForm] = useState({ companyName: "", adminName: "", adminEmail: "", password: "", confirmPassword: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const passwordValid = PASSWORD_RULE.test(form.password);
  const passwordsMatch = form.password && form.password === form.confirmPassword;
  const strength = passwordStrength(form.password);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    if (!passwordValid) {
      setError("Password must be at least 8 characters, with an uppercase letter, a lowercase letter, a number, and a special character.");
      return;
    }
    if (!passwordsMatch) {
      setError("Passwords do not match.");
      return;
    }
    setLoading(true);
    try {
      const data = await api.post("/auth/signup", form);
      navigate("/verify-email", { state: { email: data.email, devVerificationCode: data.devVerificationCode } });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
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
              <UserPlus size={18} />
            </span>
            <h1 style={{ margin: 0, fontSize: "1.4rem" }}>Start your free trial</h1>
          </div>
          <span style={{ fontSize: "0.74rem", fontWeight: 700, color: "var(--muted)" }}>STEP 1 OF 2</span>
        </div>
        <p style={{ color: "var(--muted)", marginTop: 4, marginBottom: 20 }}>
          No card required. Foundation plan includes 2 users.
        </p>
        {error && <div className="error-banner">{error}</div>}
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div className="field">
            <label>Company name</label>
            <input required value={form.companyName} onChange={(e) => setForm({ ...form, companyName: e.target.value })} />
          </div>
          <div className="field">
            <label>Your name</label>
            <input required value={form.adminName} onChange={(e) => setForm({ ...form, adminName: e.target.value })} />
          </div>
          <div className="field">
            <label>Email</label>
            <input type="email" required value={form.adminEmail} onChange={(e) => setForm({ ...form, adminEmail: e.target.value })} />
          </div>
          <div className="field">
            <label>Password</label>
            <input type="password" required value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
            {form.password && (
              <div style={{ display: "flex", gap: 4, marginTop: 2 }}>
                {[1, 2, 3, 4].map((i) => (
                  <span
                    key={i}
                    style={{
                      height: 4,
                      flex: 1,
                      borderRadius: 2,
                      background: i <= strength ? STRENGTH_COLORS[strength] : "var(--border)",
                      transition: "background 150ms ease",
                    }}
                  />
                ))}
              </div>
            )}
            <span style={{ fontSize: "0.78rem", color: form.password && !passwordValid ? "var(--danger)" : "var(--muted)" }}>
              {form.password ? STRENGTH_LABELS[strength] + " — " : ""}At least 8 characters, with uppercase, lowercase, a number, and a special character.
            </span>
          </div>
          <div className="field">
            <label>Confirm password</label>
            <input
              type="password"
              required
              value={form.confirmPassword}
              onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
            />
            {form.confirmPassword && !passwordsMatch && (
              <span style={{ fontSize: "0.78rem", color: "var(--danger)" }}>Passwords do not match.</span>
            )}
          </div>
          <button className="btn" disabled={loading} type="submit" style={{ justifyContent: "center", padding: "11px 18px" }}>
            {loading ? "Creating your account..." : "Create account"}
          </button>
        </form>
        <p style={{ marginTop: 18, fontSize: "0.9rem", textAlign: "center" }}>
          Already have an account? <Link to="/login">Log in</Link>
        </p>
      </div>
    </AuthLayout>
  );
}
