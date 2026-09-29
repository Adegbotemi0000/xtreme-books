"use client";

import Link from "next/link";
import { ShaderGradientCanvas, ShaderGradient } from "@shadergradient/react";
import { LiquidGlass } from "@liquidglassjs/react";
import { ShieldCheck, ArrowRight, PlayCircle } from "lucide-react";
import { Reveal } from "./Reveal";
import { Hero3D } from "./Hero3D";
import { FloatingPreview } from "./FloatingPreview";
import { usePrefersReducedMotion } from "@/lib/usePrefersReducedMotion";

export function Hero() {
  const reducedMotion = usePrefersReducedMotion();

  return (
    <section className="relative flex min-h-[92vh] items-center overflow-hidden pt-28">
      {/* Soft, soothing animated gradient — trust-blue family, low contrast movement so it never fights the copy on top of it. */}
      <div className="absolute inset-0 -z-10">
        <ShaderGradientCanvas
          style={{ width: "100%", height: "100%" }}
          pixelDensity={1}
          fov={40}
          pointerEvents="none"
        >
          <ShaderGradient
            control="props"
            type="waterPlane"
            animate={reducedMotion ? "off" : "on"}
            uSpeed={0.15}
            uStrength={2.2}
            uFrequency={5.5}
            uDensity={1.2}
            color1="#dbeafe"
            color2="#bfdbfe"
            color3="#eff6ff"
            brightness={1.1}
            cDistance={5.2}
            cPolarAngle={90}
            cAzimuthAngle={180}
            reflection={0.1}
            grain="off"
            lightType="3d"
          />
        </ShaderGradientCanvas>
        {/* Wash to keep text contrast solid regardless of the shader's motion */}
        <div className="absolute inset-0 bg-gradient-to-b from-white/40 via-white/70 to-background" />
        <Hero3D />
      </div>

      <div className="mx-auto flex w-full max-w-6xl flex-col items-center px-6 text-center">
        <Reveal>
          <LiquidGlass
            radius={999}
            strength={14}
            chroma={0.15}
            mode="frost"
            className="mb-8 inline-block rounded-full border border-primary/20 shadow-sm"
          >
            <span className="relative z-10 inline-flex items-center gap-2 px-4 py-1.5 text-sm font-medium text-primary">
              <ShieldCheck size={16} strokeWidth={2.25} />
              NRS REV 360 e-invoicing, built in — every invoice IRN-ready
            </span>
          </LiquidGlass>
        </Reveal>

        <Reveal delay={0.08}>
          <h1 className="max-w-4xl font-display text-5xl leading-[1.05] tracking-tight text-foreground sm:text-6xl lg:text-7xl">
            Run your books like a world-class company.
          </h1>
        </Reveal>

        <Reveal delay={0.16}>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground sm:text-xl">
            Full double-entry accounting, payroll, inventory, and Nigerian tax
            compliance — VAT, WHT, PAYE, CIT — in one calm, considered
            platform. Set up in minutes, not months.
          </p>
        </Reveal>

        <Reveal delay={0.24}>
          <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row">
            <Link
              href="/pricing"
              className="group inline-flex items-center gap-2 rounded-full bg-primary px-7 py-3.5 text-base font-semibold text-on-primary shadow-lg shadow-primary/20 transition-transform hover:scale-[1.03] active:scale-[0.98] cursor-pointer"
            >
              Get started free
              <ArrowRight
                size={18}
                className="transition-transform group-hover:translate-x-0.5"
              />
            </Link>
            <a
              href="#demo"
              className="inline-flex items-center gap-2 rounded-full border border-border bg-white/70 px-7 py-3.5 text-base font-semibold text-foreground shadow-sm transition-colors hover:bg-white cursor-pointer"
            >
              <PlayCircle size={18} />
              Book a demo
            </a>
          </div>
        </Reveal>

        <Reveal delay={0.32}>
          <p className="mt-6 text-sm text-muted-foreground">
            No card required to start · Foundation plan includes 2 users
          </p>
        </Reveal>

        <Reveal delay={0.4}>
          <FloatingPreview />
        </Reveal>
      </div>
    </section>
  );
}
