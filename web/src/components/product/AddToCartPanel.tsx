"use client";

import { useState } from "react";
import { clsx } from "clsx";
import { motion, AnimatePresence } from "framer-motion";
import type { Product } from "@/lib/types";
import { formatPrice } from "@/lib/format";
import { useCart } from "@/lib/store/cart";
import { useProductSelection } from "@/lib/product-selection-context";
import { StrikePrice, isOnSale } from "@/components/product/StrikePrice";

export function AddToCartPanel({ product }: { product: Product }) {
  const { activeIndex, setActiveIndex } = useProductSelection();
  const [quantity, setQuantity] = useState(1);
  const [justAdded, setJustAdded] = useState(false);
  const addItem = useCart((s) => s.addItem);

  const size = product.sizes[Math.min(activeIndex, product.sizes.length - 1)];

  function handleAdd() {
    addItem(
      {
        productSlug: product.slug,
        sizeId: size.id,
        name: product.name,
        sizeLabel: size.label,
        price: size.price,
        compareAtPrice: size.compareAtPrice,
        image: size.image,
        sku: size.sku,
      },
      quantity,
    );
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 1800);
  }

  return (
    <div>
      <div className="flex items-baseline gap-3">
        {/* The new price pops once as the strike lands, but only on a size that
            is actually discounted — a plain price has nothing to react to.
            Keyed on the size so it replays when the size changes, in step with
            the strike. origin-left so it grows away from the number, not into
            the crossed-out price beside it. */}
        <span
          key={`price-${size.id}`}
          className={clsx(
            "text-2xl font-bold",
            isOnSale(size.price, size.compareAtPrice) &&
              "origin-left animate-price-land motion-reduce:animate-none",
          )}
        >
          {formatPrice(size.price)}
        </span>
        {/* Keyed on the size so picking the other bottle remounts it and the
            strike is drawn again, rather than the old line sitting there. */}
        <StrikePrice
          key={`strike-${size.id}`}
          price={size.price}
          compareAtPrice={size.compareAtPrice}
          animate
          className="text-base"
        />
      </div>

      <div className="mt-6">
        <p className="eyebrow text-ink-soft">Size</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {product.sizes.map((s, i) => (
            <button
              key={s.id}
              onClick={() => setActiveIndex(i)}
              className={clsx(
                "rounded-full border px-5 py-2.5 text-sm font-semibold transition-colors duration-300",
                i === activeIndex
                  ? "border-ink bg-ink text-paper"
                  : "border-line text-ink hover:border-ink",
              )}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-8 flex items-stretch gap-3">
        <div className="flex items-center gap-1 rounded-full border border-line px-1.5">
          <button
            className="flex h-9 w-9 items-center justify-center rounded-full text-lg transition-colors duration-300 hover:bg-paper-2"
            onClick={() => setQuantity((q) => Math.max(1, q - 1))}
            aria-label="Decrease quantity"
          >
            −
          </button>
          <span className="min-w-[2rem] text-center text-sm font-semibold">
            {quantity}
          </span>
          <button
            className="flex h-9 w-9 items-center justify-center rounded-full text-lg transition-colors duration-300 hover:bg-paper-2"
            onClick={() => setQuantity((q) => q + 1)}
            aria-label="Increase quantity"
          >
            +
          </button>
        </div>

        <button
          onClick={handleAdd}
          className="relative flex-1 overflow-hidden rounded-full bg-ink px-7 py-3.5 text-xs font-semibold uppercase tracking-[0.14em] text-paper transition-colors duration-300 hover:bg-gold hover:text-ink"
        >
          <AnimatePresence mode="wait" initial={false}>
            <motion.span
              key={justAdded ? "added" : "add"}
              initial={{ y: 12, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -12, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="block"
            >
              {justAdded ? "Added to Bag ✓" : "Add to Bag"}
            </motion.span>
          </AnimatePresence>
        </button>
      </div>
    </div>
  );
}
