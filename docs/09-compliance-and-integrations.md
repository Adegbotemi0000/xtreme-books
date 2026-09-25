# 09 — Compliance & Integrations

## Nigerian tax compliance

- Full compliance with NRS (Nigeria Revenue Service) guidelines and the Nigeria Tax
  Administration Act 2025 (NTA 2025).
- VAT, PAYE, Withholding Tax, and Company Income Tax (CIT) tracking must all be
  tenant-admin-configurable — rates, bands, and enabled/disabled state editable without a
  software update, since Nigerian tax law changes periodically (as it just did with NTA
  2025).
- Every invoice — regardless of e-invoicing status — captures buyer TIN, seller TIN, invoice
  date, unique invoice number, line items, and VAT, so historical invoices are always
  e-invoicing-ready retroactively.
- PAYE is calculated using the current NTA 2025 progressive band structure, with bands stored
  as editable data (see `PAYEBand` in `04-data-model.md`).
- Pension contributions are calculated as a statutory payroll deduction alongside PAYE.
- The platform generates VAT, WHT, and PAYE reports usable directly for payment, reporting,
  and filing — this needs to produce output in a form an accountant can actually act on, not
  just an internal summary screen.
- CIT is tracked as an obligation (amounts, periods, filing/payment status) rather than
  calculated transaction-by-transaction the way VAT is — confirm the exact CIT tracking
  mechanics with the business owner or an accountant before building this piece; CIT
  calculation rules are more involved than a flat rate.

## NRS REV 360 e-invoicing

- Direct integration with NRS REV 360 — not a third-party e-invoicing intermediary.
- Every invoice carries an IRN (Invoice Reference Number).
- **Open tension to resolve before building** (see `11-open-questions.md`): the original
  brief specifies e-invoicing as **opt-in per invoice**, via a toggle a tenant sets invoice by
  invoice. The business owner's more recent framing describes e-invoicing as **"built in and
  automatic."** These aren't necessarily contradictory — "built in and automatic" may mean
  IRN generation and NRS-readiness happen automatically the moment an invoice is created,
  while actual *transmission* to NRS could still be an explicit action or still be gated
  behind CAC/TIN verification — but this needs an explicit decision, not an assumption, before
  the invoicing flow is designed.
- Submission to NRS REV 360 is only available once a tenant's CAC and TIN verification has
  succeeded; until then, any e-invoicing UI exists but transmission is blocked with a clear
  explanatory message.
- Each invoice tracks and displays its e-invoice status (Not Submitted, Submitted, Accepted,
  Rejected/Error) and any reference number NRS returns.
- **Carry forward lessons already paid for on `xtreme-finance-system`:**
  - Split the hard-required validate/sign step from the soft-failing transmit step in the data
    model from day one — a signed-but-not-transmitted invoice is a normal state (e.g. NRS's
    own account-permission rollout can lag independent of anything the platform does), not an
    error state that blocks the tenant.
  - Build the HTTP client on Node's built-in `https` module, not `fetch`/`undici` — some
    hosting environments disable global `fetch` for unrelated reasons (see
    `05-tech-stack.md`), and discovering that in production is expensive.
  - User-facing wording for a pending/unresolved NRS state should read as "Pending," not
    "Failed" — the underlying cause is very often outside both the platform's and the
    tenant's control, and alarming language there erodes trust in the product for no reason.
  - API credentials and sandbox access come from Xtreme Cr8tivity, provided later in the
    engagement — this brief scopes the integration effort, it doesn't hand over live secrets.

## CAC & TIN verification

- Both required as part of onboarding (see `03-platform-modules.md` §3.2).
- No specific vendor is mandated — left open for research. Needs a workable method for:
  - CAC registration number verification against Nigeria's public company register.
  - TIN verification against an available Nigerian TIN verification service.
- Track vendor selection as an open item (`11-open-questions.md`) — don't guess at a specific
  third-party provider without confirming it actually has a usable public/partner API.

## Wallet, virtual accounts & KYC

New requirement beyond the original brief's scope:

- Every plan includes a wallet and virtual account for managing direct and statutory payments.
- Requires KYC verification before activation.
- Partner bank details are shown to the tenant during setup — implying an actual banking/BaaS
  (Banking-as-a-Service) partner integration, not something built in-house from scratch.
- Needs a banking/payments partner capable of issuing virtual accounts per tenant and running
  KYC (likely BVN/NIN-based, matching how Nigerian fintech KYC generally works) — no vendor
  selected yet. Track as an open item.
- This sits adjacent to, but distinct from, Paystack subscription billing (3.3) — the wallet
  is for a tenant's *own* payment flows (e.g. paying a supplier or a tax obligation from
  inside the platform), not for paying Xtreme Cr8tivity's subscription fee.

## Multi-currency (per the original brief's clarification)

Recording transactions in a currency other than Naira does not exempt a Nigerian-registered
tenant from NTA 2025 tax compliance on its Nigerian tax obligations. If multi-currency support
is built, it's a recording convenience, not a compliance exemption — don't let it become one
by accident in how tax calculations are wired.
