"use client";

import Image from "next/image";
import Link from "next/link";
import { useRef, type MouseEvent } from "react";
import {
  motion,
  useInView,
  useMotionValue,
  useScroll,
  useSpring,
  useTransform,
  type MotionValue,
} from "framer-motion";
import { ButtonLink } from "@/components/ui/Button";

const WORD = "SALMAN";

// stepped extrusion (hard, decreasing-opacity offsets) plus a soft blurred cast
// shadow at the end — reads as a chiseled 3D letterform rather than a flat cutout
const LETTER_SHADOW =
  "1px 1px 0 rgba(19,17,16,0.55), 2px 2px 0 rgba(19,17,16,0.45), 3px 3px 0 rgba(19,17,16,0.35), 4px 4px 0 rgba(19,17,16,0.26), 5px 5px 0 rgba(19,17,16,0.18), 7px 8px 18px rgba(19,17,16,0.38)";

const letterVariants = {
  hidden: { y: "110%" },
  visible: (i: number) => ({
    y: "0%",
    transition: {
      duration: 1,
      delay: 0.15 + i * 0.055,
      ease: [0.16, 1, 0.3, 1] as const,
    },
  }),
};

interface BottleDrift {
  /** keyframes are relative offsets from the anchor position, in px, looping back to 0 */
  x: number[];
  y: number[];
  /** keyframes are offsets added to the bottle's base `rotate`, looping back to 0 */
  rotate: number[];
  /** independent loop durations for x / y / rotate so the three never sync up */
  durations: [number, number, number];
}

interface BottleConfig {
  src: string;
  position: string;
  size: string;
  rotate: number;
  entranceDelay: number;
  floatDelay: number;
  parallaxDepth: number;
  drift: BottleDrift;
  /** CSS filter (usually stacked drop-shadow()s) — replaces the old one-size-fits-all shadow */
  filter: string;
  behind?: boolean;
  /** soft blurred radial highlight seeded behind the bottle — reserved for the hero */
  glow?: boolean;
}

// Editorial S-curve: Akhdar opens top-left (near the logo) with generous clear space
// around it, the curve sweeps right to Imperial — the single hero, crowned on the
// wordmark's golden-ratio line and never more than ~12% larger than the others — pivots
// back through Orchid tucked behind the letters as a depth layer, then resolves at
// Oud Lavender on the right edge as a light counterweight. All four share one tilt
// family (kept within ±10°) so the rotations read as rhythm, not scatter, and every
// bottle only grazes a letter's edge rather than covering it.
const BOTTLES: BottleConfig[] = [
  {
    src: "/hero/imperial-cutout.png",
    position: "left-[61.8%] top-[61%] md:top-[58%]",
    size: "w-[8.8vw] max-w-[63px] sm:w-[7.5vw] sm:max-w-none md:w-[7.4vw] lg:w-[5.4vw]",
    rotate: 5,
    entranceDelay: 0.95,
    floatDelay: 1.65,
    parallaxDepth: 14,
    filter:
      "drop-shadow(0 3px 5px rgba(19,17,16,0.4)) drop-shadow(0 10px 22px rgba(169,120,44,0.4)) drop-shadow(0 40px 50px rgba(19,17,16,0.35))",
    glow: true,
    // damped to ~2/3 of the other bottles' amplitude: the same wander reads as calm
    // breathing on a small bottle but as wobble on the 100%-scale foreground hero
    drift: {
      x: [0, 3, -2, 4, -3, 1, 0],
      y: [0, -4, 2, -3, 3, -1, 0],
      rotate: [0, 1, -0.5, 1, -1, 0.5, 0],
      durations: [16, 14, 15],
    },
  },
  {
    src: "/hero/akhdar-cutout.png",
    position: "left-[14%] top-[12%] md:top-[8%]",
    size: "w-[12vw] max-w-[85px] sm:w-[10.1vw] sm:max-w-none md:w-[10.5vw] lg:w-[7.2vw]",
    rotate: -8,
    entranceDelay: 0.7,
    floatDelay: 1.4,
    parallaxDepth: 20,
    filter:
      "drop-shadow(0 3px 5px rgba(19,17,16,0.32)) drop-shadow(0 20px 26px rgba(19,17,16,0.22))",
    behind: true,
    drift: {
      x: [0, 5, -3, 6, -4, 2, 0],
      y: [0, -5, 3, -6, 4, -2, 0],
      rotate: [0, 1.5, -1, 1.5, -1, 1, 0],
      durations: [12, 10, 13],
    },
  },
  {
    src: "/hero/oud-lavender-cutout.png",
    position: "left-[83%] top-[13%] md:top-[20%]",
    size: "w-[11.7vw] max-w-[84px] sm:w-[9.75vw] sm:max-w-none md:w-[10vw] lg:w-[7.2vw]",
    rotate: -7,
    entranceDelay: 1.45,
    floatDelay: 2.15,
    parallaxDepth: 16,
    filter:
      "drop-shadow(0 3px 5px rgba(19,17,16,0.32)) drop-shadow(0 20px 26px rgba(19,17,16,0.22))",
    behind: true,
    drift: {
      x: [0, -5, 3, -6, 4, -2, 0],
      y: [0, 5, -3, 6, -4, 2, 0],
      rotate: [0, -1.5, 1, -1.5, 1, -1, 0],
      durations: [13, 11, 12],
    },
  },
  {
    src: "/hero/orchid-cutout.png",
    position: "left-[36%] md:left-[44%] top-[61%] md:top-[56%]",
    size: "w-[9.3vw] max-w-[66px] sm:w-[7.9vw] sm:max-w-none md:w-[7.75vw] lg:w-[5.6vw]",
    rotate: -7,
    entranceDelay: 1.2,
    floatDelay: 1.9,
    parallaxDepth: 10,
    // thin cool rim-light so it separates from the near-black letter stroke it's tucked behind
    filter:
      "drop-shadow(0 0 6px rgba(255,255,255,0.2)) drop-shadow(0 3px 5px rgba(19,17,16,0.35)) drop-shadow(0 20px 28px rgba(19,17,16,0.34))",
    behind: true,
    drift: {
      x: [0, 4, -3, 5, -3, 2, 0],
      y: [0, -3, 4, -4, 3, -2, 0],
      rotate: [0, 1.5, -1, 1.5, -1, 1, 0],
      durations: [11, 9, 10],
    },
  },
];

