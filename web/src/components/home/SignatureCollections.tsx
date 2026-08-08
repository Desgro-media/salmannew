import Image from "next/image";
import Link from "next/link";
import { getAllProducts } from "@/lib/products";
import { formatPrice } from "@/lib/format";
import { Reveal } from "@/components/motion/Reveal";
import { ButtonLink } from "@/components/ui/Button";
import { HorizontalScroller } from "@/components/ui/HorizontalScroller";
import { cutoutSrc } from "@/lib/product-image";

export async function SignatureCollections() {
  const products = await getAllProducts();

  return (
    <section className="border-t border-line py-16 sm:py-24 md:py-32">
      <div className="container-grid">
        <Reveal>
          <p className="eyebrow text-ink-soft">The Full Range</p>
          <h2 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl md:text-6xl">
            Signature Collections
          </h2>
        </Reveal>
      </div>

      <div className="container-grid mt-10 sm:mt-14">
        <HorizontalScroller>
          {products.map((product, i) => {
            const cheapest = [...product.sizes].sort((a, b) => a.price - b.price)[0];
            const onSale = cheapest.compareAtPrice != null && cheapest.compareAtPrice > cheapest.price;

            return (
              <Reveal key={product.id} delay={(i % 3) * 0.06} className="w-[42vw] max-w-[180px] shrink-0 sm:w-64 sm:max-w-none">
                <div className="flex h-full flex-col">
                  <Link href={`/product/${product.slug}`} className="group block">
                    <div
                      className="relative aspect-square overflow-hidden rounded-[28px] border-2 bg-paper-2"
                      style={{ borderColor: `${product.accent}66` }}
                    >
                      {onSale && (
                        <span className="absolute left-4 top-4 z-10 rounded-full bg-ink px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-paper">
                          Sale
                        </span>
                      )}
                      <Image
                        src={cutoutSrc(product.images[0])}
                        alt={product.fullName}
                        fill
                        draggable={false}
                        sizes="(min-width: 640px) 256px, 42vw"
                        className="pointer-events-none object-contain transition-transform duration-500 ease-out group-hover:scale-105"
                      />
                      <div
                        aria-hidden
                        className="pointer-events-none absolute inset-0 rounded-[26px] shadow-[inset_0_0_40px_20px_var(--color-paper-2)]"
                      />
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
                  </Link>

                  <ButtonLink
                    href={`/product/${product.slug}`}
                    variant="secondary"
                    className="mt-4 w-full"
                  >
                    Choose options
                  </ButtonLink>
                </div>
              </Reveal>
            );
          })}
        </HorizontalScroller>
      </div>
    </section>
  );
}
