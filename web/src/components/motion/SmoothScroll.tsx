"use client";

import { ReactLenis } from "lenis/react";
import type { ReactNode } from "react";

export function SmoothScroll({ children }: { children: ReactNode }) {
  return (
    <ReactLenis
      root
      options={{
        lerp: 0.11,
        smoothWheel: true,
        wheelMultiplier: 1,
        touchMultiplier: 1.15,
      }}
    >
      {children}
    </ReactLenis>
  );
}
