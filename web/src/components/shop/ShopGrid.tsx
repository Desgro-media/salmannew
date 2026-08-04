"use client";

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { clsx } from "clsx";
import type { Product } from "@/lib/types";
import { ProductCard } from "@/components/product/ProductCard";

const CATEGORIES = ["All", "Oriental", "Floral", "Fresh", "Woody", "Musk"] as const;

export function ShopGrid({ products }: { products: Product[] }) {
  const [active, setActive] = useState<(typeof CATEGORIES)[number]>("All");

  const filtered = useMemo(
    () =>
      active === "All" ? products : products.filter((p) => p.category === active),
    [active, products],
  );

  return (
    <div>
      <div className="no-scrollbar flex gap-2 overflow-x-auto pb-2">
        {CATEGORIES.map((cat) => (
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

      <div className="mt-6 grid grid-cols-2 gap-x-3 gap-y-7 sm:gap-x-6 sm:gap-y-12 lg:grid-cols-3 lg:gap-x-8 lg:gap-y-14">
        <AnimatePresence mode="popLayout">
          {filtered.map((product, i) => (
            <motion.div
              key={product.id}
              layout
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            >
              <ProductCard product={product} index={i} />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
