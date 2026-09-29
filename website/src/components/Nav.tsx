"use client";

import { LiquidGlass } from "@liquidglassjs/react";
import Link from "next/link";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import { appLoginUrl } from "@/lib/appUrl";

const LINKS = [
  { href: "/#modules", label: "Product" },
  { href: "/#compliance", label: "Compliance" },
  { href: "/pricing", label: "Pricing" },
];

export function Nav() {
  const [open, setOpen] = useState(false);

  return (
    <header className="fixed inset-x-0 top-0 z-50 px-4 pt-4">
      <LiquidGlass
        radius={20}
        strength={10}
        mode="frost"
        className="mx-auto block max-w-6xl rounded-[20px] border border-white/40 shadow-[0_8px_30px_-12px_rgba(30,41,59,0.25)]"
      >
        {/* liquidglassjs appends its blurred surface layer AFTER children in the
            DOM, so real content needs an explicit z-index (not just DOM order)
            to stack above it, or the frost blurs the content itself. */}
        <div className="relative z-10 flex items-center justify-between px-5 py-3">
          <Link href="/" className="font-display text-lg tracking-tight text-foreground">
            Kora
          </Link>

          <nav className="hidden items-center gap-8 md:flex">
            {LINKS.map((l) => (
              <a
                key={l.href}
                href={l.href}
                className="text-sm font-medium text-foreground/70 transition-colors hover:text-foreground"
              >
                {l.label}
              </a>
            ))}
          </nav>

          <div className="hidden items-center gap-3 md:flex">
            <a
              href={appLoginUrl()}
              className="text-sm font-medium text-foreground/70 transition-colors hover:text-foreground"
            >
              Log in
            </a>
            <Link
              href="/pricing"
              className="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-on-primary shadow-sm transition-transform hover:scale-[1.03] active:scale-[0.98] cursor-pointer"
            >
              Get started
            </Link>
          </div>

          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            className="-mr-2.5 flex h-11 w-11 cursor-pointer items-center justify-center text-foreground md:hidden"
          >
            {open ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </LiquidGlass>

      {open && (
        <div className="mx-auto mt-2 flex max-w-6xl flex-col gap-1 rounded-2xl border border-white/40 bg-white/90 p-4 shadow-lg md:hidden">
          {LINKS.map((l) => (
            <a
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              className="rounded-lg px-3 py-2 text-sm font-medium text-foreground/80 hover:bg-muted"
            >
              {l.label}
            </a>
          ))}
          <a
            href={appLoginUrl()}
            onClick={() => setOpen(false)}
            className="rounded-lg px-3 py-2 text-sm font-medium text-foreground/80 hover:bg-muted"
          >
            Log in
          </a>
          <Link
            href="/pricing"
            onClick={() => setOpen(false)}
            className="mt-2 rounded-full bg-primary px-4 py-2 text-center text-sm font-semibold text-on-primary"
          >
            Get started
          </Link>
        </div>
      )}
    </header>
  );
}
