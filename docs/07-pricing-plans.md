# 07 — Pricing & Plans

## Confirmed tiers

Yearly billing only for MVP, via Paystack. Plans differ by included user count:

| Plan | Included users | Extra user cost |
|---|---|---|
| Foundation | 2 | ₦80,000/user/year |
| Momentum | 5 | ₦80,000/user/year |
| Enterprise | 10 | ₦80,000/user/year |

- Additional users beyond a plan's included count can be added on **any** tier at the same
  ₦80,000/user/year rate.
- Every plan includes the full module set in `02-modules.md` — payroll (with PAYE, pension,
  payslips), the wallet/virtual account feature, and e-invoicing are **not** paid add-ons; they
  ship on every tier. See `11-open-questions.md` for whether any feature-level gating should
  exist at all, beyond user count.
- Base per-tier pricing (the yearly subscription price itself, before user add-ons) is not yet
  set — flagged in `11-open-questions.md`.

## Billing mechanics

- Subscription selection and Paystack payment happen during onboarding (see
  `03-platform-modules.md` §3.2) — full platform access requires an active paid subscription.
- A free trial period, if offered, is a configurable option (length, feature scope), not a
  permanent free tier.
- Automatic renewal reminders before the yearly renewal date.
- Failed/expired payment handling: a grace period, then restricted access — exact grace-period
  length and what "restricted" means (read-only vs fully locked) is configurable by
  Xtreme Cr8tivity via the super-admin panel, not hard-coded.
- Adding users mid-cycle (crossing from Foundation's 2 into paid add-ons, for example) should
  pro-rate against the current subscription year rather than requiring a full new annual
  payment — confirm this billing behavior before implementation (see
  `11-open-questions.md`).
- Xtreme Cr8tivity issues its own invoice/receipt for every tenant subscription charge — this
  is the platform operator's own sales record, separate from anything a tenant does inside
  their own books.

## Where this is managed

- The public pricing page presents whatever tiers are configured — tier structure and price
  points live in the `Plan` table (see `04-data-model.md`), editable via the super-admin
  dashboard (see `03-platform-modules.md` §3.5), never hard-coded into the marketing site.
- Super-admin has full visibility into every tenant's plan, subscription status, and payment
  history.
