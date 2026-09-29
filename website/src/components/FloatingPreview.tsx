"use client";

import { useRef, useState } from "react";
import { FileText, Wallet, CalendarClock } from "lucide-react";
import { usePrefersReducedMotion } from "@/lib/usePrefersReducedMotion";

/**
 * The hero's "floating product preview" — a stylized dashboard card with two
 * satellite mini-cards that drift on their own slow loops and gently tilt
 * toward the cursor. Own layout/data/motion model (mouse-parallax tilt on a
 * CSS-animated float, not a static screenshot), not a copy of any reference
 * site's dashboard mockup.
 */
export function FloatingPreview() {
  const reducedMotion = usePrefersReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    if (reducedMotion || !ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width - 0.5;
    const py = (e.clientY - rect.top) / rect.height - 0.5;
    setTilt({ x: py * -6, y: px * 8 });
  }

  function handleMouseLeave() {
    setTilt({ x: 0, y: 0 });
  }

  return (
    <div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="relative mx-auto mt-16 hidden max-w-3xl md:block"
      style={{ perspective: "1400px" }}
    >
      {/* Central dashboard card */}
      <div
        className="glass-panel relative z-10 rounded-3xl p-6 shadow-[0_40px_90px_-30px_rgba(30,64,175,0.35)] transition-transform duration-200 ease-out"
        style={{
          transform: `rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,
        }}
      >
        <div className="flex items-center justify-between border-b border-border/70 pb-3">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            This month
          </span>
          <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
            Books balanced
          </span>
        </div>
        <div className="mt-4 grid grid-cols-3 gap-4">
          <div>
            <p className="text-xs text-muted-foreground">Revenue</p>
            <p className="font-display text-xl text-foreground">₦4.2m</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Cash position</p>
            <p className="font-display text-xl text-foreground">₦1.8m</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">VAT payable</p>
            <p className="font-display text-xl text-foreground">₦186k</p>
          </div>
        </div>
        <div className="mt-5 h-16 rounded-xl bg-gradient-to-r from-primary/15 via-primary/5 to-transparent" />
      </div>

      {/* Satellite mini-cards — float on their own slow loops */}
      <div
        className="glass-panel absolute -left-10 top-6 z-20 hidden items-center gap-2.5 rounded-2xl px-4 py-3 shadow-[0_20px_50px_-15px_rgba(30,64,175,0.3)] lg:flex motion-safe:[animation:float-slow_6s_ease-in-out_infinite]"
      >
        <FileText size={18} className="text-primary" />
        <div>
          <p className="text-xs font-semibold text-foreground">Invoice issued</p>
          <p className="text-[11px] text-muted-foreground">IRN ready · NRS-8F2A</p>
        </div>
      </div>

      <div
        className="glass-panel absolute -bottom-8 -right-6 z-20 hidden items-center gap-2.5 rounded-2xl px-4 py-3 shadow-[0_20px_50px_-15px_rgba(30,64,175,0.3)] lg:flex motion-safe:[animation:float-slower_7s_ease-in-out_infinite]"
      >
        <Wallet size={18} className="text-primary" />
        <div>
          <p className="text-xs font-semibold text-foreground">Wallet</p>
          <p className="text-[11px] text-muted-foreground">KYC verified</p>
        </div>
      </div>

      <div
        className="glass-panel absolute -right-14 top-16 z-20 hidden items-center gap-2.5 rounded-2xl px-4 py-3 shadow-[0_20px_50px_-15px_rgba(30,64,175,0.3)] xl:flex motion-safe:[animation:float-slow_8s_ease-in-out_infinite]"
      >
        <CalendarClock size={18} className="text-primary" />
        <div>
          <p className="text-xs font-semibold text-foreground">Payroll run</p>
          <p className="text-[11px] text-muted-foreground">Due in 5 days</p>
        </div>
      </div>
    </div>
  );
}
