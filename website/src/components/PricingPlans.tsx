"use client";

import { Check, ArrowRight, PlayCircle } from "lucide-react";
import clsx from "clsx";
import { Reveal } from "./Reveal";
import { appSignupUrl } from "@/lib/appUrl";

const PLANS = [
  {
    name: "Foundation",
    slug: "foundation",
    users: 2,
    priceLabel: "₦900,000",
    tagline: "Perfect for an owner and one teammate moving off spreadsheets.",
    featured: false,
  },
  {
    name: "Momentum",
    slug: "momentum",
    users: 5,
    priceLabel: "₦1,500,000",
    tagline: "For a growing team where several people touch sales, stock, and reporting.",
    featured: true,
  },
  {
    name: "Enterprise",
    slug: "enterprise",
    users: 10,
    priceLabel: "₦3,000,000",
    tagline: "For multi-branch operations with a full team and layered approvals.",
    featured: false,
  },
];

const INCLUDED = [
  "Full double-entry accounting & General Ledger",
  "Sales, purchases, and point of sale",
  "Multi-branch inventory & production",
  "Payroll — PAYE, pension, payslips",
  "VAT, WHT, PAYE & CIT tracking",
  "NRS REV 360 e-invoicing, IRN on every invoice",
  "Wallet & virtual accounts (KYC required)",
  "Role-based access, OTP, full audit trail",
  "Audit-ready report pack",
  "Excel/CSV import & export, platform-wide",
];

export function PricingPlans() {
  return (
    <div>
      <section className="pb-16">
        <div className="mx-auto max-w-3xl px-6 text-center">
          <Reveal>
            <span className="text-sm font-semibold uppercase tracking-widest text-primary">
              Pricing
            </span>
            <h1 className="mt-3 font-display text-4xl leading-tight tracking-tight text-foreground sm:text-5xl">
              Straightforward pricing for growing Nigerian businesses.
            </h1>
            <p className="mt-5 text-lg leading-relaxed text-muted-foreground">
              Every plan gets every module — nothing gated behind a higher tier. Choose based
              on how many people on your team need a login.
            </p>
          </Reveal>
        </div>
      </section>

      <section className="pb-16">
        <div className="mx-auto max-w-6xl px-6">
          <Reveal>
            <div className="glass-panel rounded-3xl p-8">
              <h2 className="font-display text-xl">Every plan includes</h2>
              <ul className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
                {INCLUDED.map((item) => (
                  <li key={item} className="flex items-start gap-2.5 text-sm">
                    <Check size={16} className="mt-0.5 shrink-0 text-primary" strokeWidth={2.5} />
                    <span className="text-foreground/85">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>
        </div>
      </section>

      <section className="pb-24">
        <div className="mx-auto max-w-6xl px-6">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
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
                  <p className="mt-1 text-sm text-muted-foreground">{plan.tagline}</p>
                  <div className="mt-6 flex items-baseline gap-2">
                    <span className="font-display text-4xl">{plan.priceLabel}</span>
                    <span className="text-sm text-muted-foreground">/year</span>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {plan.users} users included · +₦80,000/user/year after that
                  </p>

                  <a
                    href={appSignupUrl(plan.slug)}
                    className={clsx(
                      "mt-6 inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-semibold transition-transform hover:scale-[1.02] active:scale-[0.98] cursor-pointer",
                      plan.featured
                        ? "bg-primary text-on-primary shadow-lg shadow-primary/30"
                        : "border border-border bg-white text-foreground"
                    )}
                  >
                    Start free trial
                    <ArrowRight size={16} />
                  </a>

                  <ul className="mt-8 space-y-3 border-t border-border/70 pt-6 text-sm">
                    {INCLUDED.slice(0, 6).map((item) => (
                      <li key={item} className="flex items-start gap-2.5">
                        <Check size={16} className="mt-0.5 shrink-0 text-primary" strokeWidth={2.5} />
                        <span className="text-foreground/85">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              );

              return (
                <Reveal key={plan.name} delay={i * 0.08}>
                  {plan.featured ? (
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
          <p className="mt-8 text-center text-sm text-muted-foreground">
            Additional users on any plan are ₦80,000/user/year. No card required to start your
            trial.
          </p>
        </div>
      </section>

      <section className="pb-28">
        <div className="mx-auto max-w-4xl px-6">
          <Reveal>
            <div className="rounded-3xl bg-gradient-to-br from-[#1d4ed8] via-primary to-[#60a5fa] p-10 text-center text-white sm:p-14">
              <h2 className="font-display text-3xl sm:text-4xl">
                Not sure which plan fits your team?
              </h2>
              <p className="mt-4 text-white/85">
                Talk to us and we&apos;ll help you pick — or just start free and upgrade seats as
                your team grows.
              </p>
              <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
                <a
                  href={appSignupUrl()}
                  className="inline-flex items-center gap-2 rounded-full bg-white px-7 py-3.5 text-base font-semibold text-primary shadow-lg transition-transform hover:scale-[1.03] active:scale-[0.98] cursor-pointer"
                >
                  Start free trial
                  <ArrowRight size={18} />
                </a>
                <a
                  href="/#demo"
                  className="inline-flex items-center gap-2 rounded-full border border-white/40 px-7 py-3.5 text-base font-semibold text-white transition-colors hover:bg-white/10 cursor-pointer"
                >
                  <PlayCircle size={18} />
                  Book a demo
                </a>
              </div>
            </div>
          </Reveal>
        </div>
      </section>
    </div>
  );
}
