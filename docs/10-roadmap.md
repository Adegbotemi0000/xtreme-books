# 10 — Roadmap

This restructures the original brief's 4-6 week external-contractor MVP milestones into
build phases. Since this is being built with continuity from `xtreme-finance-system`'s already
-proven accounting domain rather than from zero, the core accounting modules should move
faster than a from-scratch build would — the phases below sequence by dependency, not by a
fixed calendar.

## Status snapshot (2026-10-07)

Dark mode and every "smaller feature gap" from the previous snapshot are now closed: Cash Flow
Statement, Audit-Ready Pack (downloadable Excel bundle), Production/BOM with wastage tracking,
multi-branch stock reporting, and server-side pagination on the two highest-value targets
(simpleListRouter, Journals — the rest stay client-side for now, a deliberate scope decision,
not an oversight). Every item below was verified end-to-end against the deployed API and UI,
not just code-reviewed. Next milestone: migrating off Vercel preview onto cPanel + the
business's own Postgres, once the team has reviewed how everything looks and behaves.

## Status snapshot (2026-09-29) — superseded, kept for history

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
- ✅ Dark mode — a real second theme (sidebar was always near-black; the content area now has
  its own dark surface/border/text steps), applied before first paint, toggle persisted via
  localStorage. Verified both auto-detection from system preference and the manual toggle.
- ✅ Bank Reconciliation, Budget module, Vendor/Supplier Credits, Timesheet, Reports Center
  (Income Statement, Balance Sheet, **and now Cash Flow**), Audit-Ready Pack (Excel bundle of
  all core statements + GL detail), Production/BOM (with wastage tracking), and multi-branch
  stock reporting are now all real, built and verified end-to-end against the deployed API and
  UI. The only remaining `ComingSoonPages.jsx` stub is File Manager — never in the agreed build
  order for this pass — see
  Phase 5/7 below for what's still open and why each was deliberately left out.
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
- ✅ Bank Reconciliation — CSV/XLSX statement upload + matching (PDF/OCR deliberately deferred,
  same phasing `xtreme-finance-system` itself used — it needs a Node 20.16+ runtime dependency).
  Not originally scoped in this roadmap; slotted here because it belongs next to Cash & Bank.
- ✅ Budget module — per-category monthly budgets vs actual. PDF/Excel export left for a
  follow-up; the core budget-vs-actual comparison was the higher-value piece to ship first.

## Phase 5 — Inventory Depth, Production & POS

- ✅ Production/BOM with wastage tracking — reusable recipes (bom_templates) scale by quantity
  produced; each voucher stores quantity_expected alongside quantity_used per material, so
  wastage (actual - recipe-expected) is visible per run, not just a generic BOM.
- ✅ Multi-branch stock reporting — products.stock_quantity stays the tenant-wide total every
  write path (POS, Production, manual adjust) already targets; adjust-stock now optionally
  tags an adjustment to a branch, building a real per-branch breakdown (product_branch_stock)
  that Inventory's new "By branch" view reports against, with "Unallocated" stock always
  reconciling back to the same total — not a full branch-mandatory rewrite of every write path,
  which would have been a much bigger, riskier change than the actual reporting gap.
- ✅ Point of Sale: cash/bank transfer/card/split payments, receipt printing, refunds/voids.
- ✅ Vendor/Supplier Credits — issue, apply to purchases, void. Adapted to Kora's simpler GL
  model (categories aren't mapped to distinct GL accounts here, unlike upstream).
- ✅ Timesheet — staff hours logged against an optional project. Standalone data capture;
  Payroll's "days missed" stays a manual input, matching the reference's own scope.

## Phase 6 — Wallet, Virtual Accounts & KYC

- Banking/BaaS partner integration selected and wired (see `09-compliance-and-integrations.md`
  for the open vendor question).
- KYC flow, wallet activation, virtual account issuance.

## Phase 7 — Reporting Depth, Public Site Polish & Launch Readiness

- ✅ Reports Center — Income Statement, Balance Sheet, and Cash Flow Statement, all computed
  directly from the GL. Cash Flow uses the direct method (each journal source_type that posts
  against Cash & Bank bucketed into Operating/Investing/Financing), verified against the
  Balance Sheet's own Cash & Bank balance exactly. The full catalog/sharing/selectable-charts
  treatment from the reference implementation is left for a follow-up.
- ✅ Audit-Ready Report Pack — one downloadable Excel workbook bundling Trial Balance, Income
  Statement, Balance Sheet, Cash Flow, and full General Ledger detail. Scoped to what's already
  real here; the reference's fuller bundle (Payables Aging, Fixed Asset Register, Tax Summary,
  Sales/Purchases/Loan/Payroll Registers) would each need a new dedicated query — left for a
  follow-up rather than stubbed in.
- ⚠️ Import/export coverage across every transactional module (Customers, Products, Suppliers,
  Staff, Projects, Discounts, Branches, Expenses, Purchases, Fixed Assets, Invoices) — Recurring
  Expenses and Production exist now but never got the Template/Import/Export bar; a real,
  small follow-up, not blocked on anything.
- ✅ Receipt/document upload on every transaction form that has a place to attach one —
  Invoices, Purchases, Expenses, Fixed Assets, Inventory, **and Recurring Expenses** (reuses
  the "product"/"recurring_expense" entity types already in `documents.ALLOWED_ENTITY_TYPES`).
- ⚠️ Pagination — client-side everywhere, **plus real server-side pagination** on
  simpleListRouter (6 modules) and Journals now. Converting every remaining custom list page
  to server-side is a contained, well-understood follow-up, deliberately not done in one pass
  right before the cPanel migration.
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
