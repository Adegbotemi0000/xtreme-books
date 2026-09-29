# 01 — Overview

## What we're building

Kora is a cloud-based, multi-tenant accounting, bookkeeping, payroll, and
e-invoicing platform for businesses operating in Nigeria. Any company can sign up online,
verify its identity, subscribe to a plan, and immediately begin managing its full financial
operations — sales, purchases, expenses, inventory, payroll, cash/bank, and complete
double-entry bookkeeping — with Nigerian tax compliance (VAT, PAYE, Withholding Tax, Company
Income Tax) and direct NRS REV 360 e-invoicing built in from day one.

It is a public product, not an internal tool: the audience is any Nigerian business owner or
accountant who currently manages their books on paper, in Excel, or on a product that doesn't
handle Nigerian tax law and e-invoicing natively.

## Why this exists

Two things are true at once in the Nigerian market right now:

1. Most small-to-mid businesses still run bookkeeping on Excel or paper, or on generic
   accounting software not built around Nigerian tax law.
2. Nigeria Tax Administration Act 2025 (NTA 2025) and the NRS REV 360 e-invoicing mandate
   are changing what "compliant" bookkeeping requires, and most existing local tools weren't
   built with that in mind from the start.

Xtreme Cr8tivity already solved a version of this problem once, building
`xtreme-finance-system` as an internal tool for its own operations. That build proved out the
full accounting domain — real double-entry GL posting, configurable tax types, approval
workflows, audit trails, import/export, and (the hard part) a working NRS e-invoicing
integration with all its sandbox quirks and host-specific gotchas already discovered. Xtreme
Books takes that domain knowledge and rebuilds it as a proper multi-tenant SaaS product other
businesses can sign up for.

## Business model

- **Primary: self-service SaaS.** A company signs up on the public site, verifies its email,
  completes its company profile (with CAC/TIN verification attempted automatically), chooses
  a yearly subscription plan, pays via Paystack, and is using the full product within minutes
  — no manual approval gate before they can start working.
- **Secondary: paid setup assistance.** Xtreme Cr8tivity offers hands-on help setting a
  company up in the platform (data migration from Excel/paper, chart-of-accounts setup, staff
  onboarding/training) as a paid service on top of a subscription, for businesses that want
  it. This is a services upsell, not a requirement to use the product.
- **Platform brand:** Xtreme Cr8tivity is the single platform brand. Tenants are customers on
  a shared platform — this is not a white-label product where each tenant gets their own
  branded instance. A tenant's own logo appears only inside their own dashboard, never on the
  shared platform's public-facing branding.

## Target market

Nigerian businesses of the size that would otherwise be on Excel, paper, or an
under-featured local tool — from small operations with 2 staff up to mid-sized companies
needing 10+ seats and multi-branch inventory. The three plan tiers (see
`07-pricing-plans.md`) are sized around this range.

## Reference products

Not to be copied verbatim, but studied for expected feature depth and UX quality:

- **Zoho Books** — the benchmark for multi-tenant SaaS UX: self-service onboarding,
  subscription billing, broad accounting feature coverage, and a genuinely usable product for
  non-accountants.
- **Countam** — a Nigerian-market accounting product, used as the comparison point for
  feature expectations and workflow familiarity for local accountants and business owners.
  Several of the confirmed feature decisions in `CLAUDE.md` (plan structure, wallet/virtual
  accounts, statutory payroll calculations, POS payment methods) are informed by matching or
  exceeding what a product like this already offers in-market.

Kora must be an original build with its own design, tailored specifically to
Nigerian tax law and NRS e-invoicing — neither reference product natively supports NRS REV
360 the way this platform requires.

## Guiding principles

- **One source of truth per fact.** A transaction entered once flows automatically through
  invoice → payment → receivable → stock movement → GL posting → every report that touches
  it. Never build a second place to enter the same fact — this is the single principle that
  made `xtreme-finance-system` trustworthy, and it matters even more once multiple companies
  depend on it.
- **Compliance is structural, not bolted on.** Tax types, PAYE/pension bands, and e-invoicing
  data capture are built in from the first invoice a tenant creates — not a feature added
  later once a tenant asks for it.
- **Tenant isolation is non-negotiable.** No tenant can ever see or query another tenant's
  data, enforced at the database/application layer, tested directly before every release.
- **Boring, maintainable technology.** This has to survive being handed off to or maintained
  by a small team long-term — favor proven tooling over anything experimental.
- **Never hard-delete a financial record.** Cancel, reverse, or archive — the same rule that
  applied internally applies here, now backed by a real audit trail requirement per tenant.

## Current phase

Documentation and foundation-laying only. See `CLAUDE.md` for the current-phase note and
`10-roadmap.md` for the phased build plan once implementation starts.
