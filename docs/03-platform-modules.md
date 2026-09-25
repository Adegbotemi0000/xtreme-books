# 03 — Platform-Side Modules

These are the pieces `xtreme-finance-system` never needed, because it only ever had one
tenant (Xtreme Cr8tivity itself) and one login provisioned by hand. Xtreme Books is a public
product — these modules are what make it one.

## 3.1 Public Marketing Website

Separate from the logged-in application. Must include:

- **Home/marketing pages** — product overview, features, screenshots, pricing, calls to
  action to sign up or book a demo. This is the "very nice and modern" homepage the business
  owner wants — see `08-branding-design.md`.
- **Pricing page** — the three tiers from `07-pricing-plans.md`, presented clearly, enforced
  by whatever the super-admin has configured (not hard-coded page content).
- **Sign-up/onboarding entry point** — see 3.3 below.
- **Demo booking** — calendar-based scheduling for a prospective customer to request a live
  demo; collects name, company, email, phone, preferred time slot; notifies the Xtreme
  Cr8tivity team.
- **Demo video page** — hosts and plays a pre-recorded product walkthrough (video content
  produced separately; the platform just needs to embed/play it).
- **Documentation/resource centre** — downloadable PDF guides and help content, organized by
  topic/module, manageable by Xtreme Cr8tivity without a code change.
- **Login** — entry point into the actual application for existing tenants.
- **Legal pages** — Terms of Service, Privacy Policy, Refund/Cancellation Policy; structured
  so content is editable without a code change (placeholder content acceptable at first).

## 3.2 Tenant Onboarding & Verification

Self-service, no manual review gate before a company can start using the product:

1. **Sign-up** — company name, email, password.
2. **Email verification** — a link/code sent to the provided email; the account can't proceed
   unverified.
3. **Company profile & documents** — company name, logo (shown only on that tenant's own
   dashboard, never on shared platform branding), CAC registration number + certificate
   upload, TIN, director name(s), primary contact (name, role, phone, email), address.
4. **Automated CAC/TIN verification** — attempted against whatever official Nigerian
   verification source is available (see `09-compliance-and-integrations.md` — the specific
   provider is still an open question).
5. **Full access regardless of verification outcome** — a company can use every
   accounting/bookkeeping feature immediately. Verification status is tracked and visibly
   flagged (e.g. "Pending Verification") until CAC and TIN checks resolve. The one exception:
   e-invoice transmission to NRS REV 360 is gated behind successful verification — an invoice
   can still be prepared and the e-invoice toggle used, but transmission is blocked with a
   clear message until verification clears.
6. **Subscription selection & payment** — a yearly plan chosen and paid via Paystack before or
   alongside onboarding. Full access requires an active paid subscription. A free trial, if
   offered, is a configurable option, not a permanent free tier.

## 3.3 Subscription, Billing & Payments

- Yearly billing only for MVP (no monthly plans).
- Paystack as the payment gateway for subscription payments and renewals.
- Multiple tiers (see `07-pricing-plans.md`), configured by Xtreme Cr8tivity via the
  super-admin panel — not hard-coded.
- Automatic renewal reminders; a defined policy for failed/expired payments (grace period,
  then restricted access — exact policy configurable).
- Xtreme Cr8tivity's own invoices/receipts for tenant subscription charges (the platform
  operator's own sales record).
- Super-admin visibility into every tenant's subscription status, plan, and payment history.

## 3.4 Authentication, RBAC & OTP

- Role-based access, configurable per tenant (a tenant decides who on their team sees what,
  within the role framework provided) — see `06-roles-controls.md` for the role list.
- OTP verification as part of login, per the business owner's confirmed decision.
- Full audit trail of user actions, per tenant.
- A tenant admin creates, edits, and deactivates their own company's users — the same
  admin-provisions-everyone-else pattern `xtreme-finance-system` uses, just scoped per tenant
  instead of platform-wide (there is no single global admin login here; every tenant has its
  own).

## 3.5 Super-Admin Platform Dashboard

A separate, platform-operator-only control panel (Xtreme Cr8tivity staff access only):

- List of all tenant companies, with verification status (CAC/TIN), subscription plan, and
  subscription status (active, expired, pending payment).
- View (not necessarily edit) a tenant's account/usage for support purposes.
- Platform-wide metrics: total tenants, active subscriptions, revenue, growth over time,
  most-used modules.
- Suspend or reinstate a tenant account.
- Manage subscription plans/pricing tiers shown on the public site.
- Visibility into demo bookings submitted from the public site.
- Manage the documentation/usage-guide library and demo video shown on the public site.

## 3.6 Multi-Tenancy & Data Isolation

Not a feature so much as a structural requirement threaded through every module above:

- Complete data isolation between tenant companies, enforced at the database/application
  layer — never just hidden in the UI.
- No tenant can ever see or query another tenant's data, under any circumstance. Tested
  directly before every release (see `06-roles-controls.md`).
- Every tenant-scoped table/query needs a tenant identifier as a first-class part of the data
  model (see `04-data-model.md`) and every query path needs to filter on it — this is the one
  place where a shortcut anywhere in the codebase is a real incident, not a bug.
