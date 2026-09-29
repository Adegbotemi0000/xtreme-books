import { useAuth } from "../AuthContext";
import { CompanyProfileForm } from "../components/CompanyProfileForm";

// The "in dashboard overview, they set up their company details" step —
// gates the full nav in the frontend until this completes. Everything here
// can be edited again later under Settings (CompanyProfileForm is shared).
export function CompanySetup() {
  const { tenant, user } = useAuth();

  return (
    <div>
      <div className="page-header">
        <h1>Welcome, {tenant?.name}</h1>
      </div>
      <p style={{ color: "var(--muted)", marginTop: -12, marginBottom: 20 }}>
        Hi {user?.name?.split(" ")[0]} — let's set up {tenant?.name} before you get started. You can edit any of this
        later under Settings.
      </p>

      <CompanyProfileForm submitLabel="Finish setup" />
    </div>
  );
}
