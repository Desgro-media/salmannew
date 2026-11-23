"use client";

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { clsx } from "clsx";
import type { Product } from "@/lib/types";
import { ProductCard } from "@/components/product/ProductCard";
import { FilterSelect } from "@/components/shop/FilterSelect";
import {
  PRICE_BANDS,
  SHOP_FILTERS,
  SHOP_SORTS,
  SHOP_TYPES,
  matchesPriceBand,
  matchesShopFilter,
  matchesShopType,
  priceBandLabel,
  productFromPrice,
  shopFilterLabel,
  shopGroupRank,
  shopSortLabel,
  shopTypeLabel,
  type PriceBand,
  type ShopFilter,
  type ShopSort,
  type ShopType,
} from "@/lib/shop-filters";

const FILTERS = SHOP_FILTERS;

export function ShopGrid({
  products,
  initialFilter,
  initialType,
  initialBand,
  initialSort,
  newArrivalIds,
}: {
  products: Product[];
  /** ids of the latest scents, newest first — what "New Arrivals" shows */
  newArrivalIds: string[];
  initialFilter?: ShopFilter;
  initialType?: ShopType;
  initialBand?: PriceBand;
  initialSort?: ShopSort;
}) {
  const [active, setActive] = useState<ShopFilter>(initialFilter ?? "All");
  const [type, setType] = useState<ShopType>(initialType ?? "All");
  const [band, setBand] = useState<PriceBand>(initialBand ?? "Any");
  const [sort, setSort] = useState<ShopSort>(initialSort ?? "Featured");

  // Only offer a band some scent can actually fall into. Every 30 ml size is
  // archived at the moment, which leaves ₹499 and ₹999 as the only live prices
  // and "₹1,000 & above" an option that could never return anything. Derived
  // rather than trimmed by hand so the band comes back on its own the day a
  // dearer size is listed. The selected band is always kept, or a link carrying
  // ?price= would land on a control that doesn't show its own value.
  const bands = useMemo(
    () =>
      PRICE_BANDS.filter(
        (b) =>
          b === "Any" ||
          b === band ||
          products.some((p) => matchesPriceBand(p, b)),
      ),
    [products, band],
  );

  const filtered = useMemo(() => {
    const kept = products.filter(
      (p) =>
        matchesShopFilter(p, active) &&
        matchesShopType(p, type, newArrivalIds) &&
        matchesPriceBand(p, band),
    );

    // Featured is the catalogue's own order — newest first — but grouped: gift
    // sets, then perfumes, then bakhoor. The sort is stable, so inside each group
    // that newest-first order is untouched. Only Featured is grouped: asking for
    // price order is an explicit request, and honouring it means a gift set does
    // not jump the queue just for being a gift set.
    if (sort === "Featured") return [...kept].sort((a, b) => shopGroupRank(a) - shopGroupRank(b));

    const direction = sort === "PriceAsc" ? 1 : -1;
    return [...kept].sort(
      (a, b) => (productFromPrice(a) - productFromPrice(b)) * direction,
    );
  }, [products, active, type, band, sort, newArrivalIds]);

  const narrowed = type !== "All" || band !== "Any" || active !== "All";

  // A tab nothing has been added to yet (Bakhoor, before its first product) is not
  // the same as filters that happen to rule everything out: telling the visitor to
  // "try a wider price band" there would be nonsense.
  const tabIsEmpty = active !== "All" && !products.some((p) => matchesShopFilter(p, active));

  function clearAll() {
    setActive("All");
    setType("All");
    setBand("Any");
  }

  return (
    <div>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
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
              {shopFilterLabel(cat)}
            </button>
          ))}
        </div>

        {/* Wraps rather than scrolls sideways: an overflow container would clip
            the open dropdown panel to the row's height. */}
        <div className="flex flex-wrap gap-2 lg:gap-3">
          <FilterSelect
            label="Type"
            value={type}
            options={SHOP_TYPES}
            format={shopTypeLabel}
            onChange={setType}
          />
          <FilterSelect
            label="Price"
            value={band}
            options={bands}
            format={priceBandLabel}
            onChange={setBand}
          />
          <FilterSelect
            label="Sort"
            value={sort}
            options={SHOP_SORTS}
            format={shopSortLabel}
            onChange={setSort}
          />
        </div>
      </div>

      <motion.p layout className="mt-6 text-xs text-ink-soft">
        {filtered.length} product{filtered.length !== 1 && "s"}
      </motion.p>

      {filtered.length === 0 && tabIsEmpty ? (
        <div className="mt-16 text-center">
          <p className="text-lg font-bold">Nothing in {shopFilterLabel(active)} just yet.</p>
          <p className="mt-2 text-sm text-ink-soft">
            New products are added here as they arrive. Have a look at everything we have in the meantime.
          </p>
          <button
            onClick={clearAll}
            className="mt-6 bg-ink px-7 py-3.5 text-xs font-semibold uppercase tracking-[0.14em] text-paper transition-colors duration-300 hover:bg-gold hover:text-ink"
          >
            Show Everything
          </button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="mt-16 text-center">
          <p className="text-lg font-bold">Nothing matches that combination.</p>
          <p className="mt-2 text-sm text-ink-soft">
            Try a wider price band, or start again from the full range.
          </p>
          <button
            onClick={clearAll}
            className="mt-6 bg-ink px-7 py-3.5 text-xs font-semibold uppercase tracking-[0.14em] text-paper transition-colors duration-300 hover:bg-gold hover:text-ink"
          >
            Clear Filters
          </button>
        </div>
      ) : (
        <div className="mt-6 grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4 lg:gap-6">
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
      )}

      {narrowed && filtered.length > 0 && (
        <button
          onClick={clearAll}
          className="mt-10 text-xs font-semibold uppercase tracking-[0.14em] text-ink-soft underline-offset-4 transition-colors hover:text-ink hover:underline"
        >
          Clear Filters
        </button>
      )}
    </div>
  );
}
