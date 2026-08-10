"use client";

import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import { clsx } from "clsx";
import { useLenis } from "lenis/react";

export function ReviewPhotoStrip({
  photos,
  className,
}: {
  photos: string[];
  className?: string;
}) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const lenis = useLenis();

  const close = useCallback(() => setOpenIndex(null), []);

  // Lenis owns the scroll position, so plain overflow:hidden on the body would
  // not stop it — ask Lenis directly while the lightbox is up.
  useEffect(() => {
    if (openIndex === null) return;
    lenis?.stop();
    return () => lenis?.start();
  }, [openIndex, lenis]);

  useEffect(() => {
    if (openIndex === null) return;

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") close();
      if (e.key === "ArrowRight") setOpenIndex((i) => (i === null ? i : (i + 1) % photos.length));
      if (e.key === "ArrowLeft")
        setOpenIndex((i) => (i === null ? i : (i - 1 + photos.length) % photos.length));
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [openIndex, photos.length, close]);

  if (photos.length === 0) return null;

  return (
    <>
      <ul className={clsx("flex flex-wrap gap-2", className)}>
        {photos.map((photo, i) => (
          <li key={photo}>
            <button
              type="button"
              onClick={() => setOpenIndex(i)}
              aria-label={`View review photo ${i + 1} of ${photos.length}`}
              className="relative block h-16 w-16 overflow-hidden rounded-xl border border-line bg-paper-3 transition-opacity duration-300 hover:opacity-80"
            >
              <Image
                src={photo}
                alt=""
                fill
                sizes="64px"
                className="object-cover"
              />
            </button>
          </li>
        ))}
      </ul>

      {openIndex !== null && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Review photo"
          onClick={close}
          className="fixed inset-0 z-[80] flex items-center justify-center bg-ink/90 p-4"
        >
          <div
            className="relative h-full max-h-[80vh] w-full max-w-3xl"
            onClick={(e) => e.stopPropagation()}
          >
            <Image
              src={photos[openIndex]}
              alt={`Review photo ${openIndex + 1}`}
              fill
              sizes="(min-width: 768px) 768px, 100vw"
              className="object-contain"
            />
          </div>

          <button
            type="button"
            onClick={close}
            aria-label="Close photo"
            className="absolute right-5 top-5 flex h-10 w-10 items-center justify-center rounded-full bg-paper/15 text-lg text-paper transition-colors hover:bg-paper/30"
          >
            &times;
          </button>

          {photos.length > 1 && (
            <p className="absolute bottom-6 left-1/2 -translate-x-1/2 text-xs font-semibold uppercase tracking-[0.14em] text-paper/70">
              {openIndex + 1} / {photos.length}
            </p>
          )}
        </div>
      )}
    </>
  );
}
