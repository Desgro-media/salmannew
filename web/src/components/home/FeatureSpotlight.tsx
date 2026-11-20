import { NEW_ARRIVALS_COUNT, getProductsNewestFirst } from "@/lib/products";
import { isOnSale } from "@/components/product/StrikePrice";
import { FeatureSpotlightCarousel } from "@/components/home/FeatureSpotlightCarousel";

// The spotlight's order, first to last:
//   1. new arrivals — the latest NEW_ARRIVALS_COUNT scents, the same ones the
//      homepage New Arrivals row and the shop's New Arrivals filter show;
//   2. everything else that is on sale;
//   3. the rest, newest first.
// It reads the live catalogue, and admin saves call revalidateStorefront(), so
// a new product, a markdown or a switch-off shows up here without touching
// this file.
export async function FeatureSpotlight() {
  // Newest first, so the first NEW_ARRIVALS_COUNT entries are the new arrivals.
  const products = await getProductsNewestFirst();

  const rank = (product: (typeof products)[number], index: number) => {
    if (index < NEW_ARRIVALS_COUNT) return 0;
    return product.sizes.some((s) => isOnSale(s.price, s.compareAtPrice)) ? 1 : 2;
  };

  const ordered = products
    .map((product, index) => ({ product, rank: rank(product, index), index }))
    // Equal ranks fall back to position, i.e. newest first, rather than leaning
    // on the sort being stable.
    .sort((a, b) => a.rank - b.rank || a.index - b.index)
    .map(({ product }) => product);

  return <FeatureSpotlightCarousel products={ordered} />;
}
