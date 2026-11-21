"use client";

import Image, { getImageProps } from "next/image";
import { useState, type CSSProperties, type SyntheticEvent } from "react";
import { clsx } from "clsx";
import { motion, AnimatePresence } from "framer-motion";
import { useProductSelection } from "@/lib/product-selection-context";

// A photo's own outermost pixel columns, stretched sideways to fill one margin
// of the square plate. Each row of the margin is then exactly the colour the
// photo ends on at that height, so there is no seam where the photo starts —
// the studio backdrop just carries on, and a notes sheet carries on as plain
// cream.
//
// Done as a CSS background, not a second <img>, so only the sliver that shows
// is painted, and from a 64px-wide optimised copy rather than the full-size
// file: the outermost column of a 64px copy is all it ever uses.
//
// The scale is set so that column is wider than the whole margin: the margin
// then shows that one column, not columns a few percent further in. That
// matters most at the top and bottom corners, where a studio backdrop's
// vignette changes fastest, and sampling even 3% in leaves a visible edge.
//
// Stretched straight, a busy edge (the out-of-focus plants on a lifestyle shot)
// comes out as hard horizontal bands, so it is blurred. The blur sits on an
// inner layer pushed 24px past the clipped box on every side: a blur fades
// whatever it touches toward transparent at its own boundary, and out there the
// fade is clipped away instead of lightening the plate's outer edge. The picture
// inside is held to the plate's own height (24px in from the top and bottom) so
// each row of margin still lines up with the same row of the photo.
function EdgeFill({ src, side }: { src: string; side: "left" | "right" }) {
  const { props } = getImageProps({ src, alt: "", width: 32, height: 48 });
  return (
    <div
      aria-hidden
      className={clsx(
        "pointer-events-none absolute inset-y-0 w-[30%] overflow-hidden",
        side === "left" ? "left-0" : "right-0",
      )}
    >
      <div
        className="absolute -inset-6 blur-md"
        style={{
          backgroundImage: `url("${props.src}")`,
          // 6000% of this layer, so the photo's outermost column (1/64 of it) is
          // about 140px wide: past the join with the photo, which is ~83px in.
          backgroundSize: "6000% calc(100% - 48px)",
          backgroundPosition: `${side} 0 top 24px`,
          backgroundRepeat: "no-repeat",
        }}
      />
    </div>
  );
}

export function ProductGallery({
  images,
  name,
  accent,
  sizeCount,
}: {
  images: string[];
  name: string;
  accent: string;
  // images[i] pairs with sizes[i] for the first sizeCount photos; anything after
  // that is an extra (lifestyle scene, notes sheet) with no size attached.
  sizeCount: number;
}) {
  const { activeIndex, setActiveIndex, extraIndex, setExtraIndex } = useProductSelection();
  const active = extraIndex ?? Math.min(activeIndex, images.length - 1);

  // The edge fill only makes sense for a portrait photo, which leaves a margin
  // at each side of the square. A square or landscape upload has none to fill
  // (a landscape one letterboxes top and bottom instead), so there it is left
  // off. Portrait until the photo says otherwise — every bundled photo is.
  const [portrait, setPortrait] = useState(true);
  const measure = (e: SyntheticEvent<HTMLImageElement>) =>
    setPortrait(e.currentTarget.naturalWidth < e.currentTarget.naturalHeight);

  return (
    <div
      style={{ "--accent": accent } as CSSProperties}
      // Capped rather than left to fill its column, so on a large screen the
      // plate stays one the buying controls beside it can hold their own
      // against, instead of growing to the full width of its seven columns.
      // `md:items-start` keeps the plate its own square height even if the
      // thumbnail column beside it ever runs taller, rather than stretching to it.
      className="mx-auto flex w-full flex-col-reverse gap-4 md:max-w-[400px] md:flex-row md:items-start lg:max-w-[440px]"
    >
      {images.length > 1 && (
        <div className="flex gap-3 md:flex-col">
          {images.map((src, i) => (
            <button
              key={src}
              onClick={() => (i < sizeCount ? setActiveIndex(i) : setExtraIndex(i))}
              className={clsx(
                "relative h-16 w-16 shrink-0 overflow-hidden rounded-2xl bg-paper-2 transition-all duration-300 md:h-[72px] md:w-[72px]",
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

      {/* A square plate around photos that are 2:3 portrait (the notes sheets
          are 3:4). Squaring a portrait photo has two obvious ways to go wrong:
          crop it to the square and the bottle's cap and base are cut off (and
          the notes sheets lose the top and bottom of their text), or letterbox it
          on a flat plate and the photo's own grey studio backdrop shows up as a
          rectangle inside it.

          So the photo is shown whole, and its own edge columns are carried out
          into the two side margins (see EdgeFill), so the margins pick up
          exactly where the photo leaves off. A blurred or stretched copy of the
          whole photo was tried first and does not work: it is lighter than the
          photo's vignetted edge, so the rectangle shows through anyway. */}
      <div
        className="relative flex-1 overflow-hidden rounded-[32px] border-2 bg-well"
        style={{ borderColor: `${accent}66` }}
      >
        <div className="relative aspect-square w-full">
          <AnimatePresence mode="wait">
            <motion.div
              key={active}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.35 }}
              className="absolute inset-0"
            >
              {portrait && (
                <>
                  <EdgeFill src={images[active]} side="left" />
                  <EdgeFill src={images[active]} side="right" />
                </>
              )}
              <Image
                src={images[active]}
                alt={name}
                fill
                priority
                sizes="(min-width: 768px) 420px, 100vw"
                className="object-contain"
                onLoad={measure}
                // A photo already loaded when React attaches (the server-rendered
                // first one, from cache) never fires onLoad, so read it here too.
                ref={(el) => {
                  if (el?.complete && el.naturalWidth) setPortrait(el.naturalWidth < el.naturalHeight);
                }}
              />
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
