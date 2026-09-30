# 10 — Roadmap

This restructures the original brief's 4-6 week external-contractor MVP milestones into
build phases. Since this is being built with continuity from `xtreme-finance-system`'s already
-proven accounting domain rather than from zero, the core accounting modules should move
faster than a from-scratch build would — the phases below sequence by dependency, not by a
fixed calendar.

## Status snapshot (2026-09-29)

Public marketing site is live (`https://kora-website-zeta.vercel.app`). The tenant app is
scaffolded and deployed for team preview (`https://kora-app-tau.vercel.app`, API at
`https://kora-api-six.vercel.app`) with a real Postgres (Neon) behind it — not just a design
mockup. A full audit against `xtreme-finance-system`'s current module list and commit history
(the source of the feature-parity bar in this file's own ground rules) turned up the gaps
called out inline below with ⚠️/❌. Everything marked ✅ has been exercised end-to-end against
the deployed environment, not just code-reviewed.

- ✅ Multi-tenant auth, company setup (brought to feature parity with the competitor
  reference's Organization Profile screen), dashboard with real charts, brand-color theming.
- ✅ 15+ operational modules scaffolded with real backend + GL posting where applicable
  (see Phase 1 below for which are basic-CRUD vs full business logic).
- ✅ Excel/CSV Template/Import/Export now covers every transactional module, not just simple
  lists: Customers, Products, Suppliers, Staff, Projects, Discounts, Branches, **and now
  Expenses, Purchases, Fixed Assets, Invoices** — the FK/line-item lookups these needed
  (supplier/category/account/customer name -> id, one-row-one-line-item for Invoices, matching
  `xtreme-finance-system`'s own simplification for bulk invoice import) are done. Fixed a real
  latent bug in the process: the generic export handler read snake_case DB columns against
  camelCase field keys, so Products' unitPrice/vatRate/reorderLevel and Staff's
  bankName/bankAccountNumber/monthlySalary were silently exporting blank — fixed once, in the
  shared handler, for every module.
- ✅ Receipt/document upload — Invoices, Purchases, Expenses, Fixed Assets (a per-row paperclip
  toggle on the last three, since none of them has a detail page like Invoices does). Ported as
  a generic tenant-scoped module (file bytes in Postgres, not disk — this runs as a Vercel
  serverless function, whose filesystem doesn't persist between invocations, unlike
  `xtreme-finance-system`'s server).
- ❌ **"Ask GT" is not actually built yet**, despite being called out as required (not
  aspirational) in this repo's own ground rules above. What exists today
  (`backend/src/modules/assistant/`, `frontend/src/components/ChatWidget.jsx`) is a ~50-line
  rule-based FAQ bot — no LLM backing, no local intent-matching against the tenant's own live
  figures, not an avatar-style launcher. This is the single highest-priority gap found in the
  audit — deliberately sequenced *after* finishing rollout of the features above across every
  module, not before.
- ❌ Receipt/document upload still missing on Recurring Expenses — doesn't exist as a module
  yet. Inventory is now done (reuses "product" as the entity type).
- ✅ Pagination across every list page whose data genuinely grows unbounded — client-side
  (slices an already-fetched array, not server-side LIMIT/OFFSET) via a shared `Pagination`
  component, wired into `SimpleListPage` (9 pages) plus every custom list page (Invoices,
  Purchases, Expenses, Fixed Assets, Inventory, Quotations, Receivables, Journals, Loans, Logs,
  Trash, Payroll, POS sale history). Deliberately skipped Users (capped by plan tier), Tax
  types/PAYE bands (small fixed config), and General Ledger/Trial Balance (conventionally show
  a full period, not a paginated feed). Server-side paging is still the real fix once a
  tenant's data outgrows what's reasonable to fetch in one request.
- ❌ Dark mode — added to `xtreme-finance-system` post-launch; not started here.
- ❌ Bank Reconciliation, Budget module, Vendor/Supplier Credits, Timesheet, and a real
  Reports Center (catalog + sharing + selectable charts) all exist in `xtreme-finance-system`
  but are still `ComingSoonPages.jsx` stubs here with no backend at all.
- ✅ Checked directly (not assumed): the "hard-delete orphans GL journal entries" bug
  `xtreme-finance-system` fixed can't occur here — Kora's Trash module
  (`backend/src/modules/trash/routes.js`) has no permanent-delete/purge endpoint at all, only
  list + restore, consistent with the never-hard-delete ground rule. Wallet and Trash are both
  gated uniformly to `requireRole("tenant_admin")` — no role-string mismatch found either.
  Vendor-credit race conditions don't apply yet since Vendor Credits isn't built (see below).

## Phase 0 — Foundation

- ✅ Multi-tenant data model finalized (see `04-data-model.md`, `05-tech-stack.md`).
- ✅ Auth: signup, email verification, login, OTP, tenant-scoped session/token.
- ❌ Billing skeleton: Plan/Subscription tables, Paystack sandbox wired for yearly billing.
- ✅ Public marketing site skeleton (pages exist, real content/design follows once UI/UX
  direction is set — see `08-branding-design.md`).
- ✅ Company onboarding flow: profile, CAC/TIN document capture (verification integration can
  land in a later phase — see Phase 3).
- ❌ Super-admin skeleton: tenant list, ability to view/suspend.

## Phase 1 — Core Accounting MVP

Tenant-scoped versions of the accounting modules already proven in `xtreme-finance-system`:

- ✅ Customers, Suppliers, Products (with multi-branch stock from the start — retrofitting
  branch-awareness later is much more painful than building it in).
- ✅ Sales & Invoicing (IRN field present from the start; actual NRS transmission can follow once
  the automatic-vs-opt-in question is resolved — see `11-open-questions.md`).
- ✅ Purchases & Payables, Expenses, Cash & Bank.
- ✅ Full double-entry GL engine underneath all of the above, Chart of Accounts, Trial Balance.
- ✅ Basic financial reporting: dashboard. ❌ Income Statement, Balance Sheet not built —
  Reports is still a stub (see Status snapshot).
- ❌ "Ask GT" AI help assistant — see Status snapshot; called out separately because it's a
  cross-cutting ground rule, not scoped to one accounting module.

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

- ✅ Payroll: staff directory, PAYE + pension calculation, attendance/pro-rating, payslips,
  staff advances.
- ✅ Fixed Assets: register, depreciation, disposal.
- ✅ Loans given/taken with repayment tracking.
- ❌ Bank Reconciliation (CSV/XLSX/PDF statement upload + matching) — real in
  `xtreme-finance-system`, not originally scoped in this roadmap; still a stub here. Slotted
  here because it belongs next to Cash & Bank, not because it's blocked on the rest of Phase 4.
- ❌ Budget module (with PDF/Excel export) — same story: real upstream, added after this
  roadmap was first written, not started here.

## Phase 5 — Inventory Depth, Production & POS

- ⚠️ Production/BOM with wastage tracking — page exists, still a `ComingSoonPages.jsx` stub.
- ⚠️ Full multi-branch stock reporting — Branches module exists; reporting depth not built.
- ✅ Point of Sale: cash/bank transfer/card/split payments, receipt printing, refunds/voids.
- ❌ Vendor/Supplier Credits, Timesheet — real in `xtreme-finance-system`, added after this
  roadmap was first written; both still stubs here. Slotted here as the closest fit, not
  because either is blocked on POS.

## Phase 6 — Wallet, Virtual Accounts & KYC

- Banking/BaaS partner integration selected and wired (see `09-compliance-and-integrations.md`
  for the open vendor question).
- KYC flow, wallet activation, virtual account issuance.

## Phase 7 — Reporting Depth, Public Site Polish & Launch Readiness

- ❌ Reports Center (catalog of reports + sharing + selectable charts, replacing the current
  Reports stub) — real in `xtreme-finance-system`, added after this roadmap was first written.
- ❌ Audit-Ready Report Pack (full bundle, all registers).
- ✅ Full import/export coverage across every transactional module (Customers, Products,
  Suppliers, Staff, Projects, Discounts, Branches, Expenses, Purchases, Fixed Assets, Invoices).
  Remaining candidates (Recurring Expenses, Inventory) don't exist as real modules yet — see
  their own phases.
- ✅ Receipt/document upload on every transaction form that exists — Invoices, Purchases,
  Expenses, Fixed Assets, Inventory done; Recurring Expenses is the only gap left, blocked on
  that module existing at all, not on the upload feature itself.
- ✅ Pagination on every list page whose data grows unbounded — see Status snapshot for the
  full list and the (deliberate) exceptions.
- ❌ Demo video hosting and documentation/resource centre live on the public site.
- ❌ Legal pages finalized, CMS-editable.
- ❌ Security review, QA pass, staging sign-off, production deployment, launch. The
  hard-delete/Wallet-role checks from `xtreme-finance-system`'s hardening passes were already
  verified not to apply here (see Status snapshot) — this pass should re-check bulk-delete
  gaps and revisit vendor-credit race conditions once that module is actually built.

## Ongoing / not phase-gated

- Paid setup-assistance service — this is a services offering the business can start selling
  as soon as the core product is usable, it doesn't need every later phase complete first.
- Documentation/usage guides, authored as modules stabilize (mirrors how
  `xtreme-finance-system`'s user guide and training video were produced once the app was
  feature-complete, not before).
- Dark mode toggle — added to `xtreme-finance-system` post-launch as a whole-app pass; not
  started here, and not blocking any phase above.
