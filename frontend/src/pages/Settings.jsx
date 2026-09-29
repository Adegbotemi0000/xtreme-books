import { CompanyProfileForm } from "../components/CompanyProfileForm";

// "Company Overview" — the ongoing home for everything set up once at
// CompanySetup: name, logo, brand color, CAC/TIN/KYC, fiscal year. Same
// shared form, just reachable any time under Admin > Settings instead of
// gating the app.
export function Settings() {
  return (
    <div>
      <div className="page-header">
        <h1>Company Overview</h1>
      </div>
      <p style={{ color: "var(--muted)", marginTop: -12, marginBottom: 20 }}>
        Manage your company profile, branding, and compliance details.
      </p>
      <CompanyProfileForm submitLabel="Save changes" />
    </div>
  );
}
