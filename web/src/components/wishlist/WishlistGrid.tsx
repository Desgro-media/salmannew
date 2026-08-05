"use client";

import type { Product } from "@/lib/types";
import { ProductCard } from "@/components/product/ProductCard";
import { ButtonLink } from "@/components/ui/Button";
import { useWishlist } from "@/lib/store/wishlist";
import { useHasMounted } from "@/lib/use-has-mounted";

export function WishlistGrid({ products }: { products: Product[] }) {
  const mounted = useHasMounted();
  const slugs = useWishlist((s) => s.slugs);

  if (!mounted) return null;

  const saved = products.filter((p) => slugs.includes(p.slug));

  if (saved.length === 0) {
    return (
      <div className="flex flex-col items-start gap-6 py-12">
        <p className="text-ink-soft">
          Nothing saved yet — tap the heart on any scent to keep it here.
        </p>
        <ButtonLink href="/shop">Browse the Collection</ButtonLink>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-3 lg:gap-6">
      {saved.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
