"use client";

import Image from "next/image";
import { type CSSProperties } from "react";
import { clsx } from "clsx";
import { motion, AnimatePresence } from "framer-motion";
import { useProductSelection } from "@/lib/product-selection-context";

export function ProductGallery({
  images,
  name,
  accent,
}: {
  images: string[];
  name: string;
  accent: string;
}) {
  const { activeIndex, setActiveIndex } = useProductSelection();
  const active = Math.min(activeIndex, images.length - 1);

  return (
    <div
      style={{ "--accent": accent } as CSSProperties}
      className="flex flex-col-reverse gap-4 md:flex-row"
    >
      {images.length > 1 && (
        <div className="flex gap-3 md:flex-col">
          {images.map((src, i) => (
            <button
              key={src}
              onClick={() => setActiveIndex(i)}
              className={clsx(
                "relative h-20 w-16 shrink-0 overflow-hidden rounded-2xl bg-paper-2 transition-all duration-300 md:h-24 md:w-20",
                active === i
                  ? "opacity-100 ring-2 ring-[var(--accent)] ring-offset-2 ring-offset-paper"
                  : "opacity-50 hover:opacity-80",
              )}
            >
              <Image src={src} alt="" fill sizes="80px" className="object-cover" />
            </button>
          ))}
        </div>
      )}

      <div className="relative flex-1 overflow-hidden rounded-[32px] bg-paper-2 p-3 md:p-4">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-60"
          style={{
            background: "radial-gradient(120% 90% at 50% 8%, var(--accent) 0%, transparent 65%)",
          }}
        />
        <div className="relative aspect-[4/5] w-full overflow-hidden rounded-[22px]">
          <AnimatePresence mode="wait">
            <motion.div
              key={active}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.35 }}
              className="absolute inset-0"
            >
              <Image
                src={images[active]}
                alt={name}
                fill
                priority
                sizes="(min-width: 768px) 45vw, 100vw"
                className="object-cover"
              />
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
