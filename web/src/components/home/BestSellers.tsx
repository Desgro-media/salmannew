import Image from "next/image";
import Link from "next/link";
import { getAllProducts } from "@/lib/products";
import { formatPrice } from "@/lib/format";
import { Reveal } from "@/components/motion/Reveal";
import { ButtonLink } from "@/components/ui/Button";
import { HorizontalScroller } from "@/components/ui/HorizontalScroller";

export async function BestSellers() {
  const products = await getAllProducts();
  const picks = products.filter((p) => p.bestseller);

  if (picks.length === 0) return null;

  return (
    <section className="container-grid py-16 sm:py-24 md:py-32">
      <Reveal className="text-center">
        <p className="eyebrow text-ink-soft">Must-Try Picks</p>
        <h2 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl md:text-6xl">
          Best Sellers
        </h2>
        <span className="mt-2 inline-block border-b-2 border-ink pb-1 text-sm font-bold">
          Best sellers
        </span>
      </Reveal>

      <div className="mt-10 sm:mt-14">
        <HorizontalScroller>
          <Reveal className="flex w-[58vw] max-w-[230px] shrink-0 flex-col justify-between rounded-[28px] bg-paper-3 p-6 sm:w-64 sm:max-w-none sm:p-8">
            <div>
              <h3 className="text-xl font-black leading-tight sm:text-2xl">Compliment Magnets—</h3>
              <p className="mt-3 text-sm text-ink-soft">
                Real-world proven, must-try high-performers.
              </p>
            </div>
            <ButtonLink href="/shop" variant="secondary" className="mt-8 self-start rounded-full">
              View all
            </ButtonLink>
          </Reveal>

          {picks.map((product, i) => {
            const cheapest = [...product.sizes].sort((a, b) => a.price - b.price)[0];
            return (
              <Reveal key={product.id} delay={(i % 3) * 0.06} className="w-[58vw] max-w-[230px] shrink-0 sm:w-64 sm:max-w-none">
                <Link href={`/product/${product.slug}`} className="group block">
                  <div className="relative aspect-square overflow-hidden rounded-[28px] bg-paper-2">
                    <Image
                      src={product.images[0]}
                      alt={product.fullName}
                      fill
                      sizes="(min-width: 640px) 256px, 58vw"
                      className="object-contain p-6 transition-transform duration-500 ease-out group-hover:scale-105 sm:p-8"
                    />
                  </div>
                  <h3 className="mt-4 font-bold">{product.name}</h3>
                  <p className="mt-1 text-sm">
                    <span className="font-semibold">From {formatPrice(cheapest.price)}</span>
                    {cheapest.compareAtPrice && (
                      <span className="ml-2 text-ink-soft line-through">
                        {formatPrice(cheapest.compareAtPrice)}
                      </span>
                    )}
                  </p>
                  <span className="mt-1 inline-block text-xs text-ink-soft underline underline-offset-2 group-hover:text-ink">
                    Learn more
                  </span>
                </Link>
              </Reveal>
            );
          })}
        </HorizontalScroller>
      </div>
    </section>
  );
}
