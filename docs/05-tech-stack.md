# 05 — Tech Stack

No code has been written yet — this is a decision doc, to be confirmed before implementation
starts. Defaults below lean toward what's already proven in `xtreme-finance-system`, since
"boring and maintainable" is a stated ground rule and that stack already works and is well
understood.

## Backend

- **Node.js + Express** — same as `xtreme-finance-system`. Proven, boring, the team already
  knows its patterns (crud factory, posting rules, audit middleware).
- **PostgreSQL** — same reasoning. Needs a multi-tenancy decision layered on top (see
  `04-data-model.md`) — most likely shared schema with `tenant_id` on every table, enforced
  through a consistent data-access layer rather than per-query discipline.
- **JWT auth**, extended with OTP verification at login (new — `xtreme-finance-system` has no
  OTP step) and tenant context embedded in the token/session so every request resolves its
  tenant_id from something the server verifies, never from client-supplied input alone.

## Frontend

Two distinct surfaces, likely two separate frontends rather than one app trying to be both:

- **Public marketing site** — needs to be fast, SEO-friendly, and easy to keep "very nice and
  modern" per the business owner's requirement. A framework built for this (e.g. Next.js
  static/SSR pages) is a better fit here than a client-rendered SPA, purely for
  marketing-site concerns (page speed, SEO, easy CMS-style content editing for legal
  pages/pricing/docs library). To be finalized once UI/UX direction is set.
- **Logged-in application** — React (Vite), matching `xtreme-finance-system`'s proven
  pattern: fast dev loop, no SSR complexity needed once a user is authenticated, and the team
  already has a working component/page/API-client pattern to extend (EntityManager,
  Pagination, the api/ client wrappers).

Both should share the design system/tokens once one exists (see `08-branding-design.md`), even
if they're separate codebases.

## 3D & animation (confirmed)

- **React Three Fiber** (`@react-three/fiber`, from the `pmndrs` ecosystem) — confirmed as the
  library for the 3D/animated work called for in `08-branding-design.md`'s design bar. It's a
  React renderer for three.js: declarative JSX scenes with full access to three.js's API and
  ecosystem (`@react-three/drei` for common helpers, GSAP or Framer Motion alongside it for
  non-3D motion/scroll-driven animation). This targets the public marketing site primarily,
  with real attention to mobile performance/graceful degradation rather than a
  desktop-only showcase (see `08-branding-design.md`).
- A `react-three-fiber` Claude Code skill is already available for this project's use once
  implementation starts — no separate install needed for that.

## Liquid-metal logo effect (candidate approaches)

For animating the Xtreme Cr8tivity/Kora logo itself (a signature moment fitting the
"cool, not vibecode" design bar), two options are on the table, both already available:

- **`@paper-design/shaders-react`** (from
  [paper-design/liquid-logo](https://github.com/paper-design/liquid-logo)) — an installable
  npm shader library with a working reference demo (Next.js + React 19) at
  [liquid.paper.design](https://liquid.paper.design). The more turnkey option if the final
  frontend stack is React-based, since it's a real package rather than a technique to
  hand-port.
- **`liquid-logo` skill** (already available in this session, from `collidingScopes`) — a raw
  WebGL1/GLSL fragment-shader technique (edge detection on the logo's alpha channel driving a
  flowing, noise-perturbed vector field with metallic highlights), framework-free, meant to be
  ported directly into a project rather than installed as a dependency.
- Decide between them once the frontend framework is settled (see the marketing-site framework
  note above) and an actual logo file exists to animate (see `08-branding-design.md`'s note
  on sourcing a proper logo file beyond the current favicon-only assets).

## Payments & billing

- **Paystack** — confirmed in the original brief for subscription billing (yearly plans).
- Plan/pricing configuration lives in the database (super-admin editable), not hard-coded —
  see `07-pricing-plans.md`.

## E-invoicing

- **NRS REV 360**, direct integration (not a third-party e-invoicing intermediary), per the
  original brief.
- Carry forward everything learned building `xtreme-finance-system`'s NRS integration:
  - Validate/sign and transmit are separate steps with materially different reliability —
    design the data model so a signed-but-not-yet-transmitted invoice is a normal, non-error
    state, not a failure needing a hard gate.
  - Node's `fetch`/`undici` is not safe to assume available in every hosting environment —
    build the HTTP client on Node's built-in `https` module from the start rather than
    discovering this the hard way in production again.
  - User-facing status wording matters — "Pending" reads very differently to a non-technical
    tenant than "Failed," even when the underlying cause is identical (an NRS-side rollout
    delay, not a bug).

## CAC/TIN verification

No vendor selected yet — the original brief leaves this to the developer to research. Needs a
workable Nigerian CAC public-register lookup and a TIN verification path. Track this as an
open item (see `11-open-questions.md`) rather than guessing at a provider now.

## KYC / wallet & virtual accounts

New requirement beyond the original brief. Needs a banking/payments partner that can issue
virtual accounts and run KYC — likely the same category of provider used for Nigerian
fintech KYC (BVN/NIN verification) plus a partner bank for the virtual account itself. No
vendor selected yet — flag in `11-open-questions.md`.

## Hosting

`xtreme-finance-system` runs on shared cPanel hosting (Setup Node.js App / Passenger). That
was workable for a single-tenant internal tool but comes with real constraints already
discovered the hard way this year (broken env-var UI for special characters, `NODE_OPTIONS`
disabling global `fetch`, native-dependency install failures under CloudLinux/LVE limits,
`EBADPLATFORM` npm issues). For a multi-tenant public SaaS with growing transaction volume and
uptime expectations, a proper VPS or managed cloud platform (with normal shell access, process
management, and the ability to run background jobs/queues for things like billing renewals
and report generation) is very likely the better foundation — flag this as a decision to make
explicitly rather than defaulting to the same hosting by inertia. See
`11-open-questions.md`.

## Non-functional requirements carried over from the brief

- HTTPS everywhere; encryption at rest for sensitive fields; properly hashed passwords;
  server-side RBAC enforcement (never just hidden in the UI).
- Automated, regular backups with a documented recovery process.
- Separate staging and production environments with a documented deployment process.
- Modern desktop and mobile browser support (Chrome, Safari, Edge, Firefox); usable on mobile
  browsers even though native apps are out of scope for this phase.
