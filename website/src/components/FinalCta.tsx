"use client";

import { ArrowRight, PlayCircle } from "lucide-react";
import { Reveal } from "./Reveal";

export function FinalCta() {
  return (
    <section className="relative overflow-hidden py-28">
      {/* A second live WebGL gradient here (on top of the Hero's) noticeably
          strained rendering with both mounted at once — a real mobile-battery
          cost, not just a dev-tool quirk. A CSS gradient gets the same brand
          moment at effectively zero runtime cost. */}
      <div
        className="absolute inset-0 -z-10 bg-gradient-to-br from-[#1d4ed8] via-primary to-[#60a5fa] bg-[length:200%_200%] motion-safe:animate-[gradient-pan_12s_ease-in-out_infinite]"
      />
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.25),transparent_55%)]" />

      <Reveal>
        <div className="mx-auto max-w-3xl px-6 text-center">
          <h2 className="font-display text-4xl leading-tight tracking-tight text-white sm:text-5xl">
            Your books, done properly — from the first invoice.
          </h2>
          <p className="mt-5 text-lg text-white/85">
            Set up your company in minutes. Cancel any time.
          </p>
          <div className="mt-9 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <a
              href="#get-started"
              className="group inline-flex items-center gap-2 rounded-full bg-white px-7 py-3.5 text-base font-semibold text-primary shadow-lg transition-transform hover:scale-[1.03] active:scale-[0.98] cursor-pointer"
            >
              Get started free
              <ArrowRight
                size={18}
                className="transition-transform group-hover:translate-x-0.5"
              />
            </a>
            <a
              href="#demo"
              className="inline-flex items-center gap-2 rounded-full border border-white/40 px-7 py-3.5 text-base font-semibold text-white transition-colors hover:bg-white/10 cursor-pointer"
            >
              <PlayCircle size={18} />
              Book a demo
            </a>
          </div>
        </div>
      </Reveal>
    </section>
  );
}
