import type { Metadata } from "next";
import { getAllProducts } from "@/lib/products";
import { WishlistGrid } from "@/components/wishlist/WishlistGrid";

export const metadata: Metadata = {
  title: "Saved — Salman Perfumes",
  description: "Scents you've saved for later.",
};

export default async function WishlistPage() {
  const products = await getAllProducts();

  return (
    <div className="pt-16 md:pt-20">
      <div className="container-grid border-b border-line py-14 md:py-20">
        <p className="eyebrow text-ink-soft">Wishlist</p>
        <h1 className="mt-3 text-5xl font-black tracking-tight md:text-7xl">
          Saved Scents
        </h1>
      </div>

      <div className="container-grid py-12 md:py-16">
        <WishlistGrid products={products} />
      </div>
    </div>
  );
}
