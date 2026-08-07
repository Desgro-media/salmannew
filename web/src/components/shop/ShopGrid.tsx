"use client";

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { clsx } from "clsx";
import type { Product } from "@/lib/types";
import { ProductCard } from "@/components/product/ProductCard";
import { SHOP_FILTERS, type ShopFilter } from "@/lib/shop-filters";

const FILTERS = SHOP_FILTERS;

export function ShopGrid({
  products,
  initialFilter,
}: {
  products: Product[];
  initialFilter?: ShopFilter;
}) {
  const [active, setActive] = useState<ShopFilter>(initialFilter ?? "Signature Collection");

  const filtered = useMemo(() => {
    if (active === "Signature Collection") return products;
    if (active === "Best Sellers") return products.filter((p) => p.bestseller);
    return products.filter((p) => p.category === active);
  }, [active, products]);

  return (
    <div>
      <div className="no-scrollbar flex gap-2 overflow-x-auto pb-2">
        {FILTERS.map((cat) => (
          <button
            key={cat}
            onClick={() => setActive(cat)}
            className={clsx(
              "shrink-0 border px-4 py-2 text-xs font-semibold uppercase tracking-[0.12em] transition-colors",
              active === cat
                ? "border-ink bg-ink text-paper"
                : "border-line text-ink-soft hover:border-ink hover:text-ink",
            )}
          >
            {cat}
          </button>
        ))}
      </div>

      <motion.p layout className="mt-6 text-xs text-ink-soft">
        {filtered.length} scent{filtered.length !== 1 && "s"}
      </motion.p>

      <div className="mt-6 grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-3 lg:gap-6">
        <AnimatePresence mode="popLayout">
          {filtered.map((product) => (
            <motion.div
              key={product.id}
              layout
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            >
              <ProductCard product={product} />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
