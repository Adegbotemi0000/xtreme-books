# 06 — Roles, Auth, Controls & Audit

## Tenant-side roles

Per the original brief, configurable per tenant within this framework (a tenant decides who
on their team can see what, not the platform deciding for them):

| Role | Access |
|---|---|
| Company Owner / Admin | Full access to their company's data; completed onboarding; manages their own company's users and settings |
| Accountant | Full access to financial records, reports, tax, reconciliation; typically restricted from payroll/HR-sensitive data unless explicitly granted |
| Management / Viewer | Read-only — dashboards, reports, summaries; no create/edit on transactions |
| Operational Staff (sales, cashier, inventory clerk, etc.) | Scoped to only the modules relevant to their function (e.g. a cashier can record POS sales but can't see payroll) |

Each tenant company creates, edits, and deactivates its own users. There is no single global
admin login the way `xtreme-finance-system` has — every tenant is its own root of user
management.

## Platform-side roles

| Role | Access |
|---|---|
| Super-Admin (Xtreme Cr8tivity staff) | Oversees the entire platform: all tenant companies, verification statuses, subscription/billing status, platform-wide usage, support |

## Authentication

- Standard email/password login, plus **OTP verification** as a confirmed requirement — every
  user's login includes an OTP step. Decide OTP delivery channel (email vs SMS) and whether
  it's every login or a trusted-device pattern, as part of implementation planning, not left
  ambiguous.
- Server-side role checks on every request — enforced in the API layer, never just hidden in
  the UI. This is the same rule `xtreme-finance-system`'s `docs/06-roles-controls.md` states,
  and this session's audit found (and fixed) a real violation of it — document deletion had
  *no* server-side role check at all. Build the equivalent check as a default requirement from
  day one here, not something an audit discovers after launch.

## Approval workflow

Same pattern as `xtreme-finance-system`, per tenant:

- Expenses above a defined (tenant-configurable) limit
- Purchase orders
- Supplier payments
- Refunds and voids (POS)
- Stock adjustments
- Invoice cancellations
- Manual financial adjustments

Start with a simple single-approver model per tenant; more granularity can follow if a tenant
needs it.

## Audit trail

Every important financial action is traceable, per tenant:

- User, date/time, action, previous value (where relevant), new value (where relevant),
  reason for adjustment (where applicable).
- Financial records never simply disappear on delete — cancel, reverse, or archive, and log
  the action.
- A separate platform-level audit log covers super-admin actions (suspend a tenant, edit a
  plan, etc.) — don't mix this with a tenant's own audit trail.

## Delete permissions

This session's work on `xtreme-finance-system` established a concrete pattern worth carrying
over exactly: **deleting (moving to Trash) a financial or core record is a tighter permission
than creating/editing one.** A role that can enter or approve a record (sales staff, an
accountant, a management approver) should not automatically be able to delete it — that should
default to the tenant's Owner/Admin role only, checked server-side, with the UI hiding the
control for anyone else so it doesn't 403 on click. Apply this as the default design, not a
gap to close later.

## Tenant data isolation — the one control with zero tolerance

- No tenant can ever see or query another tenant's data, under any circumstance.
- This is tested **directly** before every release — attempt cross-tenant access as part of
  QA, don't assume the data-access layer is correct because it looks correct.
- A milestone or release is not accepted until this has been verified, per the acceptance
  criteria in the original brief.

## Other controls (per tenant, carried from the accounting domain)

- Duplicate invoice/payment detection
- Negative stock warnings
- Unapproved expense warnings
- Overdue invoice alerts
- Missing receipt warnings
- Tax period locking (block edits to a period once filed)
- Role-based access throughout, enforced server-side
