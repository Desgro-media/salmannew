import Image from "next/image";
import Link from "next/link";
import { getAllProducts } from "@/lib/products";
import { formatPrice } from "@/lib/format";
import { Reveal } from "@/components/motion/Reveal";
import { HorizontalScroller } from "@/components/ui/HorizontalScroller";
import { cutoutSrc } from "@/lib/product-image";
import { wellSurface } from "@/lib/product-well";

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
        {/* Opens the shop already filtered to these, so the row and the page it
            leads to agree on what a best seller is. */}
        <Link
          href="/shop?type=BestSellers"
          className="mt-4 inline-block text-xs font-semibold uppercase tracking-[0.14em] text-ink-soft underline-offset-4 transition-colors hover:text-ink hover:underline"
        >
          View all →
        </Link>
      </Reveal>

      <div className="mt-10 sm:mt-14">
        <HorizontalScroller className="sm:justify-center">
          {picks.map((product, i) => {
            const cheapest = [...product.sizes].sort((a, b) => a.price - b.price)[0];
            return (
              <Reveal key={product.id} delay={(i % 3) * 0.06} className="flex w-[42vw] max-w-[180px] shrink-0 sm:w-64 sm:max-w-none">
                <Link href={`/product/${product.slug}`} className="group flex h-full w-full flex-col">
                  <div
                    className="relative aspect-square overflow-hidden rounded-[28px] border-2 bg-well"
                    style={{ borderColor: `${product.accent}66` }}
                  >
                    <div
                      aria-hidden
                      className="pointer-events-none absolute inset-0"
                      style={{ background: wellSurface(product.accent) }}
                    />
                    <div className="absolute inset-[13%]">
                      <Image
                        src={cutoutSrc(product.images[0])}
                        alt={product.fullName}
                        fill
                        draggable={false}
                        sizes="(min-width: 640px) 256px, 42vw"
                        className="pointer-events-none object-contain transition-transform duration-500 ease-out group-hover:scale-105"
                      />
                    </div>
                  </div>
                  <h3 className="mt-4 font-bold">{product.name}</h3>
                  <p className="mt-1 text-sm">
                    <span className="font-semibold">From {formatPrice(cheapest.price)}</span>
                    {cheapest.compareAtPrice != null && cheapest.compareAtPrice > cheapest.price && (
                      <span className="ml-2 text-ink-soft line-through">
                        {formatPrice(cheapest.compareAtPrice)}
                      </span>
                    )}
                  </p>
                  <span className="mt-auto inline-block pt-1 text-xs text-ink-soft underline underline-offset-2 group-hover:text-ink">
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
