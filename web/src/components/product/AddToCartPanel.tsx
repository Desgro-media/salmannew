"use client";

import { useState } from "react";
import { clsx } from "clsx";
import { motion, AnimatePresence } from "framer-motion";
import type { Product } from "@/lib/types";
import { formatPrice } from "@/lib/format";
import { useCart } from "@/lib/store/cart";
import { useProductSelection } from "@/lib/product-selection-context";

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
        <span className="text-2xl font-bold">{formatPrice(size.price)}</span>
        {size.compareAtPrice != null && size.compareAtPrice > size.price && (
          <span className="text-base text-ink-soft line-through">
            {formatPrice(size.compareAtPrice)}
          </span>
        )}
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

      <p className="mt-4 text-xs text-ink-soft">
        SKU {size.sku} · Ships in 2–4 business days
      </p>
    </div>
  );
}
