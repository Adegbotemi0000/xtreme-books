# 02 — Tenant-Side Modules

Every module below is available to every subscribing tenant (plans differ by included user
count, not by feature — see `07-pricing-plans.md` and `docs/11-open-questions.md` for whether
that stays true). Where a module has a direct predecessor in `xtreme-finance-system`, that's
named as the design reference — not shared code. Every module must integrate with the others:
a fact entered once flows automatically through every relevant record.

## 2.1 Sales & Invoicing

- Customers directory (contact details; TIN optional, recommended, addable anytime).
- Quotations, convertible to invoices.
- Invoices with line items, VAT calculation, due dates, a unique invoice number, and an IRN
  (Invoice Reference Number) on every invoice.
- Every invoice captures buyer TIN, seller TIN, invoice date, invoice number, line items, and
  VAT amount regardless of e-invoicing status, so every invoice is e-invoicing-ready
  retroactively.
- Statuses: Draft, Issued, Partially Paid, Paid, Cancelled — with cancellation/reversal, never
  hard deletion.
- Payment recording against invoices, partial payments supported.
- Receivables ageing report (current, 1-30, 31-60, 61-90, 90+ days).
- E-invoicing to NRS REV 360 — see `09-compliance-and-integrations.md` for the
  automatic-vs-opt-in question that needs resolving before this is built.
- *Reference: `xtreme-finance-system`'s sales/invoicing module, extended with IRN and
  multi-tenant scoping.*

## 2.2 Point of Sale (POS)

- Walk-in/counter sale mode, tied into the same inventory and GL posting engine as invoicing.
- Payment methods: cash, bank transfer, POS card, and split payments (a single sale paid
  across more than one method).
- POS receipt printing.
- Refunds and voids on POS transactions, fully reversed through inventory and the GL, never
  hard-deleted.

## 2.3 Purchases & Payables

- Suppliers directory.
- Purchase records with an approval workflow.
- Supplier payments, partial payments supported.
- Payables ageing report.
- Cancellation/reversal flow, never hard deletion.
- *Reference: `xtreme-finance-system`'s purchases module.*

## 2.4 Products, Services & Inventory

- Product/service catalogue (SKU, unit price, cost, VAT rate).
- Real-time stock quantity, driven automatically by sales, purchases, and manual adjustments.
- Manual stock adjustments (damage, loss, stock counts) with a required reason, fully
  traceable.
- Stock valuation and low-stock/reorder alerts.
- Multi-branch stock tracking — the same product's stock is tracked separately per branch,
  with visibility into what's where.
- Production/manufacturing support: a bill-of-materials (recipe) that consumes raw material
  stock and produces finished-good stock, with wastage tracked as part of that consumption so
  a business can see where raw material is being lost, not just what was produced.
- *Reference: `xtreme-finance-system`'s inventory + stores + production modules, combined and
  extended with explicit wastage tracking.*

## 2.5 Expenses

- Expense recording with tenant-configurable categories (never hard-coded).
- Configurable approval thresholds (auto-approve below a threshold, require approval above
  it).
- Receipt/supporting document attachment on every expense.
- *Reference: `xtreme-finance-system`'s expenses module.*

## 2.6 Cash & Bank

- Multiple cash/bank account records per tenant.
- Per-account statement/ledger with running balance.
- Opening balance support when an account is first added.
- *Reference: `xtreme-finance-system`'s cash/bank module.*

## 2.7 Wallet & Virtual Accounts

- Every plan includes a wallet and a virtual account for managing direct and statutory
  payments (e.g. paying a tax obligation or a supplier straight from the platform).
- Requires KYC verification before activation.
- Partner bank details are surfaced to the tenant during setup.
- New module beyond `xtreme-finance-system`'s scope — no direct predecessor. See
  `09-compliance-and-integrations.md` for what's still unresolved about the KYC/banking
  partner integration.

## 2.8 Payroll

- Staff directory (name, position/level, bank details, monthly salary).
- Monthly payroll run per staff member, with automatic PAYE calculation under NTA 2025 rules
  — PAYE bands are tenant-admin-editable data, not hard-coded.
- Pension contribution calculation as a statutory deduction, alongside PAYE.
- Attendance/pro-rating: days missed reduce gross pay proportionally.
- Partial and full salary payment recording.
- Individual payslip generation and download, per staff member, per month or full year.
- Staff advances/loans with repayment tracking, fully reflected in the books.
- Built into every plan — not a paid add-on.
- *Reference: `xtreme-finance-system`'s payroll module (including its staff-loans and
  attendance-based pay features), extended with pension.*

