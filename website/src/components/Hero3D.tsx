"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { useRef } from "react";
import type { Group } from "three";
import { usePrefersReducedMotion } from "@/lib/usePrefersReducedMotion";

function FloatingShapes({ spin }: { spin: boolean }) {
  const group = useRef<Group>(null);

  useFrame((_, delta) => {
    if (!spin || !group.current) return;
    group.current.rotation.y += delta * 0.12;
    group.current.rotation.x += delta * 0.05;
  });

  return (
    <group ref={group}>
      {/* Corner accents only — kept well outside the centered text column
          (roughly |x| > 2.2 at this camera distance/fov) and away from the
          nav band at the top, so the shapes read as ambient depth, never as
          something occluding copy. */}
      <mesh position={[4.4, 1.8, -1.4]} scale={0.85}>
        <torusGeometry args={[0.5, 0.13, 32, 64]} />
        <meshStandardMaterial
          color="#2563eb"
          transparent
          opacity={0.18}
          roughness={0.3}
          metalness={0.1}
          depthWrite={false}
        />
      </mesh>
      <mesh position={[-4.5, -1.9, -1.6]} scale={0.75}>
        <icosahedronGeometry args={[0.4, 0]} />
        <meshStandardMaterial
          color="#60a5fa"
          transparent
          opacity={0.16}
          roughness={0.4}
          depthWrite={false}
        />
      </mesh>
      <mesh position={[4.1, -1.9, -1.2]} scale={0.6}>
        <sphereGeometry args={[0.22, 32, 32]} />
        <meshStandardMaterial color="#93c5fd" transparent opacity={0.22} depthWrite={false} />
      </mesh>
    </group>
  );
}

/**
 * Ambient decorative 3D layer for the hero — a few slowly tumbling, low-opacity
 * primitives in the brand's trust-blue family, giving the section real depth
 * instead of a flat gradient. Purely atmospheric (aria-hidden, pointer-events
 * disabled): it never carries information the copy doesn't already state.
 * Hidden below `md` since there's no spare width for it on small screens, and
 * frozen to a still frame under prefers-reduced-motion, matching the
 * shader-gradient background's behavior.
 */
export function Hero3D() {
  const reducedMotion = usePrefersReducedMotion();

  return (
    <div
      className="pointer-events-none absolute inset-0 hidden md:block"
      aria-hidden="true"
    >
      <Canvas
        camera={{ position: [0, 0, 4], fov: 45 }}
        dpr={[1, 1.5]}
        gl={{ alpha: true, antialias: true }}
      >
        <ambientLight intensity={1.1} />
        <directionalLight position={[2, 2, 2]} intensity={0.4} />
        <FloatingShapes spin={!reducedMotion} />
      </Canvas>
    </div>
  );
}
