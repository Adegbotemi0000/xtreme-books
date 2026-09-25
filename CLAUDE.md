# Xtreme Books

## What this is

A cloud-based, multi-tenant accounting, bookkeeping, payroll, and e-invoicing SaaS platform
for Nigerian businesses, built and operated by Xtreme Cr8tivity Xpressions Limited. Any
company can sign up, verify its identity, subscribe to a plan, and immediately start
managing its sales, purchases, expenses, payroll, inventory, and full double-entry
bookkeeping — with Nigerian tax compliance (VAT, PAYE, Withholding Tax, Company Income Tax)
and direct NRS REV 360 e-invoicing built in.

This is a **separate, standalone project** from `xtreme-finance-system` (the single-tenant
internal tool built earlier for Xtreme Cr8tivity itself). Nothing in this repo touches that
one. The functional depth of that build — its accounting modules, GL posting engine,
approval/audit patterns, import/export conventions, and the hard lessons learned integrating
NRS e-invoicing — is the design reference and starting point for this product's scope, not
shared code. Xtreme Books is a fresh, multi-tenant codebase built from scratch.

Full context lives in `docs/` and `brief/`. Read in this order before starting work:

1. `brief/Xtreme-Books-Developer-Brief.docx` — the original scope document (the source of
   truth for what was originally commissioned; PDF copy alongside it is password-protected)
2. `docs/01-overview.md` — vision, business model, target market, guiding principles
3. `docs/02-modules.md` — tenant-side accounting/operations modules
4. `docs/03-platform-modules.md` — platform-side modules (billing, onboarding, super-admin,
   marketing site) that `xtreme-finance-system` never needed
5. `docs/04-data-model.md` — core entities, including multi-tenancy shape
6. `docs/05-tech-stack.md` — stack decisions and open technical questions
7. `docs/06-roles-controls.md` — RBAC, OTP, audit trail, tenant data isolation
8. `docs/07-pricing-plans.md` — subscription tiers and billing rules
9. `docs/08-branding-design.md` — interim branding, homepage/design expectations
10. `docs/09-compliance-and-integrations.md` — tax rules, NRS e-invoicing, KYC/wallet,
    CAC/TIN verification
11. `docs/10-roadmap.md` — phased build plan
12. `docs/11-open-questions.md` — decisions still needed from the business owner

## Current phase: foundation only — no code yet

We are in documentation and planning. **Do not scaffold or write application code until
explicitly told to start building.** The business owner wants to bring in UI/UX skills/design
direction before implementation begins, particularly for the public marketing site and the
"modern homepage" requirement. Foundational docs should stay easy to revise until that
direction is set.

## Ground rules for when building starts

These carry over from `xtreme-finance-system`'s proven conventions — they worked there and
the same reasoning applies here, at higher stakes since this is now multi-tenant:

- Every transaction enters the system once and flows automatically into every relevant
  record (sale → invoice → payment → revenue → receivable if unpaid → stock movement →
  GL posting → reports). Never build a second place to enter the same fact.
- Every invoice captures buyer TIN, seller TIN, invoice date, unique invoice number, line
  items, and VAT — always, regardless of whether e-invoicing is used on that invoice — so
  every invoice is e-invoicing-ready retroactively.
- Every important financial action (create/edit/cancel/delete) is traceable: who, when, what
  changed. Never hard-delete a financial record — cancel, reverse, or archive.
- Tax types (VAT, PAYE, WHT, CIT) and PAYE/pension bands are configurable data, not
  hard-coded — Nigerian tax law changes periodically (it just did, with NTA 2025) and this
  product must survive that without a code change.
- Expense/discount/PAYE-band categories are configurable data per tenant, not hard-coded
  enums.
- Keep the stack boring and maintainable — this needs to survive being handed off to or
  maintained by a small team, not showcase new tech.
- **True multi-tenancy is the one rule with zero tolerance for shortcuts**: complete data
  isolation between tenant companies, enforced at the database/application layer, never just
  hidden in the UI. A tenant must never be able to see or query another tenant's data under
  any circumstance. This gets tested directly before every release, not assumed.

## Decisions confirmed with the business owner

- **Plans:** three tiers by included user count — Starter (2 users), Growth (5), Scale (10).
  Additional users beyond a plan's included count cost ₦80,000/user/year on any tier.
- **Auth:** role-based access per tenant, with OTP verification on login, plus a full audit
  trail of user actions — per-tenant admins manage their own team's users/roles, matching
  `xtreme-finance-system`'s admin-provisions-everyone-else pattern, just scoped per tenant
  instead of platform-wide.
- **Tax:** the platform generates VAT, WHT, and PAYE reports usable directly for payment and
  filing, and separately tracks Company Income Tax (CIT) obligations. All tax types remain
  admin-configurable per tenant per the existing brief's model (VAT/PAYE on by default, WHT
  available but off by default) — CIT tracking is an addition to that Tax Centre.
  See `docs/11-open-questions.md` for what's still unresolved about e-invoicing being
  described as fully automatic here vs. opt-in-per-invoice in the original brief.
- **E-invoicing:** every invoice carries an IRN (Invoice Reference Number); e-invoicing is
  positioned as "built in and automatic" in product messaging — reconcile this against the
  brief's opt-in-per-invoice toggle design before building (see open questions).
- **Payroll:** PAYE, pension, payslips, and other statutory calculations are built into
  every plan (not a paid add-on).
- **Inventory:** tracks stock on hand, stock movement, and usage; tracks raw materials
  consumed in production to help reduce wastage; tracks stock across multiple branches.
- **POS/payments:** supports cash, bank transfer, POS card, and split payments; supports
  printing POS receipts and processing refunds and voids.
- **Customers/vendors:** TIN is optional to create a customer or vendor record, but
  recommended and can be added at any time — required in practice only where WHT or formal
  e-invoicing applies to that transaction.
- **Wallet & virtual accounts:** every plan includes a wallet and virtual account feature for
  managing direct and statutory payments. Requires KYC verification; partner bank details are
  surfaced during setup. This is a new module beyond the original brief's scope — see
  `docs/09-compliance-and-integrations.md`.
- **Exports:** downloadable reports across all key areas (sales, expenses, tax, inventory at
  minimum), platform-wide, not a subset of modules.
- **Branding (interim):** use the existing Xtreme Cr8tivity Cr8 logo/favicon as a starting
  point (`brand/favicon-32.png`, `brand/favicon-192.png`) while dedicated Xtreme Books
  branding and the homepage design direction are worked out.
- **Business model:** self-service SaaS signup is the primary path; Xtreme Cr8tivity also
  offers paid setup/onboarding assistance as a service on top, for tenants who want
  hands-on help getting their company set up in the platform.
