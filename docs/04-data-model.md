# 04 — Core Data Model

This is a shape proposal to guide implementation, not a finished schema — finalize it
alongside `05-tech-stack.md`'s multi-tenancy decision before writing migrations.

## Multi-tenancy shape

Every accounting-domain table needs a tenant identifier. Two viable approaches, to decide in
`05-tech-stack.md`:

- **Shared schema, `tenant_id` column on every table** (row-level isolation) — simpler
  operationally (one database, one set of migrations), proven approach for SaaS at this
  scale, but every single query must filter by `tenant_id` with zero exceptions — a missed
  filter is a cross-tenant data leak.
- **Schema-per-tenant or database-per-tenant** — stronger isolation guarantee by
  construction, but much heavier operationally (migrations run N times, backups/connections
  scale with tenant count) — usually overkill below a few hundred tenants.

Leaning toward shared schema + `tenant_id`, with tenant isolation enforced by a consistent
data-access layer (never raw ad-hoc queries per module) so the "every query filters by
tenant_id" rule is structural, not a matter of developer discipline per call site. Confirm
this before building — see `11-open-questions.md`.

## Platform-level entities (not scoped to a tenant)

- **Tenant / Company** — id, name, CAC number, CAC certificate file, TIN, director(s),
  primary contact, address, logo, verification status (CAC/TIN), subscription id, created_at.
- **User** — id, tenant_id (nullable for platform staff), name, email, phone, password hash,
  role, OTP settings, is_active, created_at. Platform (super-admin) users and tenant users can
  share one table with a `tenant_id` of null for platform staff, or be split entirely —
  decide alongside the auth implementation.
- **Subscription** — tenant_id, plan_id, status (active/expired/pending/suspended), start
  date, renewal date, included user count, paid user add-ons, Paystack reference.
- **Plan** — id, name (Foundation/Momentum/Enterprise), included_user_count, price_per_year,
  extra_user_price_per_year (₦80,000 default), is_active — configurable via super-admin, not
  hard-coded (see `07-pricing-plans.md`).
- **DemoBooking** — name, company, email, phone, preferred_time, status, created_at.
- **DocLibraryEntry** — title, topic/module tag, file, published_at — backs the public
  documentation/resource centre.
- **AuditLog (platform-level)** — for super-admin actions (suspend tenant, edit plan, etc.),
  separate from each tenant's own per-tenant audit trail.

## Tenant-scoped entities

Every entity below carries `tenant_id`. Field shapes are drawn directly from
`xtreme-finance-system`'s proven data model, adjusted for multi-tenancy and this product's
additions (IRN, pension, CIT, multi-branch, wallet).

- **Customer** — tenant_id, name, short_code, tin (optional), email, phone, address, notes,
  is_active, deleted_at/deleted_by.
- **Supplier** — same shape as Customer.
- **Product** — tenant_id, name, sku, unit_price, cost, vat_rate, reorder_level, is_active,
  deleted_at/deleted_by.
- **Branch/Store** — tenant_id, name, address, is_active — stock is tracked per
  product-per-branch, not just per product.
- **StockMovement** — tenant_id, product_id, branch_id, direction, quantity, reason,
  reference_type, reference_id, created_by, created_at.
- **BillOfMaterials** — tenant_id, finished_product_id, component lines (raw_product_id,
  quantity_required), wastage tracked as a variance between expected and actual raw-material
  consumption on each production run.
- **Invoice** — tenant_id, customer_id, invoice_number, irn, date, due_date, po_reference,
  subtotal, vat_amount, total, status, e_invoice_status, e_invoice_error, deleted_at/by.
- **InvoiceItem** — invoice_id, product_id, description, quantity, unit_price, line_total.
- **Quotation** — same shape as `xtreme-finance-system`'s, convertible to Invoice.
- **Payment** — tenant_id, direction (in/out), invoice_id/purchase_id, amount, date, method
  (cash/bank/POS card/split — see 2.2), account_id, reference, is_reversed.
- **POSTransaction** — tenant_id, branch_id, items, payment breakdown (supports split across
  methods), refund/void status, receipt reference.
- **Purchase** — tenant_id, supplier_id, purchase_number, po_reference, date, status, total,
  deleted_at/by.
- **PurchaseItem** — purchase_id, product_id, description, quantity, unit_price, line_total.
- **Expense** — tenant_id, category_id, supplier_id, description, amount, payment_method,
  account_id, approval_status, is_voided, deleted_at/by.
- **Category** — tenant_id, type (expense/tax/discount/etc.), name, is_active — configurable
  data per tenant, never hard-coded.
- **Account** (cash/bank) — tenant_id, name, opening_balance, is_active, deleted_at/by.
- **Wallet** — tenant_id, balance, virtual_account_number, partner_bank, kyc_status.
- **KYCRecord** — tenant_id, verification data/documents, status, verified_at.
- **Staff** — tenant_id, name, position, bank details, monthly_salary, is_active,
  deleted_at/by.
- **PayrollEntry** — tenant_id, staff_id, period, gross_pay, paye_amount, pension_amount,
  days_missed, attendance-prorated gross, net_pay, payment_status.
- **PAYEBand** — tenant_id, min_income, max_income, rate — admin-editable, per current NTA
  2025 structure.
- **PensionRule** — tenant_id, rate/basis — admin-editable statutory pension configuration.
- **StaffLoan** / **StaffLoanRepayment** — matches `xtreme-finance-system`'s staff advances
  pattern.
- **Loan** / **LoanRepayment** — tenant_id, direction (given/taken), counterparty_name,
  principal_amount, date, due_date, account_id, notes, status, deleted_at/by.
- **FixedAsset** — tenant_id, name, category, purchase_date, cost, useful_life, salvage_value,
  accumulated_depreciation, disposal fields.
- **TaxType** — tenant_id, type (VAT/PAYE/WHT/CIT), is_enabled, rate/config — admin-toggleable
  per tenant, VAT/PAYE on by default.
- **TaxPeriod** — tenant_id, tax_type_id, period, filing_status, payment_status, is_locked.
- **GLAccount** — tenant_id, code, name, type, parent_id, is_system_account (protected from
  deletion, matching `SYSTEM_ACCOUNT_CODES` in `xtreme-finance-system`).
- **JournalEntry** / **JournalLine** — tenant_id, source module/reference, debit/credit lines
  that must always balance — the `postEntry()` engine's data shape, unchanged in spirit.
- **Document** — tenant_id, entity_type, entity_id, original_filename, stored_filename,
  mime_type, size_bytes, uploaded_by.
- **AuditLog (tenant-level)** — tenant_id, entity_type, entity_id, user_id, action, old_value,
  new_value, reason, created_at.
- **Project** — tenant_id, name, code, customer_id, status, budget, dates, description.
- **Discount** — tenant_id, name, type, value, is_active.

## What's deliberately not copied

`xtreme-finance-system` had exactly one admin login provisioned up front, with that admin
creating everyone else. Kora has no such single admin — every tenant gets its own
admin at signup, and there's a separate super-admin role for Xtreme Cr8tivity's own platform
staff, unrelated to any tenant's user table. Don't port the "one admin, provisioned outside
the app" assumption anywhere into this model.
