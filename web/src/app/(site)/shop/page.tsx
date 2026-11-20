import type { Metadata } from "next";
import Image from "next/image";
import { getNewArrivals, getProductsNewestFirst } from "@/lib/products";
import { Marquee } from "@/components/layout/Marquee";
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
  const [products, newArrivals, params] = await Promise.all([
    getProductsNewestFirst(),
    getNewArrivals(),
    searchParams,
  ]);

  // Matched against the allowed values rather than cast: these arrive from a
  // URL anyone can edit, and an unknown one should open the shop on its
  // defaults instead of a state the grid has no case for.
  const initialFilter = SHOP_FILTERS.find((f) => f === params.filter);
  const initialType = SHOP_TYPES.find((t) => t === params.type);
  const initialBand = PRICE_BANDS.find((b) => b === params.price);
  const initialSort = SHOP_SORTS.find((s) => s === params.sort);

  return (
    <div className="pt-16 md:pt-20">
      {/* Marquee sizes its scrolling row to its own content (w-max), so a
          single short phrase leaves the rest of the bar blank instead of
          looping continuously. Repeating it keeps the row at least as wide
          as the screen. */}
      <Marquee items={Array(20).fill("Salman Perfumes")} />
      {/* The banner art carries its own headline ("Find Your Scent…") on the
          left, so the page title stays in the DOM for screen readers and
          search but isn't drawn over it. Below md the box is a taller 2:1 and
          the image is anchored left, which keeps both the copy and the
          bottles in frame instead of letting a 3:1 strip shrink the text to
          nothing; from md up it follows the image's own ratio, capped so it
          doesn't take over the screen on very wide monitors. */}
      <section className="relative aspect-[2/1] w-full overflow-hidden border-b border-line md:aspect-[3000/1013] lg:max-h-[640px]">
        <h1 className="sr-only">All Scents</h1>
        <Image
          src="/hero/shop-banner.jpg"
          alt="The me. collection: Oud, Love and Sweet eaux de parfum on a sandstone arch"
          fill
          preload
          sizes="100vw"
          className="object-cover object-[20%_center] md:object-center"
        />
      </section>

      <div className="container-grid py-12 md:py-16">
        {/* ShopGrid seeds its state from the initial* props once, on mount. The
            header links (Best Sellers, Signature Collections) change ?type= while
            this page is already open, which Next treats as the same page — so
            without a key the URL moves and the grid stays put. Keying on the
            parsed values remounts it with the new filter. */}
        <ShopGrid
          key={`${initialFilter}|${initialType}|${initialBand}|${initialSort}`}
          products={products}
          newArrivalIds={newArrivals.map((p) => p.id)}
          initialFilter={initialFilter}
          initialType={initialType}
          initialBand={initialBand}
          initialSort={initialSort}
        />
      </div>
    </div>
  );
}
