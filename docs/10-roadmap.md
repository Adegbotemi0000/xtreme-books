# 10 — Roadmap

This restructures the original brief's 4-6 week external-contractor MVP milestones into
build phases. Since this is being built with continuity from `xtreme-finance-system`'s already
-proven accounting domain rather than from zero, the core accounting modules should move
faster than a from-scratch build would — the phases below sequence by dependency, not by a
fixed calendar.

## Phase 0 — Foundation

- Multi-tenant data model finalized (see `04-data-model.md`, `05-tech-stack.md`).
- Auth: signup, email verification, login, OTP, tenant-scoped session/token.
- Billing skeleton: Plan/Subscription tables, Paystack sandbox wired for yearly billing.
- Public marketing site skeleton (pages exist, real content/design follows once UI/UX
  direction is set — see `08-branding-design.md`).
- Company onboarding flow: profile, CAC/TIN document capture (verification integration can
  land in a later phase — see Phase 3).
- Super-admin skeleton: tenant list, ability to view/suspend.

## Phase 1 — Core Accounting MVP

Tenant-scoped versions of the accounting modules already proven in `xtreme-finance-system`:

- Customers, Suppliers, Products (with multi-branch stock from the start — retrofitting
  branch-awareness later is much more painful than building it in).
- Sales & Invoicing (IRN field present from the start; actual NRS transmission can follow once
  the automatic-vs-opt-in question is resolved — see `11-open-questions.md`).
- Purchases & Payables, Expenses, Cash & Bank.
- Full double-entry GL engine underneath all of the above, Chart of Accounts, Trial Balance.
- Basic financial reporting: Income Statement, Balance Sheet, dashboard.

## Phase 2 — Tax Centre & E-Invoicing

- Configurable tax types (VAT, PAYE, WHT, CIT tracking), tenant-admin editable.
- VAT/WHT/PAYE report generation for payment and filing.
- NRS REV 360 integration, built to spec (live testing dependent on Xtreme Cr8tivity providing
  sandbox credentials) — applying every lesson in `09-compliance-and-integrations.md`.
- Tax period locking.

## Phase 3 — Verification, Billing Hardening & Super-Admin

- CAC/TIN automated verification integration (vendor selected per `11-open-questions.md`).
- Full Paystack billing: renewals, grace periods, failed-payment handling, pro-rated
  mid-cycle user add-ons.
- Super-admin dashboard completed: metrics, plan management, demo booking visibility, doc
  library management.
- **Tenant data isolation testing** — a dedicated pass attempting cross-tenant access
  directly, not assumed correct from code review (see `06-roles-controls.md`). This gates
  everything after it.

## Phase 4 — Payroll, Fixed Assets, Loans

- Payroll: staff directory, PAYE + pension calculation, attendance/pro-rating, payslips,
  staff advances.
- Fixed Assets: register, depreciation, disposal.
- Loans given/taken with repayment tracking.

## Phase 5 — Inventory Depth, Production & POS

- Production/BOM with wastage tracking.
- Full multi-branch stock reporting.
- Point of Sale: cash/bank transfer/card/split payments, receipt printing, refunds/voids.

## Phase 6 — Wallet, Virtual Accounts & KYC

- Banking/BaaS partner integration selected and wired (see `09-compliance-and-integrations.md`
  for the open vendor question).
- KYC flow, wallet activation, virtual account issuance.

## Phase 7 — Reporting Depth, Public Site Polish & Launch Readiness

- Audit-Ready Report Pack (full bundle, all registers).
- Full import/export coverage across every module.
- Demo video hosting and documentation/resource centre live on the public site.
- Legal pages finalized, CMS-editable.
- Security review, QA pass, staging sign-off, production deployment, launch.

## Ongoing / not phase-gated

- Paid setup-assistance service — this is a services offering the business can start selling
  as soon as the core product is usable, it doesn't need every later phase complete first.
- Documentation/usage guides, authored as modules stabilize (mirrors how
  `xtreme-finance-system`'s user guide and training video were produced once the app was
  feature-complete, not before).
