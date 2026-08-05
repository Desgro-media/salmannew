import Image from "next/image";
import { getProductBySlug } from "@/lib/products";
import { priceRangeFor } from "@/lib/price";
import { formatPrice } from "@/lib/format";
import { Reveal } from "@/components/motion/Reveal";
import { ButtonLink } from "@/components/ui/Button";

export async function FeatureSpotlight() {
  const product = (await getProductBySlug("imperial"))!;
  const { min } = priceRangeFor(product);

  return (
    <section className="border-t border-line bg-ink text-paper">
      <div className="container-grid grid grid-cols-1 items-center gap-12 py-24 md:grid-cols-12 md:py-32">
        <Reveal className="relative order-2 md:order-1 md:col-span-6">
          <div className="relative mx-auto aspect-[4/5] w-full max-w-md">
            <Image
              src={product.images[0]}
              alt={product.fullName}
              fill
              sizes="(min-width: 768px) 45vw, 90vw"
              className="object-contain"
            />
          </div>
        </Reveal>

        <div className="order-1 md:order-2 md:col-span-6 md:col-start-7">
          <Reveal>
            <p className="eyebrow text-gold">Bestseller · {product.category}</p>
            <h2 className="mt-4 text-4xl font-black leading-[0.95] tracking-tight md:text-6xl">
              {product.fullName}
            </h2>
            <p className="mt-5 max-w-md text-paper/70 leading-relaxed">
              {product.description}
            </p>
          </Reveal>

          <Reveal delay={0.1}>
            <dl className="mt-9 grid grid-cols-3 gap-4 border-t border-paper/15 pt-6 text-xs uppercase tracking-[0.14em] text-paper/50">
              <div>
                <dt>Top</dt>
                <dd className="mt-2 normal-case tracking-normal text-paper/90">
                  {product.notes.top.join(", ")}
                </dd>
              </div>
              <div>
                <dt>Heart</dt>
                <dd className="mt-2 normal-case tracking-normal text-paper/90">
                  {product.notes.heart.join(", ")}
                </dd>
              </div>
              <div>
                <dt>Base</dt>
                <dd className="mt-2 normal-case tracking-normal text-paper/90">
                  {product.notes.base.join(", ")}
                </dd>
              </div>
            </dl>
          </Reveal>

          <Reveal delay={0.2}>
            <div className="mt-9 flex flex-wrap items-center gap-6">
              <ButtonLink
                href={`/product/${product.slug}`}
                className="bg-gold! text-ink! hover:bg-paper!"
              >
                Shop from {formatPrice(min)}
              </ButtonLink>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