## 2.9 Loans

- Loans given (lent out) and loans taken (borrowed), each tied to a counterparty and a
  cash/bank account.
- Repayment tracking, partial repayments supported.
- Cancellation/reversal flow.
- *Reference: `xtreme-finance-system`'s loans module, including its Trash/soft-delete pattern
  for cancelled loans.*

## 2.10 Fixed Assets

- Asset register (name, category, purchase date, cost, useful life, salvage value).
- Depreciation run per period, with accumulated depreciation and book value tracked
  automatically.
- Asset disposal flow (date, proceeds, gain/loss on disposal).
- *Reference: `xtreme-finance-system`'s fixed assets module.*

## 2.11 Tax Centre

- Configurable tax types: VAT, PAYE, Withholding Tax, and Company Income Tax (CIT) tracking.
  VAT and PAYE on by default; WHT available but off by default; all tenant-admin-adjustable,
  per the same configurable-tax-type model proven in `xtreme-finance-system`.
- Automatic VAT calculation on sales.
- The platform generates VAT, WHT, and PAYE reports usable directly for payment and filing.
- CIT obligations are tracked (amounts due, periods, filing/payment status) even though CIT
  itself isn't calculated the same way as transaction-level taxes.
- Tax period tracking, filing status, and payment status per period, with period-locking to
  block edits to a filed period.
- Tax record history.
- *Reference: `xtreme-finance-system`'s tax module, extended with CIT tracking.*

## 2.12 Full Double-Entry General Ledger

- Every transaction across every module above automatically generates a correct, balanced
  double-entry journal posting (debits = credits, always) — this is the core of the product.
- Configurable Chart of Accounts per tenant; system-critical accounts the posting engine
  depends on are protected from deletion (matches `xtreme-finance-system`'s
  `SYSTEM_ACCOUNT_CODES` protection pattern).
- Manual journal entry capability for accountant adjustments.
- General Ledger detail view per account, with running balance.
- Trial Balance report, as of any date.
- *Reference: `xtreme-finance-system`'s `postEntry()` / `postingRules.js` GL engine — the
  single most important piece of design continuity between the two products.*

## 2.13 Financial Reporting

- Income Statement (Profit & Loss), any period.
- Balance Sheet, as of any date.
- Cash flow summary.
- Dashboard: revenue, expenses, profit, cash position, receivables/payables outstanding, low
  stock, upcoming tax obligations.
- Audit-Ready Report Pack: a downloadable bundle (PDF and Excel, with separate sheets per
  report in the Excel version) covering Trial Balance, Income Statement, Balance Sheet, GL
  detail, Aged Receivables & Payables, Fixed Asset Register, Tax Summary, Sales & Purchases
  Registers, Loan Register, and Payroll Register — selectable by quarter, half-year, full
  year, or custom range. The document a tenant hands to their own external accountant.
- *Reference: `xtreme-finance-system`'s Audit-Ready Report Pack, built directly from this
  session's work extending it with Loan and Payroll Registers.*

## 2.14 Documents & Traceability

- Supporting document/file attachment on relevant records (invoices, expenses, assets, etc.).
- Full audit trail: every create/edit/cancel/delete of a financial record logs who did it and
  when.
- No hard deletion of financial records anywhere — cancel, reverse, or archive only.
- A recovery area (Trash) for accidentally-archived non-financial records (customer, product,
  etc.), recoverable by a tenant admin.
- *Reference: `xtreme-finance-system`'s Trash module and audit-log middleware — including
  this session's fix locking deletion down to admin/system_admin only, which should be the
  starting permission model here too, not something discovered as a gap after launch.*

## 2.15 Projects & Discounts

- Optional project/cost-centre tagging on transactions, for tenants tracking profitability by
  project.
- Configurable discount rules, applicable at point of sale/invoicing.
- *Reference: `xtreme-finance-system`'s projects and discounts modules.*

## 2.16 Data Import & Export

- Every list-based section (customers, suppliers, products, invoices, purchases, expenses,
  staff, assets, etc.) supports bulk import from a provided Excel/CSV template, and export to
  Excel/CSV/PDF — platform-wide, not a subset of modules.
- Downloadable reports across all key areas: sales, expenses, tax, and inventory at minimum.
- *Reference: `xtreme-finance-system`'s generic import/export pattern (`importExport.js`,
  downloadable templates with short headers + Excel cell-comment guidance) — including the
  lesson learned this session that lengthening a template's header text breaks re-uploads of
  previously-downloaded templates.*
