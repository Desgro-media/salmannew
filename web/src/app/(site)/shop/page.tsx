import type { Metadata } from "next";
import { getAllProducts } from "@/lib/products";
import { ShopGrid } from "@/components/shop/ShopGrid";
import {
  PRICE_BANDS,
  SHOP_FILTERS,
  SHOP_SORTS,
  SHOP_TYPES,
} from "@/lib/shop-filters";

export const metadata: Metadata = {
  title: "Shop — Salman Perfumes",
  description: "Browse all six Salman Perfumes eaux de parfum.",
};

export default async function ShopPage({
  searchParams,
}: {
  searchParams: Promise<{
    filter?: string;
    type?: string;
    price?: string;
    sort?: string;
  }>;
}) {
  const [products, params] = await Promise.all([getAllProducts(), searchParams]);

  // Matched against the allowed values rather than cast: these arrive from a
  // URL anyone can edit, and an unknown one should open the shop on its
  // defaults instead of a state the grid has no case for.
  const initialFilter = SHOP_FILTERS.find((f) => f === params.filter);
  const initialType = SHOP_TYPES.find((t) => t === params.type);
  const initialBand = PRICE_BANDS.find((b) => b === params.price);
  const initialSort = SHOP_SORTS.find((s) => s === params.sort);

  return (
    <div className="pt-16 md:pt-20">
      <div className="container-grid border-b border-line py-14 md:py-20">
        <p className="eyebrow text-ink-soft">Shop</p>
        <h1 className="mt-3 text-5xl font-black tracking-tight md:text-7xl">
          All Scents
        </h1>
      </div>

      <div className="container-grid py-12 md:py-16">
        <ShopGrid
          products={products}
          initialFilter={initialFilter}
          initialType={initialType}
          initialBand={initialBand}
          initialSort={initialSort}
        />
      </div>
    </div>
  );
}
