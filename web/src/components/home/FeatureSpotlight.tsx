import { getAllProducts } from "@/lib/products";
import { FeatureSpotlightCarousel } from "@/components/home/FeatureSpotlightCarousel";

export async function FeatureSpotlight() {
  const products = await getAllProducts();
  return <FeatureSpotlightCarousel products={products} />;
}
