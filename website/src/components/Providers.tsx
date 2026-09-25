"use client";

import { MotionConfig } from "framer-motion";
import type { ReactNode } from "react";

/**
 * `reducedMotion="user"` makes every framer-motion animation in the tree
 * respect `prefers-reduced-motion` automatically (snapping instead of
 * animating) — the checklist item every design-system search result surfaces.
 */
export function Providers({ children }: { children: ReactNode }) {
  return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}
