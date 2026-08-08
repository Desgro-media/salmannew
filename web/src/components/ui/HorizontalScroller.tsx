"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { clsx } from "clsx";

export function HorizontalScroller({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  function updateScrollState() {
    const el = ref.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 4);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 4);
  }

  useEffect(() => {
    updateScrollState();
    window.addEventListener("resize", updateScrollState);
    return () => window.removeEventListener("resize", updateScrollState);
  }, []);

  function scrollByAmount(direction: 1 | -1) {
    ref.current?.scrollBy({ left: direction * ref.current.clientWidth * 0.85, behavior: "smooth" });
  }

  return (
    <div className="relative">
      <div
        ref={ref}
        data-lenis-prevent
        onScroll={updateScrollState}
        className={clsx(
          "no-scrollbar flex gap-5 overflow-x-auto overflow-y-hidden pb-4",
          className,
        )}
      >
        {children}
      </div>

      {canScrollLeft && (
        <button
          type="button"
          onClick={() => scrollByAmount(-1)}
          aria-label="Scroll left"
          className="absolute left-0 top-32 z-20 hidden h-11 w-11 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-line bg-paper text-ink shadow-[0_8px_20px_rgba(19,17,16,0.12)] transition-colors duration-300 hover:border-ink hover:bg-ink hover:text-paper md:flex"
        >
          ←
        </button>
      )}
      {canScrollRight && (
        <button
          type="button"
          onClick={() => scrollByAmount(1)}
          aria-label="Scroll right"
          className="absolute right-0 top-32 z-20 hidden h-11 w-11 translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-line bg-paper text-ink shadow-[0_8px_20px_rgba(19,17,16,0.12)] transition-colors duration-300 hover:border-ink hover:bg-ink hover:text-paper md:flex"
        >
          →
        </button>
      )}
    </div>
  );
}
