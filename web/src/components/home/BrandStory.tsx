import Image from "next/image";
import { Reveal } from "@/components/motion/Reveal";

export function BrandStory() {
  return (
    <section className="container-grid py-24 md:py-32">
      <div className="grid grid-cols-1 gap-10 md:grid-cols-12">
        <Reveal className="md:col-span-3">
          <p className="eyebrow text-ink-soft">01 — Philosophy</p>
        </Reveal>

        <div className="md:col-span-8 md:col-start-5">
          <Reveal>
            <p className="text-3xl font-medium leading-snug tracking-tight md:text-5xl">
              We build one accord at a time — no forty-note fantasy lists,
              no filler. If it&rsquo;s on the bottle, you can smell it.
            </p>
          </Reveal>
          <Reveal delay={0.1}>
            <p className="mt-8 max-w-xl text-ink-soft leading-relaxed">
              Salman Perfumes started as a private blending project before it
              was a brand — six formulas, refined until each one had a clear
              opinion. Every batch is mixed in small runs, rested, and tested
              on skin before it&rsquo;s bottled. Nothing goes out that
              wouldn&rsquo;t be worn by the people who made it.
            </p>
          </Reveal>
        </div>
      </div>

      <Reveal delay={0.15}>
        <div className="relative mt-20 aspect-[21/9] w-full overflow-hidden bg-ink">
          <Image
            src="/logo/mark-gold-transparent.png"
            alt=""
            fill
            className="object-contain p-16 opacity-90 md:p-24"
          />
        </div>
      </Reveal>
    </section>
  );
}
