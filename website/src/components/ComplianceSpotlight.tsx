"use client";

import { CheckCircle2, ShieldCheck } from "lucide-react";
import { Reveal } from "./Reveal";

const POINTS = [
  "Direct NRS REV 360 integration — not a third-party intermediary",
  "Every invoice captures buyer TIN, seller TIN, date, and VAT — automatically",
  "IRN issued on every invoice, ready for e-invoicing from the first sale",
  "VAT, WHT, PAYE, and CIT tracked as configurable, always-current tax types",
];

export function ComplianceSpotlight() {
  return (
    <section id="compliance" className="py-28">
      <div className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-16 px-6 lg:grid-cols-2">
        <Reveal>
          <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-sm font-semibold text-primary">
            <ShieldCheck size={16} />
            Nigeria Tax Administration Act 2025
          </span>
          <h2 className="mt-5 font-display text-4xl leading-tight tracking-tight text-foreground sm:text-5xl">
            Compliance isn&apos;t a feature you turn on. It&apos;s how the
            platform is built.
          </h2>
          <p className="mt-5 text-lg leading-relaxed text-muted-foreground">
            Nigerian tax law changed with NTA 2025 — and it will change again.
            Every tax rule in Kora lives as editable data your
            accountant controls, not code that needs a developer every time
            the rules move.
          </p>
          <ul className="mt-8 space-y-4">
            {POINTS.map((p) => (
              <li key={p} className="flex items-start gap-3">
                <CheckCircle2
                  size={20}
                  className="mt-0.5 shrink-0 text-primary"
                  strokeWidth={2}
                />
                <span className="text-foreground/90">{p}</span>
              </li>
            ))}
          </ul>
        </Reveal>

        <Reveal delay={0.1}>
          {/* Content-layer card, not chrome — per Apple's Liquid Glass model
              this gets a standard material (a plain frosted panel), not real
              glass refraction, which is reserved for the floating nav/badge. */}
          <div className="glass-panel rounded-3xl shadow-[0_20px_60px_-20px_rgba(37,99,235,0.35)]">
            <div className="p-8">
              <div className="flex items-center justify-between border-b border-border pb-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Invoice
                  </p>
                  <p className="font-display text-lg text-foreground">
                    INV-2026-00842
                  </p>
                </div>
                <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
                  Transmitted
                </span>
              </div>

              <dl className="mt-5 space-y-3 text-sm">
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">IRN</dt>
                  <dd className="font-mono text-foreground">
                    NRS-8F2A-991C-XB07
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Buyer TIN</dt>
                  <dd className="font-mono text-foreground">2093-4471-0001</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Seller TIN</dt>
                  <dd className="font-mono text-foreground">1042-8850-0001</dd>
                </div>
                <div className="flex justify-between border-t border-border pt-3">
                  <dt className="text-muted-foreground">VAT (7.5%)</dt>
                  <dd className="text-foreground">₦18,750</dd>
                </div>
                <div className="flex justify-between text-base font-semibold">
                  <dt className="text-foreground">Total</dt>
                  <dd className="text-foreground">₦268,750</dd>
                </div>
              </dl>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
