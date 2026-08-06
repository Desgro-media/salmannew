import Image from "next/image";
import { Reveal } from "@/components/motion/Reveal";
import { ButtonLink } from "@/components/ui/Button";
import { HorizontalScroller } from "@/components/ui/HorizontalScroller";
import { ReelCard } from "@/components/home/ReelCard";

const INSTAGRAM_PROFILE =
  "https://www.instagram.com/salman.perfumes_?utm_source=ig_web_button_share_sheet&igsh=ZDNlZDc0MzIxNw==";

const REELS = [
  { src: "/reels/1.mp4", href: "https://www.instagram.com/reels/DWf0V0vEezB/" },
  { src: "/reels/2.mp4", href: "https://www.instagram.com/reels/DQ1EHpnkf6k/" },
  { src: "/reels/3.mp4", href: "https://www.instagram.com/reels/DVyGKvXke4v/" },
];

export function InstagramReels() {
  return (
    <section className="container-grid py-16 sm:py-24 md:py-32">
      <div className="flex flex-col items-start justify-between gap-6 border-b border-line pb-8 sm:flex-row sm:items-end">
        <Reveal>
          <p className="eyebrow text-ink-soft">01 — On Instagram</p>
          <h2 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl md:text-6xl">
            Worn, Not Just Told
          </h2>
        </Reveal>
        <Reveal delay={0.1}>
          <a
            href={INSTAGRAM_PROFILE}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] hover:text-gold-ink"
          >
            <InstagramIcon />
            @salman.perfumes_
          </a>
        </Reveal>
      </div>

      <div className="mt-10 sm:mt-14">
        <HorizontalScroller className="sm:grid sm:grid-cols-3 sm:overflow-visible">
          {REELS.map((reel, i) => (
            <Reveal
              key={reel.src}
              delay={i * 0.08}
              className="w-[58vw] max-w-[230px] shrink-0 sm:w-auto sm:max-w-none"
            >
              <ReelCard src={reel.src} href={reel.href} />
            </Reveal>
          ))}
        </HorizontalScroller>
      </div>

      <Reveal delay={0.15}>
        <div className="relative mt-20 aspect-[21/9] w-full overflow-hidden bg-ink">
          <Image
            src="/logo/mark-gold-transparent.png"
            alt=""
            fill
            className="object-contain p-6 opacity-90 sm:p-12 md:p-24"
          />
        </div>
      </Reveal>

      <div className="mt-10 flex justify-center">
        <ButtonLink href="/shop">Shop Now</ButtonLink>
      </div>
    </section>
  );
}

function InstagramIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect x="3" y="3" width="18" height="18" rx="5" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="17.2" cy="6.8" r="1" fill="currentColor" />
    </svg>
  );
}
