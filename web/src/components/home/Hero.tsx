"use client";

import Link from "next/link";
import { useRef, type MouseEvent } from "react";
import {
  motion,
  useMotionValue,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
} from "framer-motion";
import { ButtonLink } from "@/components/ui/Button";
import { MARK_ASPECT, MARK_PATH, MARK_TRANSFORM, MARK_VIEWBOX } from "./mark-path";

const MARK_ID = "salman-hero-mark";
const MARK_FACE_GRADIENT_ID = "salman-hero-mark-face";

// The extruded side wall: copies of the mark stepping back in Z, darkening from
// the lit face into shadow. Eight is enough to read as one solid body because
// consecutive slices sit 6px apart, and at the ±12° we allow that is ~1.2px of
// lateral shift — far narrower than the thinnest stroke in the calligraphy, so
// they overlap instead of separating into visible plates.
//
// The ramp holds its hue near 38deg and stays saturated all the way down, so it
// darkens through bronze. Letting saturation fall away instead — which is what
// a naive lightness ramp does — turns the deep slices olive, and the whole mark
// reads as dirty brass rather than gold.
const DEPTH_SLICES = [
  { z: -6, fill: "#eeb015" },
  { z: -12, fill: "#dda012" },
  { z: -18, fill: "#cc9010" },
  { z: -24, fill: "#ba800e" },
  { z: -30, fill: "#a8710c" },
  { z: -36, fill: "#96620a" },
  { z: -42, fill: "#845408" },
  { z: -48, fill: "#734706" },
];

// Metal is only legible as metal when its surface varies: a flat fill reads as
// a sticker no matter how good the extrusion behind it is. This runs a
// highlight down through the core gold into a deeper edge, lit from the upper
// left to agree with the shadow the slices cast to the lower right.
const FACE_STOPS = [
  { offset: "0%", color: "#ffe89a" },
  { offset: "22%", color: "#ffd23c" },
  { offset: "48%", color: "#f9ba12" },
  { offset: "78%", color: "#dd9d0b" },
  { offset: "100%", color: "#b87d05" },
];

