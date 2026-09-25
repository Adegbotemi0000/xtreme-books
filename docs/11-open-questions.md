# 11 — Open Questions

Decisions still needed from the business owner before (or early in) implementation. Nothing
here should be silently assumed one way or the other while building.

## Product

1. **E-invoicing: opt-in-per-invoice vs. automatic.** The original developer brief specifies a
   per-invoice toggle a tenant controls; the business owner's recent framing describes
   e-invoicing as "built in and automatic." Does this mean:
   - (a) IRN generation and NRS-readiness are automatic on every invoice, but actual
     *transmission* to NRS is still a deliberate action/toggle, or
   - (b) every issued invoice is automatically transmitted to NRS with no per-invoice choice
     at all?
   This materially changes the invoicing UI and the transmission-retry/error-handling design.
2. **Does anything beyond user count differentiate the three plans?** As currently confirmed,
   Foundation/Momentum/Enterprise differ only by included user count (2/5/10), with every module
   available on every plan. Confirm this is intentional — many SaaS competitors (including
   Zoho Books, named as a reference) gate some features by tier. If Xtreme Books stays
   user-count-only, that's a real differentiator worth stating clearly on the pricing page.
3. **Base yearly price per tier.** ₦80,000/user/year is confirmed for add-on users; the base
   subscription price for each tier itself is not yet set.
4. **Free trial:** offered or not, and if so, what length and whether it's full-featured or
   limited.
5. **CIT tracking mechanics.** VAT/PAYE/WHT are transaction-level and well understood from
   `xtreme-finance-system`. CIT is an annual company-level tax with more involved rules —
   confirm with an accountant what "CIT obligation tracking" needs to actually calculate
   versus simply record (amount, due date, filing status) based on a figure the tenant's
   accountant supplies.
6. **Mid-cycle billing:** if a tenant adds users partway through their subscription year, is
   the add-on cost pro-rated for the remainder of the year, or charged in full?

## Technical / vendor

7. **Multi-tenancy architecture:** shared schema with `tenant_id` (current lean, see
   `04-data-model.md`) vs. schema/database-per-tenant. Affects nearly everything downstream.
8. **CAC/TIN verification provider.** No vendor selected; needs research into what's actually
   available and reliable for a Nigerian public-register/TIN lookup.
9. **KYC + virtual account banking partner** for the wallet feature. No vendor selected; this
   is a real Banking-as-a-Service integration, not something to build in-house.
10. **Hosting.** `xtreme-finance-system` runs on shared cPanel hosting, which has already
    caused several production incidents this year due to host-specific quirks (broken env-var
    UI, disabled global `fetch`, native-dependency install failures). For a public,
    multi-tenant SaaS with real uptime/scaling expectations, is a move to a VPS or managed
    cloud platform in scope for this project, or is shared hosting still the constraint to
    design around?
11. **OTP delivery channel:** email, SMS, or both — and whether OTP is required on every
    login or only for new/untrusted devices.

## Design

12. ~~**Visual identity:** does Xtreme Books get its own distinct palette/typography, or extend
    `xtreme-finance-system`'s existing "Liquid Glass" black/white/lime look?~~ **Resolved
    2026-09-25:** its own distinct identity, explicitly not an extension of
    `xtreme-finance-system`'s internal-tool look — target is Apple-level, 3D/animated,
    commercial-grade design, not a "vibecode" template aesthetic. See
    `08-branding-design.md`. What's still open: the concrete palette/typography/motion system
    itself, and which UI/UX skills/tooling the business owner brings in to define it.
13. **Is there an existing Xtreme Cr8tivity logo file** (beyond the two favicon PNGs currently
    in `brand/`) that should be sourced before homepage design work starts?
