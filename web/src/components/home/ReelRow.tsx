"use client";

import { useState } from "react";
import { Reveal } from "@/components/motion/Reveal";
import { HorizontalScroller } from "@/components/ui/HorizontalScroller";
import { ReelCard } from "@/components/home/ReelCard";

export interface Reel {
  src: string;
  href: string;
}

// The three reels sit side by side, so the previous "play whatever is on
// screen" rule started all three at once — three simultaneous H.264 decodes
// and, worse, three concurrent video downloads competing for bandwidth the
// moment the section scrolled into view. Holding a single active index caps
// that at one.
export function ReelRow({ reels }: { reels: Reel[] }) {
  const [activeIndex, setActiveIndex] = useState(0);

  return (
    <HorizontalScroller className="sm:grid sm:grid-cols-3 sm:overflow-visible">
      {reels.map((reel, i) => (
        <Reveal
          key={reel.src}
          delay={i * 0.08}
          className="w-[42vw] max-w-[180px] shrink-0 sm:w-auto sm:max-w-none"
        >
          <ReelCard
            src={reel.src}
            href={reel.href}
            active={i === activeIndex}
            onActivate={() => setActiveIndex(i)}
          />
        </Reveal>
      ))}
    </HorizontalScroller>
  );
}
