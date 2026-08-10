"use client";

import { ReactLenis } from "lenis/react";
import { useEffect, useState, type ReactNode } from "react";

export function SmoothScroll({ children }: { children: ReactNode }) {
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const apply = () => setReducedMotion(query.matches);
    apply();
    query.addEventListener("change", apply);
    return () => query.removeEventListener("change", apply);
  }, []);

  return (
    // ReactLenis rebuilds only the Lenis instance when these options change —
    // the children stay mounted — so it is safe to flip them after hydration.
    // With smoothWheel off, Lenis hands the wheel straight back to the browser.
    <ReactLenis
      root
      options={{
        // 0.11 meant the viewport was still ~11% per frame behind the target,
        // which on a Mac trackpad fights the OS's own momentum and reads as
        // input lag rather than smoothness. 0.16 tracks the finger closely
        // while keeping the eased feel.
        lerp: reducedMotion ? 1 : 0.16,
        smoothWheel: !reducedMotion,
        wheelMultiplier: 1,
        touchMultiplier: 1.15,
      }}
    >
      {children}
    </ReactLenis>
  );
}
