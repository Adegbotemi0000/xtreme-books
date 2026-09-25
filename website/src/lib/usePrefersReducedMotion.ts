"use client";

import { useEffect, useState } from "react";

/**
 * The shader gradient runs on a WebGL render loop, not a CSS animation, so
 * neither the global `prefers-reduced-motion` CSS rule nor framer-motion's
 * `MotionConfig` touches it — it needs its own check (HIG accessibility:
 * motion must be optional, never the only carrier of meaning).
 */
function getInitial() {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(getInitial);

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const listener = (e: MediaQueryListEvent) => setReduced(e.matches);
    query.addEventListener("change", listener);
    return () => query.removeEventListener("change", listener);
  }, []);

  return reduced;
}
