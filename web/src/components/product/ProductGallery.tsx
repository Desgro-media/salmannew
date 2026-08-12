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
      // Capped rather than left to fill its column: the source photos are 2:3,
      // so at seven of twelve columns this panel was rendering around 800px
      // wide and a thousand tall on a large screen — the bottle ended up bigger
      // on the page than it is in life. The cap holds it to a plate the buying
      // controls beside it can hold their own against.
      className="mx-auto flex w-full flex-col-reverse gap-4 md:max-w-[400px] md:flex-row lg:max-w-[440px]"
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

      {/* The plate takes the photos' own 2:3 shape, which is the only way to
          avoid both faults at once: crop the photo into a different ratio and
          the bottle reads as zoomed in, letterbox it and the photo's own edges
          show up as a rectangle inside the plate. Matching the ratio means the
          shot fills the plate exactly — nothing cropped, no seam.

          Nothing is layered over the photo for the same reason. There was an
          accent wash and an inset vignette here to blend the old cropped shot
          into the plate around it; with the photo running edge to edge they had
          nothing left to blend, and on a white plate the wash was drawing a
          grey rim around dark-accented products like Orchid. */}
      <div
        className="relative flex-1 overflow-hidden rounded-[32px] border-2 bg-well"
        style={{ borderColor: `${accent}66` }}
      >
        <div className="relative aspect-[2/3] w-full">
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
                sizes="(min-width: 768px) 420px, 100vw"
                className="object-cover"
              />
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
