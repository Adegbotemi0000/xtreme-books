"use client";

import { useEffect, useRef, useState } from "react";
import { useInView } from "framer-motion";

function Counter({ to, suffix = "" }: { to: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-10% 0px" });
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (!inView) return;
    const duration = 900;
    const start = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const progress = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(eased * to));
      if (progress < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [inView, to]);

  return (
    <span ref={ref} className="font-mono tabular-nums">
      {value}
      {suffix}
    </span>
  );
}

const FACTS = [
  { to: 4, suffix: "", label: "Tax types automated — VAT, WHT, PAYE, CIT" },
  { to: 100, suffix: "%", label: "Balanced double-entry, every transaction" },
  { to: 10, suffix: "+", label: "Core modules from day one, on every plan" },
  { to: 0, suffix: "", label: "Extra fee for payroll, wallet, or e-invoicing" },
];

export function Stats() {
  return (
    <section className="border-y border-border bg-white/60 py-14">
      <div className="mx-auto grid max-w-6xl grid-cols-2 gap-8 px-6 sm:grid-cols-4">
        {FACTS.map((f) => (
          <div key={f.label} className="text-center">
            <div className="font-display text-3xl text-primary sm:text-4xl">
              <Counter to={f.to} suffix={f.suffix} />
            </div>
            <p className="mt-2 text-sm leading-snug text-muted-foreground">{f.label}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
