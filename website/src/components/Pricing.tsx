"use client";

import { Check } from "lucide-react";
import { Reveal } from "./Reveal";
import clsx from "clsx";

const PLANS = [
  {
    name: "Foundation",
    users: 2,
    tagline: "For a small team just getting off Excel.",
    featured: false,
  },
  {
    name: "Momentum",
    users: 5,
    tagline: "The most common fit for a growing business.",
    featured: true,
  },
  {
    name: "Enterprise",
    users: 10,
    tagline: "For multi-branch operations with a full team.",
    featured: false,
  },
];

const INCLUDED = [
  "Full double-entry accounting & GL",
  "Payroll — PAYE, pension, payslips",
  "VAT, WHT, PAYE & CIT tracking",
  "NRS REV 360 e-invoicing, IRN on every invoice",
  "Multi-branch inventory & production",
  "Wallet & virtual accounts (KYC required)",
  "Audit-ready report pack",
  "Role-based access, OTP, full audit trail",
];

export function Pricing() {
  return (
    <section id="pricing" className="py-28">
      <div className="mx-auto max-w-6xl px-6">
        <Reveal>
          <div className="mx-auto max-w-2xl text-center">
            <span className="text-sm font-semibold uppercase tracking-widest text-primary">
              Pricing
            </span>
            <h2 className="mt-3 font-display text-4xl leading-tight tracking-tight text-foreground sm:text-5xl">
              One price by team size. Nothing gated behind a higher tier.
            </h2>
            <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
              Every module on every plan — payroll, wallet, and e-invoicing
              included from Foundation. Add seats any time at{" "}
              <span className="font-semibold text-foreground">
                ₦80,000/user/year
              </span>
              .
            </p>
          </div>
        </Reveal>

        <div className="mt-16 grid grid-cols-1 gap-6 lg:grid-cols-3">
          {PLANS.map((plan, i) => {
            const card = (
              <div
                className={clsx(
                  "flex h-full flex-col rounded-3xl p-8",
                  plan.featured
                    ? "text-foreground"
                    : "glass-panel text-foreground shadow-[0_4px_24px_-8px_rgba(30,41,59,0.12)]"
                )}
              >
                {plan.featured && (
                  <span className="mb-4 inline-flex w-fit items-center rounded-full bg-accent px-3 py-1 text-xs font-bold text-on-accent">
                    Most popular
                  </span>
                )}
                <h3 className="font-display text-2xl">{plan.name}</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  {plan.tagline}
                </p>
                <div className="mt-6 flex items-baseline gap-2">
                  <span className="font-display text-4xl">
                    {plan.users} users
                  </span>
                  <span className="text-sm text-muted-foreground">
                    included
                  </span>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  +₦80,000/user/year after that
                </p>

                <a
                  href="#get-started"
                  className={clsx(
                    "mt-8 inline-flex items-center justify-center rounded-full px-6 py-3 text-sm font-semibold transition-transform hover:scale-[1.02] active:scale-[0.98] cursor-pointer",
                    plan.featured
                      ? "bg-primary text-on-primary shadow-lg shadow-primary/30"
                      : "border border-border bg-white text-foreground"
                  )}
                >
                  Choose {plan.name}
                </a>

                <ul className="mt-8 space-y-3 border-t border-border/70 pt-6 text-sm">
                  {INCLUDED.map((item) => (
                    <li key={item} className="flex items-start gap-2.5">
                      <Check
                        size={16}
                        className="mt-0.5 shrink-0 text-primary"
                        strokeWidth={2.5}
                      />
                      <span className="text-foreground/85">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            );

            return (
              <Reveal key={plan.name} delay={i * 0.08}>
                {plan.featured ? (
                  // Content-layer card, not chrome — a standard frosted
                  // material, not real Liquid Glass (reserved for the nav/badge).
                  <div className="glass-panel h-full rounded-3xl border-2 border-primary/40 shadow-[0_24px_70px_-20px_rgba(37,99,235,0.45)] lg:-translate-y-3">
                    {card}
                  </div>
                ) : (
                  card
                )}
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
