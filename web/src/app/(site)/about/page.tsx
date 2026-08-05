import type { Metadata } from "next";
import Image from "next/image";
import { Reveal } from "@/components/motion/Reveal";
import { ButtonLink } from "@/components/ui/Button";
import { getAllProducts } from "@/lib/products";

export const metadata: Metadata = {
  title: "About — Salman Perfumes",
  description: "The story behind Salman Perfumes and the me. collection.",
};

const VALUES = [
  {
    n: "01",
    title: "Real concentrations",
    body: "Every scent is Eau de Parfum grade — no watered-down EDTs dressed up in heavier bottles.",
  },
  {
    n: "02",
    title: "Small batches",
    body: "We mix, rest and test each run before it's bottled. No fragrance ships until it's been worn on skin for a week.",
  },
  {
    n: "03",
    title: "One idea per bottle",
    body: "No forty-note fantasy lists. Each formula is built around a single accord you can actually name.",
  },
  {
    n: "04",
    title: "Cruelty-free, always",
    body: "Nothing in the me. collection is tested on animals, at any stage.",
  },
];

export default async function AboutPage() {
  const products = await getAllProducts();

  return (
    <div className="pt-16 md:pt-20">
      <section className="container-grid border-b border-line py-20 md:py-32">
        <Reveal>
          <p className="eyebrow text-ink-soft">About</p>
          <h1 className="mt-4 max-w-3xl text-5xl font-black leading-[0.95] tracking-tight md:text-7xl">
            We make perfume like it&rsquo;s still handmade. Because it is.
          </h1>
        </Reveal>
      </section>

      <section className="container-grid grid grid-cols-1 gap-10 py-20 md:grid-cols-12 md:py-28">
        <Reveal className="md:col-span-3">
          <p className="eyebrow text-ink-soft">The Beginning</p>
        </Reveal>
        <div className="md:col-span-8 md:col-start-5">
          <Reveal>
            <p className="text-2xl font-medium leading-relaxed tracking-tight md:text-3xl">
              Salman Perfumes started on a kitchen counter, not in a lab —
              blending oils for friends who kept asking where a scent was
              from, then refusing to say &ldquo;a shop.&rdquo;
            </p>
          </Reveal>
          <Reveal delay={0.1}>
            <p className="mt-6 max-w-xl leading-relaxed text-ink-soft">
              Six formulas made it out of that kitchen and into bottles:
              Imperial, Orchid, Akhdar, Oud Lavender, Lather and Latheer.
              Each one still carries the same rule it started with — if a
              note is listed on the label, it has to actually be there in
              the glass, at a concentration you can smell.
            </p>
          </Reveal>
        </div>
      </section>

      <section className="border-y border-line bg-ink text-paper">
        <div className="container-grid grid grid-cols-1 gap-x-8 gap-y-12 py-20 sm:grid-cols-2 md:py-28">
          {VALUES.map((v, i) => (
            <Reveal key={v.n} delay={(i % 2) * 0.1}>
              <span className="font-mono text-xs text-gold">{v.n}</span>
              <h3 className="mt-3 text-xl font-semibold">{v.title}</h3>
              <p className="mt-2 max-w-xs text-sm leading-relaxed text-paper/70">
                {v.body}
              </p>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="container-grid py-20 md:py-28">
        <Reveal>
          <div className="relative mx-auto aspect-square w-40 md:w-48">
            <Image
              src="/logo/mark-gold-transparent.png"
              alt="Salman Perfumes mark"
              fill
              className="object-contain"
            />
          </div>
        </Reveal>
        <Reveal delay={0.1}>
          <p className="mx-auto mt-10 max-w-xl text-center text-2xl font-medium leading-relaxed tracking-tight md:text-3xl">
            {products.length} scents. No fillers. Made to be worn.
          </p>
        </Reveal>
        <Reveal delay={0.2} className="mt-10 flex justify-center">
          <ButtonLink href="/shop">Shop the Collection</ButtonLink>
        </Reveal>
      </section>
    </div>
  );
}
