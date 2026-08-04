"use client";

import Image from "next/image";
import Link from "next/link";
import { useRef, type MouseEvent } from "react";
import {
  motion,
  useMotionValue,
  useScroll,
  useSpring,
  useTransform,
  type MotionValue,
} from "framer-motion";
import { ButtonLink } from "@/components/ui/Button";

const WORD = "SALMAN";

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

interface BottleConfig {
  src: string;
  position: string;
  size: string;
  rotate: number;
  entranceDelay: number;
  floatDuration: number;
  floatDelay: number;
  parallaxDepth: number;
  behind?: boolean;
}

const BOTTLES: BottleConfig[] = [
  {
    src: "/hero/imperial-cutout.png",
    position: "left-[27%] top-[-6%] sm:left-[32%] sm:top-[0%] md:left-[35%] lg:left-[37%]",
    size: "w-[14vw] max-w-[96px] sm:w-[14vw] sm:max-w-none md:w-[10.5vw] lg:w-[8vw]",
    rotate: -6,
    entranceDelay: 0.7,
    floatDuration: 5,
    floatDelay: 1.4,
    parallaxDepth: 18,
  },
  {
    src: "/hero/orchid-cutout.png",
    position: "left-[53%] inset-y-[6%] sm:left-[55%] md:left-[56%] lg:left-[57%]",
    size: "w-[16vw] max-w-[108px] sm:w-[15vw] sm:max-w-none md:w-[11.5vw] lg:w-[9vw]",
    rotate: 5,
    entranceDelay: 0.85,
    floatDuration: 4.4,
    floatDelay: 1.5,
    parallaxDepth: 12,
    behind: true,
  },
  {
    src: "/hero/akhdar-cutout.png",
    position: "left-[5%] bottom-[14%] sm:left-[1%] sm:bottom-[8%] md:left-[4%] lg:left-[7%]",
    size: "w-[14vw] max-w-[96px] sm:w-[14.5vw] sm:max-w-none md:w-[11vw] lg:w-[8.5vw]",
    rotate: 4,
    entranceDelay: 1.0,
    floatDuration: 4.8,
    floatDelay: 1.6,
    parallaxDepth: 22,
  },
  {
    src: "/hero/oud-lavender-cutout.png",
    position: "right-[5%] bottom-[11%] sm:right-[1%] sm:bottom-[5%] md:right-[4%] lg:right-[7%]",
    size: "w-[14vw] max-w-[96px] sm:w-[14.5vw] sm:max-w-none md:w-[11vw] lg:w-[8.5vw]",
    rotate: -4,
    entranceDelay: 1.15,
    floatDuration: 5.3,
    floatDelay: 1.7,
    parallaxDepth: 14,
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

  return (
    <motion.div
      initial={{ opacity: 0, y: 30, rotate: bottle.rotate }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 1,
        delay: bottle.entranceDelay,
        ease: [0.16, 1, 0.3, 1],
      }}
      className={`pointer-events-none absolute aspect-[561/1625] ${bottle.behind ? "-z-10" : "z-10"} ${bottle.position} ${bottle.size}`}
    >
      <motion.div
        style={{ x: parallaxX, y: parallaxY }}
        animate={{
          y: [0, -10, 0],
          rotate: [bottle.rotate, bottle.rotate + 4, bottle.rotate],
        }}
        transition={{
          duration: bottle.floatDuration,
          delay: bottle.floatDelay,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="relative h-full w-full"
      >
        <Image
          src={bottle.src}
          alt=""
          fill
          sizes="130px"
          className="object-contain drop-shadow-[0_25px_30px_rgba(19,17,16,0.3)]"
        />
      </motion.div>
    </motion.div>
  );
}

export function Hero() {
  const sectionRef = useRef<HTMLDivElement>(null);

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

      {/* giant kinetic wordmark, four scents floating around it */}
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
                  className="inline-block font-sans text-[22vw] font-black leading-none tracking-[-0.05em] text-ink sm:text-[19vw] md:text-[17vw] lg:text-[15vw]"
                >
                  {char}
                </motion.span>
              </span>
            ))}
          </motion.div>

          {BOTTLES.map((bottle) => (
            <FloatingBottle
              key={bottle.src}
              bottle={bottle}
              springX={springX}
              springY={springY}
            />
          ))}
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
