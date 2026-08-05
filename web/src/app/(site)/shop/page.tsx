import type { Metadata } from "next";
import { getAllProducts } from "@/lib/products";
import { ShopGrid } from "@/components/shop/ShopGrid";

export const metadata: Metadata = {
  title: "Shop — Salman Perfumes",
  description: "Browse all six Salman Perfumes eaux de parfum.",
};

export default async function ShopPage() {
  const products = await getAllProducts();

  return (
    <div className="pt-16 md:pt-20">
      <div className="container-grid border-b border-line py-14 md:py-20">
        <p className="eyebrow text-ink-soft">Shop</p>
        <h1 className="mt-3 text-5xl font-black tracking-tight md:text-7xl">
          All Scents
        </h1>
      </div>

      <div className="container-grid py-12 md:py-16">
        <ShopGrid products={products} />
      </div>
    </div>
  );
}
