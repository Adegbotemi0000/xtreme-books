# 08 — Branding & Design

## Interim branding

While dedicated Xtreme Books branding and homepage design direction are worked out, use the
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

## What "modern" should cover, concretely

- A homepage that clearly communicates: what the product does, who it's for, the three
  pricing tiers, a demo-booking path, and a clear sign-up call to action — matching the
  structure in `03-platform-modules.md` §3.1.
- A visual identity distinct enough from `xtreme-finance-system`'s internal "Liquid Glass"
  redesign (frosted panels, black/white/lime palette) to read as its own product, even though
  they share a parent brand — decide whether Xtreme Books gets its own palette/typography or
  extends the existing Xtreme Cr8tivity look. This is exactly the kind of decision the
  business owner wants UI/UX skill input on before committing.
- Responsive design that works cleanly on mobile — the original brief explicitly calls out
  mobile browser usability even though native apps are out of scope for this phase.
- A design system (colors, type scale, spacing, component patterns) shared between the public
  marketing site and the logged-in application, even if they end up as separate codebases (see
  `05-tech-stack.md`) — so the transition from "marketing site" to "login" to "inside the
  product" feels like one product, not three.

## Process note

The business owner is bringing in UI/UX skills/tooling before this work starts. Treat this doc
as a placeholder for direction, not a finished design brief — revisit it once that direction
exists, and don't start building marketing-site or app UI ahead of it.
