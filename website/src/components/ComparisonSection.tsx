"use client";

import { X, Check } from "lucide-react";
import { Reveal } from "./Reveal";

const BEFORE = [
  "Sales, stock, and expenses scattered across spreadsheets and WhatsApp",
  "Nobody can say what's actually in the bank right now",
  "VAT filing is a scramble at month-end",
  "Invoices aren't e-invoicing-ready until someone remembers to fix them",
  "A tax audit means digging through a year of loose records",
];

const AFTER = [
  "One system every transaction flows through automatically",
  "Real-time cash position, always current",
  "VAT, WHT, and PAYE reports ready on demand",
  "Every invoice carries an IRN from the moment it's issued",
  "An audit-ready report pack, generated in one click",
];

export function ComparisonSection() {
  return (
    <section className="py-28">
      <div className="mx-auto max-w-5xl px-6">
        <Reveal>
          <div className="mx-auto max-w-2xl text-center">
            <span className="text-sm font-semibold uppercase tracking-widest text-primary">
              The gap growth exposes
            </span>
            <h2 className="mt-3 font-display text-4xl leading-tight tracking-tight text-foreground sm:text-5xl">
              What used to work stops working once you're growing.
            </h2>
            <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
              More sales, more stock movement, more people touching the numbers. Somewhere in
              there, spreadsheets stop being enough.
            </p>
          </div>
        </Reveal>

        <div className="mt-14 grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Reveal delay={0.05}>
            <div className="h-full rounded-3xl border border-border bg-white/70 p-8">
              <h3 className="font-display text-lg text-foreground/70">Before Kora</h3>
              <ul className="mt-6 space-y-4">
                {BEFORE.map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <X size={18} className="mt-0.5 shrink-0 text-muted-foreground" />
                    <span className="text-sm text-foreground/70">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>

          <Reveal delay={0.12}>
            <div className="h-full rounded-3xl border-2 border-primary/30 bg-white p-8 shadow-[0_20px_60px_-24px_rgba(37,99,235,0.35)]">
              <h3 className="font-display text-lg text-primary">With Kora</h3>
              <ul className="mt-6 space-y-4">
                {AFTER.map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <Check size={18} className="mt-0.5 shrink-0 text-primary" strokeWidth={2.5} />
                    <span className="text-sm text-foreground/90">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
