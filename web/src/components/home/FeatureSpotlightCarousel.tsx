"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { clsx } from "clsx";
import { AnimatePresence, motion } from "framer-motion";
import type { Product } from "@/lib/types";
import { priceRangeFor } from "@/lib/price";
import { formatPrice } from "@/lib/format";
import { ButtonLink } from "@/components/ui/Button";
import { cutoutSrc } from "@/lib/product-image";
import { productTypeLabel } from "@/lib/shop-filters";
import { StrikePrice, isOnSale } from "@/components/product/StrikePrice";

const ROTATE_MS = 5000;

export function FeatureSpotlightCarousel({ products }: { products: Product[] }) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (products.length < 2) return;
    const id = setTimeout(() => {
      setIndex((i) => (i + 1) % products.length);
    }, ROTATE_MS);
    return () => clearTimeout(id);
  }, [index, products.length]);

  // The list can shrink between renders (a product archived while the page is
  // open and refreshed), so never index past the end.
  const product = products[index % products.length];
  const { min } = priceRangeFor(product);
  const cheapest = product.sizes.find((s) => s.price === min);
  const onSale = product.sizes.some((s) => isOnSale(s.price, s.compareAtPrice));

  return (
    <section className="border-t border-line bg-ink text-paper">
      <div className="container-grid grid grid-cols-1 items-center gap-10 py-16 sm:gap-12 sm:py-24 md:grid-cols-12 md:py-32">
        <div className="relative order-2 md:order-1 md:col-span-6">
          <div className="relative mx-auto aspect-[4/5] w-full max-w-md">
            <AnimatePresence mode="wait">
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -16 }}
                transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                className="absolute inset-0"
              >
                {/* The size's own photo (the one "Shop from ₹…" refers to), as on
                    the card rows. The gallery's first photo can be a lifestyle
                    shot on a white backdrop, which looks like a pale block on
                    this dark section. */}
                <Image
                  src={cutoutSrc(cheapest?.image || product.images[0])}
                  alt={product.fullName}
                  fill
                  sizes="(min-width: 768px) 45vw, 90vw"
                  className="object-contain"
                  priority={index === 0}
                />
                <div
                  aria-hidden
                  className="pointer-events-none absolute inset-0 rounded-[32px] shadow-[inset_0_0_56px_28px_var(--color-ink)]"
                />
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        <div className="order-1 md:order-2 md:col-span-6 md:col-start-7">
          <AnimatePresence mode="wait">
            <motion.div
              key={product.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            >
              <p className="eyebrow text-gold">
                {onSale && (
                  <span className="mr-2 rounded-full bg-sale px-2.5 py-1 text-paper">Sale</span>
                )}
                {product.bestseller ? "Bestseller · " : ""}
                {productTypeLabel(product)}
              </p>
              <h2 className="mt-4 text-3xl font-black leading-[0.95] tracking-tight sm:text-4xl md:text-6xl">
                {product.fullName}
              </h2>
              <p className="mt-5 max-w-md text-paper/70 leading-relaxed">
                {product.description}
              </p>

              {product.isSet ? (
                <div className="mt-9 border-t border-paper/15 pt-6 text-xs uppercase tracking-[0.14em] text-paper/65">
                  <p>What&apos;s inside</p>
                  <p className="mt-2 normal-case tracking-normal text-paper/90">
                    {(product.setItems ?? []).map((item) => `${item.name} (${item.size})`).join(" · ")}
                  </p>
                </div>
              ) : (
                <dl className="mt-9 grid grid-cols-3 gap-4 border-t border-paper/15 pt-6 text-xs uppercase tracking-[0.14em] text-paper/65">
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
              )}

              <div className="mt-9 flex flex-wrap items-center gap-6">
                <ButtonLink
                  href={`/product/${product.slug}`}
                  className="bg-gold! text-ink! hover:bg-paper!"
                >
                  Shop from {formatPrice(min)}
                </ButtonLink>
                <StrikePrice
                  price={min}
                  compareAtPrice={cheapest?.compareAtPrice}
                  className="text-lg font-semibold"
                />
              </div>
            </motion.div>
          </AnimatePresence>

          {products.length > 1 && (
            <div className="mt-9 flex gap-2">
              {products.map((p, i) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setIndex(i)}
                  aria-label={`Show ${p.name}`}
                  className={clsx(
                    "h-1.5 rounded-full transition-all duration-300",
                    i === index ? "w-8 bg-gold" : "w-1.5 bg-paper/30 hover:bg-paper/50",
                  )}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
