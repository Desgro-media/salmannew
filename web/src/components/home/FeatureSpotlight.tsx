import { getProductsNewestFirst } from "@/lib/products";
import { isOnSale } from "@/components/product/StrikePrice";
import { FeatureSpotlightCarousel } from "@/components/home/FeatureSpotlightCarousel";

// The spotlight leads with what's on sale, then everything else newest first,
// so a markdown or a freshly added scent is the first thing it shows. It reads
// the live catalogue, and admin saves call revalidateStorefront(), so new
// products and price changes appear here without touching this file.
export async function FeatureSpotlight() {
  const products = await getProductsNewestFirst();
  const onSale = (p: (typeof products)[number]) =>
    p.sizes.some((s) => isOnSale(s.price, s.compareAtPrice));
  // Array.prototype.sort is stable, so newest-first holds within each group.
  const ordered = [...products].sort((a, b) => Number(onSale(b)) - Number(onSale(a)));
  return <FeatureSpotlightCarousel products={ordered} />;
}
