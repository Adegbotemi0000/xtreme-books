"use client";

import {
  FileText,
  Wallet,
  Boxes,
  Users,
  BookOpenCheck,
  FileBarChart,
} from "lucide-react";
import { Reveal } from "./Reveal";

const FEATURES = [
  {
    icon: FileText,
    title: "Sales & e-invoicing",
    body: "Quotations, invoices, and payments — every invoice carries an IRN and transmits straight to NRS REV 360.",
  },
  {
    icon: Users,
    title: "Payroll, built in",
    body: "PAYE under NTA 2025, pension, attendance-based pay, and payslips — on every plan, not a paid add-on.",
  },
  {
    icon: Boxes,
    title: "Inventory & production",
    body: "Real-time stock, multi-branch tracking, and bill-of-materials production with wastage visibility.",
  },
  {
    icon: Wallet,
    title: "Wallet & virtual accounts",
    body: "KYC-verified wallets and virtual accounts for direct and statutory payments, with partner banks at setup.",
  },
  {
    icon: BookOpenCheck,
    title: "Real double-entry books",
    body: "Every transaction posts a balanced journal entry automatically — a true General Ledger, not a spreadsheet.",
  },
  {
    icon: FileBarChart,
    title: "Audit-ready reporting",
    body: "Trial Balance, P&L, Balance Sheet, and a full audit-ready pack your accountant can act on directly.",
  },
];

export function Features() {
  return (
    <section
      id="modules"
      className="relative overflow-hidden py-28"
      style={{
        backgroundImage:
          "radial-gradient(circle, rgba(37,99,235,0.14) 1px, transparent 1px)",
        backgroundSize: "22px 22px",
      }}
    >
      <div className="mx-auto max-w-6xl px-6">
        <Reveal>
          <div className="mx-auto max-w-2xl text-center">
            <span className="text-sm font-semibold uppercase tracking-widest text-primary">
              Everything, one place
            </span>
            <h2 className="mt-3 font-display text-4xl leading-tight tracking-tight text-foreground sm:text-5xl">
              One system, every module already talking to each other.
            </h2>
            <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
              A sale becomes an invoice, becomes a receivable, becomes a stock
              movement, becomes a GL posting — automatically. Enter a fact
              once, everywhere else stays true.
            </p>
          </div>
        </Reveal>

        <div className="mt-16 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f, i) => (
            <Reveal key={f.title} delay={i * 0.06}>
              <div className="glass-panel group h-full rounded-2xl p-7 shadow-[0_4px_24px_-8px_rgba(30,41,59,0.12)] transition-transform hover:-translate-y-1">
                <div className="inline-flex rounded-xl bg-primary/10 p-3 text-primary">
                  <f.icon size={22} strokeWidth={2} />
                </div>
                <h3 className="mt-5 font-display text-xl text-foreground">
                  {f.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {f.body}
                </p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