export function Hero() {
  const sectionRef = useRef<HTMLDivElement>(null);
  // Cached on hover instead of read per mousemove: getBoundingClientRect()
  // forces a synchronous layout, and doing that on every pointer event is the
  // one thing in this section that can stall a frame on a slow device.
  const rectRef = useRef<DOMRect | null>(null);
  const reduceMotion = useReducedMotion();

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end start"],
  });
  const scale = useTransform(scrollYProgress, [0, 1], [1, 0.88]);
  const opacity = useTransform(scrollYProgress, [0, 1], [1, 0.25]);
  const y = useTransform(scrollYProgress, [0, 1], [0, 60]);

  const mvX = useMotionValue(0);
  const mvY = useMotionValue(0);
  const springX = useSpring(mvX, { stiffness: 60, damping: 18, mass: 0.6 });
  const springY = useSpring(mvY, { stiffness: 60, damping: 18, mass: 0.6 });
  // Drift with the cursor. The throw was deliberately short while the mark sat
  // behind the wordmark and only had to suggest depth against it; now that it
  // is alone on the page there is nothing to be parallax *against*, so it
  // follows the cursor directly and a little further.
  const markX = useTransform(springX, [-1, 1], [-14, 14]);
  const markY = useTransform(springY, [-1, 1], [-10, 10]);
  // Turning to face the cursor: moving right swings the left edge forward, and
  // moving down brings the top forward. Kept to ±12/±9 so the extrusion is
  // revealed along one side without the mark ever reading as a flat card that
  // has been knocked over.
  const tiltY = useTransform(springX, [-1, 1], [-12, 12]);
  const tiltX = useTransform(springY, [-1, 1], [9, -9]);

  function handleMouseEnter(e: MouseEvent<HTMLDivElement>) {
    rectRef.current = e.currentTarget.getBoundingClientRect();
  }

  function handleMouseMove(e: MouseEvent<HTMLDivElement>) {
    const rect = rectRef.current ?? e.currentTarget.getBoundingClientRect();
    mvX.set(((e.clientX - rect.left) / rect.width) * 2 - 1);
    mvY.set(((e.clientY - rect.top) / rect.height) * 2 - 1);
  }

  function handleMouseLeave() {
    rectRef.current = null;
    mvX.set(0);
    mvY.set(0);
  }

  return (
    <section
      ref={sectionRef}
      onMouseEnter={handleMouseEnter}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="relative flex min-h-[100svh] flex-col justify-between overflow-hidden pt-24 pb-8 md:pt-28 md:pb-10"
    >
      {/* top-left eyebrow */}
      <div className="container-grid flex items-start justify-between">
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="max-w-[9rem] text-[11px] font-medium uppercase leading-[1.5] tracking-[0.2em] text-ink-soft sm:max-w-none sm:text-xs"
        >
          Scent
          <br />
          that moves
          <br />
          with you.
        </motion.p>

        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1 }}
          className="eyebrow text-right text-ink-soft"
        >
          Salman Perfumes
          <br />
          Eau de Parfum
        </motion.p>
      </div>

      {/* The brand mark, alone. This wrapper is scroll-scaled, and scaling
          vector artwork re-rasterises it at each new size — expensive at this
          scale, and 4x worse on a Retina display, which is why the page used to
          feel heavy there specifically. will-change keeps the whole group on its
          own composited layer so the scroll transform is a cheap matrix change
          instead. */}
      <motion.div
        style={{ scale, opacity, y, willChange: "transform, opacity" }}
        className="relative flex flex-1 flex-col items-center justify-center py-6"
      >
        {/* Flex-centred rather than translate-centred so Framer Motion owns
            `transform` outright and nothing fights it for the property.

            Three nested layers because each owns a different transform with its
            own lifetime — pointer parallax, a one-shot entrance, and the idle
            loop. Stacking them beats trying to reconcile all three on one
            element, and every one animates transform/opacity only, so this
            whole thing lives on the compositor. */}
        {/* Taken out of flow deliberately. In flow the mark's own height pushes
            the bottom row (Shop Now / Explore Collection) below the fold on a
            laptop; centred as an overlay it can be as large as it likes while
            the section's justify-between still pins that row to the bottom of
            the viewport. */}
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          {/* Geometry is declared once and every slice below is a <use> of it,
              so the ~10KB of path data is paid for a single time no matter how
              deep the extrusion gets. */}
          <svg width="0" height="0" className="absolute" aria-hidden focusable="false">
            <defs>
              {/* evenodd carries over from the source — the calligraphy's
                  counters are holes in the same compound path, and the default
                  nonzero rule would fill them in solid. */}
              <path id={MARK_ID} transform={MARK_TRANSFORM} fillRule="evenodd" d={MARK_PATH} />
              {/* Angled rather than straight down so the highlight runs across
                  the strokes instead of along them. */}
              <linearGradient id={MARK_FACE_GRADIENT_ID} x1="0" y1="0" x2="0.35" y2="1">
                {FACE_STOPS.map((stop) => (
                  <stop key={stop.offset} offset={stop.offset} stopColor={stop.color} />
                ))}
              </linearGradient>
            </defs>
          </svg>

          {/* L1 — parallax, sizing, and the group's fade-in. This is also where
              `perspective` lives: putting it here rather than deeper means the
              group opacity below can sit on this element without collapsing the
              3D context, because L1 itself is flat and only its descendants
              preserve depth. */}
          <motion.div
            role="img"
            aria-label="Salman Perfumes"
            initial={reduceMotion ? false : { opacity: 0, scale: 1.06 }}
            // Fully opaque now. The 0.85 was there to stop the mark competing
            // with the wordmark sitting on top of it; with nothing in front of
            // it, holding it back only greys the gold against the white ground.
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1.3, ease: [0.16, 1, 0.3, 1] }}
            style={{
              x: markX,
              y: markY,
              aspectRatio: MARK_ASPECT,
              perspective: "1100px",
              willChange: "transform, opacity",
            }}
            // Sized off viewport height rather than width: the mark is tall and
            // narrow, so height is what decides whether it clears the eyebrow
            // row above and the buttons below. Sizing it by width would swallow
            // both on a narrow phone.
            className="relative h-[44vh] max-h-[500px] sm:h-[58vh] sm:max-h-[700px] lg:h-[70vh] lg:max-h-[840px]"
          >
            {/* Bloom sits outside the 3D group on purpose — it carries a 48px
                blur, and a blurred layer inside a preserved-3d context gets
                re-rasterised as the group turns. Out here it is a flat glow that
                only ever animates opacity, which the compositor handles free. */}
            <motion.div
              animate={reduceMotion ? undefined : { opacity: [0.6, 1, 0.6] }}
              transition={{ duration: 5.5, repeat: Infinity, ease: "easeInOut" }}
              className="absolute inset-[-30%] rounded-full blur-3xl"
              style={{
                background:
                  "radial-gradient(closest-side, rgba(255,196,28,0.32), rgba(255,196,28,0) 70%)",
                willChange: "opacity",
              }}
            />

            {/* L2 — idle drift. Durations are deliberately non-harmonic so the
                four cycles never come back into phase; the mark breathes rather
                than ticks. The slow rotateY sway is what keeps the extrusion
                readable on touch devices, where there is no cursor to tilt it. */}
            <motion.div
              animate={
                reduceMotion
                  ? undefined
                  : {
                      scale: [1, 1.04, 1],
                      y: [0, -12, 0],
                      rotate: [0, 1.1, 0, -1.1, 0],
                      rotateY: [0, 9, 0, -9, 0],
                    }
              }
              transition={{
                scale: { duration: 7, repeat: Infinity, ease: "easeInOut" },
                y: { duration: 9, repeat: Infinity, ease: "easeInOut" },
                rotate: { duration: 13, repeat: Infinity, ease: "easeInOut" },
                rotateY: { duration: 17, repeat: Infinity, ease: "easeInOut" },
              }}
              style={{ transformStyle: "preserve-3d", willChange: "transform" }}
              className="relative h-full w-full"
            >
              {/* L3 — the cursor tilt, kept on its own element so it composes
                  with the sway above instead of fighting it for rotateY. */}
              <motion.div
                style={{
                  rotateX: reduceMotion ? 0 : tiltX,
                  rotateY: reduceMotion ? 0 : tiltY,
                  transformStyle: "preserve-3d",
                  willChange: "transform",
                }}
                className="relative h-full w-full"
              >
                {DEPTH_SLICES.map((slice) => (
                  <svg
                    key={slice.z}
                    viewBox={MARK_VIEWBOX}
                    className="absolute inset-0 h-full w-full"
                    style={{ transform: `translateZ(${slice.z}px)` }}
                    aria-hidden
                    focusable="false"
                  >
                    <use href={`#${MARK_ID}`} fill={slice.fill} />
                  </svg>
                ))}
                {/* the lit face, sitting at the front of the stack */}
                <svg
                  viewBox={MARK_VIEWBOX}
                  className="absolute inset-0 h-full w-full"
                  aria-hidden
                  focusable="false"
                >
                  <use href={`#${MARK_ID}`} fill={`url(#${MARK_FACE_GRADIENT_ID})`} />
                </svg>
              </motion.div>
            </motion.div>
          </motion.div>
        </div>

      </motion.div>

      {/* bottom row */}
      <div className="container-grid flex flex-col gap-8 sm:flex-row sm:items-end sm:justify-between">
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 1.1 }}
          className="flex flex-wrap items-center gap-5"
        >
          <ButtonLink href="/shop">Shop Now</ButtonLink>
          <Link
            href="/shop"
            className="group inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em]"
          >
            Explore Collection
            <span className="transition-transform duration-300 group-hover:translate-x-1">
              →
            </span>
          </Link>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 1.2 }}
          className="text-left sm:text-right"
        >
          <p className="text-sm font-semibold">Six Signature Scents</p>
          <p className="text-sm text-ink-soft">Eau de Parfum — 2026</p>
        </motion.div>
      </div>
    </section>
  );
}