function FloatingBottle({
  bottle,
  springX,
  springY,
}: {
  bottle: BottleConfig;
  springX: MotionValue<number>;
  springY: MotionValue<number>;
}) {
  const parallaxX = useTransform(
    springX,
    [-1, 1],
    [-bottle.parallaxDepth, bottle.parallaxDepth],
  );
  const parallaxY = useTransform(
    springY,
    [-1, 1],
    [-bottle.parallaxDepth * 0.6, bottle.parallaxDepth * 0.6],
  );

  const [xDuration, yDuration, rotateDuration] = bottle.drift.durations;

  return (
    <motion.div
      initial={{ opacity: 0, y: -900, rotate: bottle.rotate }}
      animate={{ opacity: 1, y: 0, rotate: 0 }}
      transition={{
        y: {
          type: "spring",
          visualDuration: 0.9,
          bounce: 0.42,
          delay: bottle.entranceDelay,
        },
        rotate: {
          type: "spring",
          visualDuration: 0.9,
          bounce: 0.35,
          delay: bottle.entranceDelay,
        },
        opacity: { duration: 0.4, delay: bottle.entranceDelay, ease: "easeOut" },
      }}
      className={`pointer-events-none absolute aspect-[561/1625] ${bottle.behind ? "-z-10" : "-z-10 md:z-10"} ${bottle.position} ${bottle.size}`}
    >
      {bottle.glow && (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-[-45%] z-[5] rounded-full opacity-70 blur-3xl"
          style={{
            background:
              "radial-gradient(closest-side, rgba(255,196,28,0.35), rgba(255,196,28,0) 70%)",
          }}
        />
      )}
      {/* continuous wander: x, y, and rotate each loop on their own out-of-sync duration
          so the combined path never reads as a simple back-and-forth */}
      <motion.div
        animate={{
          x: bottle.drift.x,
          y: bottle.drift.y,
          rotate: bottle.drift.rotate.map((offset) => bottle.rotate + offset),
        }}
        transition={{
          x: { duration: xDuration, delay: bottle.floatDelay, repeat: Infinity, ease: "easeInOut" },
          y: { duration: yDuration, delay: bottle.floatDelay + 0.3, repeat: Infinity, ease: "easeInOut" },
          rotate: {
            duration: rotateDuration,
            delay: bottle.floatDelay + 0.6,
            repeat: Infinity,
            ease: "easeInOut",
          },
        }}
        className="relative h-full w-full"
      >
        <motion.div style={{ x: parallaxX, y: parallaxY }} className="relative h-full w-full">
          <Image
            src={bottle.src}
            alt=""
            fill
            sizes="170px"
            className="object-contain"
            style={{ filter: bottle.filter }}
          />
        </motion.div>
      </motion.div>
    </motion.div>
  );
}

export function Hero() {
  const sectionRef = useRef<HTMLDivElement>(null);
  // The floating bottles run infinite looped animations behind a stack of
  // drop-shadow filters — expensive on mobile GPUs. Unmounting them once
  // the hero scrolls out of view stops that work completely instead of
  // burning CPU/GPU for the rest of the page's lifetime.
  const isInView = useInView(sectionRef, { amount: 0.1 });

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
  const wordX = useTransform(springX, [-1, 1], [-16, 16]);
  const wordY = useTransform(springY, [-1, 1], [-10, 10]);

  function handlePointerMove(e: MouseEvent<HTMLDivElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    mvX.set(((e.clientX - rect.left) / rect.width) * 2 - 1);
    mvY.set(((e.clientY - rect.top) / rect.height) * 2 - 1);
  }

  function handlePointerLeave() {
    mvX.set(0);
    mvY.set(0);
  }

  return (
    <section
      ref={sectionRef}
      onMouseMove={handlePointerMove}
      onMouseLeave={handlePointerLeave}
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

      {/* giant kinetic wordmark; the four bottles are positioned against this whole
          wrapper (not just the word's own height) so they can trace one continuous
          S-curve from the logo above down to the CTA below */}
      <motion.div
        style={{ scale, opacity, y }}
        className="relative flex flex-1 flex-col items-center justify-center py-6"
      >
        <div className="relative flex w-full items-center justify-center">
          <motion.div
            style={{ x: wordX, y: wordY }}
            className="flex select-none items-center justify-center"
          >
            {WORD.split("").map((char, i) => (
              <span key={i} className="inline-block overflow-hidden leading-none">
                <motion.span
                  custom={i}
                  initial="hidden"
                  animate="visible"
                  variants={letterVariants}
                  whileHover={{ y: -14, color: "var(--color-gold-deep)" }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  style={{ textShadow: LETTER_SHADOW }}
                  className="inline-block font-sans text-[22vw] font-black leading-none tracking-[-0.05em] text-ink sm:text-[19vw] md:text-[17vw] lg:text-[15vw]"
                >
                  {char}
                </motion.span>
              </span>
            ))}
          </motion.div>
        </div>

        {isInView &&
          BOTTLES.map((bottle) => (
            <FloatingBottle
              key={bottle.src}
              bottle={bottle}
              springX={springX}
              springY={springY}
            />
          ))}
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
