# 08 — Branding & Design

## Interim branding

While dedicated Kora branding and homepage design direction are worked out, use the
existing Xtreme Cr8tivity brand assets as a starting point:

- `brand/favicon-32.png`, `brand/favicon-192.png` — the same favicons used in
  `xtreme-finance-system`.
- No dedicated logo/wordmark image file exists yet — `xtreme-finance-system`'s app renders
  its brand as text ("Xtreme Cr8tivity"), not an image logo. If a proper Xtreme Cr8tivity logo
  file exists outside this codebase (a design file, a Canva export, etc.), it should be
  dropped into `brand/` before homepage design work starts.
- Platform brand is Xtreme Cr8tivity throughout the public site and shared UI chrome — a
  tenant's own uploaded logo appears only inside that tenant's own dashboard, never on shared
  platform branding (see `03-platform-modules.md` §3.2).

## The homepage requirement

The business owner's explicit ask: a public homepage that is "very nice and modern" — this is
the first thing a prospective customer sees, and it needs to read as a credible SaaS product,
not an internal tool with a marketing page bolted on. This is the reason implementation is
deliberately paused before any code is written: UI/UX direction (a design system, a look and
feel, reference sites) should be settled before the marketing site or app frontend gets built,
rather than designed ad hoc page by page.

## Design bar — confirmed decision (2026-09-25)

This is explicitly **not** a continuation of `xtreme-finance-system`'s look. That build is an
internal operational tool — a competent, no-nonsense "Liquid Glass" utility UI (frosted
panels, black/white/lime, dense tables, get-the-job-done) built for one company's own staff to
use daily. Kora is a **commercial product** other businesses will discover, evaluate,
and pay for, and the bar is correspondingly higher:

- **Apple-level design quality** — the explicit reference point. Meaning: restraint,
  precision, generous whitespace, considered typography, motion that feels physical and
  intentional rather than decorative, and an overall sense that every pixel was a deliberate
  choice. Not "clean SaaS template" — genuinely premium.
- **User-friendly and superb**, not just visually — the design has to make onboarding, pricing
  comprehension, and the sign-up flow feel effortless, since this is the product's entire
  first impression and conversion funnel in one.
- **3D and animated** — real dimensionality and motion design (product visualizations,
  scroll-driven animation, interactive elements), not flat static marketing-page sections.
- **Explicitly not a "vibecode" look** — not the generic, interchangeable aesthetic that
  AI-generated or template-assembled sites tend toward (stock gradient blobs, default
  shadcn/Tailwind-starter-kit look, generic rounded cards with no point of view). This has to
  look like it was designed by people with taste, for a product with a specific identity.
- This design bar applies first and foremost to the **public marketing site** (the homepage is
  the named priority), and should extend into the logged-in application's visual language too,
  so the product doesn't feel like a downgrade the moment a customer logs in — see the shared
  design-system note below.

This resolves part of Open Question #12 in `11-open-questions.md`: Kora gets its own
distinct visual identity — it does not extend `xtreme-finance-system`'s existing look. What's
still open is the specific palette/typography/motion system itself, which depends on whatever
UI/UX skills/tooling the business owner is about to bring in.

## What "modern" should cover, concretely

- A homepage that clearly communicates: what the product does, who it's for, the three
  pricing tiers, a demo-booking path, and a clear sign-up call to action — matching the
  structure in `03-platform-modules.md` §3.1 — delivered at the design bar above, not just
  functionally correct.
- Responsive design that works cleanly on mobile — the original brief explicitly calls out
  mobile browser usability even though native apps are out of scope for this phase. Motion/3D
  work needs a real mobile-performance plan (graceful degradation, not just "hope it's fast
  enough"), not just a desktop showcase.
- A design system (colors, type scale, spacing, component patterns, motion tokens) shared
  between the public marketing site and the logged-in application, even if they end up as
  separate codebases (see `05-tech-stack.md`) — so the transition from "marketing site" to
  "login" to "inside the product" feels like one considered product, not a beautiful front
  door bolted onto a plain back office.

## Process note

The business owner is installing specific UI/UX skills for this project before design work
starts, and will be providing them directly. Treat this doc as direction, not a finished
design brief — once those skills/tools are in place, revisit this doc to fold in whatever
concrete design system, component library, or reference material they bring, and don't start
building marketing-site or app UI ahead of that.
