import { useNavigate } from "react-router-dom";
import { useAuth } from "../AuthContext";
import { CompanyProfileForm } from "../components/CompanyProfileForm";

// Its own page at /company-setup — not the Dashboard. A banner on the
// Dashboard links here until setup_completed flips true; everything here can
// be edited again later under Settings (CompanyProfileForm is shared).
export function CompanySetup() {
  const { tenant, user } = useAuth();
  const navigate = useNavigate();

  return (
    <div>
      <div className="page-header">
        <h1>Set up {tenant?.name || "your company"}</h1>
      </div>
      <p style={{ color: "var(--muted)", marginTop: -12, marginBottom: 20 }}>
        Hi {user?.name?.split(" ")[0]} — a few details before you get started. You can edit any of this later under
        Settings.
      </p>

      <CompanyProfileForm submitLabel="Finish setup" onSaved={() => navigate("/")} />
    </div>
  );
}
