"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { Product } from "@/lib/types";
import { formatPrice } from "@/lib/format";
import { cutoutSrc } from "@/lib/product-image";
import { useCart } from "@/lib/store/cart";
import { useWishlist } from "@/lib/store/wishlist";
import { useHasMounted } from "@/lib/use-has-mounted";

export function ProductCard({ product }: { product: Product }) {
  const [justAdded, setJustAdded] = useState(false);
  const addItem = useCart((s) => s.addItem);
  const wishlistSlugs = useWishlist((s) => s.slugs);
  const toggleWishlist = useWishlist((s) => s.toggle);
  const mounted = useHasMounted();
  const liked = mounted && wishlistSlugs.includes(product.slug);
  const size = product.sizes[0];
  const label = product.bestseller ? "Popular" : product.isNew ? "New" : product.category;

  function handleAdd() {
    addItem({
      productSlug: product.slug,
      sizeId: size.id,
      name: product.name,
      sizeLabel: size.label,
      price: size.price,
      image: size.image,
      sku: size.sku,
    });
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 1500);
  }

  return (
    <article className="group relative flex h-full flex-col">
      <Link
        href={`/product/${product.slug}`}
        aria-label={`View ${product.fullName}`}
        className="absolute inset-0 z-10"
      />

      {/* Same well as the homepage rows (BestSellers / SignatureCollections):
          an accent-tinted square holding the background-removed bottle, rather
          than a cropped circle. Keeping the three surfaces identical is the
          point — the shop should not read as a different product system. */}
      <div
        className="relative aspect-square overflow-hidden rounded-[28px] border-2 bg-paper-2 transition-shadow duration-500 ease-out group-hover:shadow-[0_24px_44px_-20px_rgba(19,17,16,0.25)]"
        style={{ borderColor: `${product.accent}66` }}
      >
        <Image
          src={cutoutSrc(product.images[0])}
          alt={product.fullName}
          fill
          draggable={false}
          sizes="(min-width: 1024px) 30vw, 46vw"
          className="pointer-events-none object-contain transition-transform duration-500 ease-out group-hover:scale-105"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 rounded-[26px] shadow-[inset_0_0_40px_20px_var(--color-paper-2)]"
        />

        {/* Both chips used backdrop-blur-sm. A product card repeats across the
            whole shop grid, so that was two blurred backdrops per card
            re-compositing on every scroll frame. Raising the background opacity
            instead is visually near-identical and costs nothing. */}
        <span className="absolute left-3 top-3 z-20 rounded-full bg-paper/85 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-soft">
          {label}
        </span>
        <button
          type="button"
          onClick={() => toggleWishlist(product.slug)}
          aria-label={liked ? "Remove from wishlist" : "Add to wishlist"}
          aria-pressed={liked}
          className="absolute right-3 top-3 z-20 flex h-8 w-8 items-center justify-center rounded-full bg-paper/85 text-ink-soft transition-colors duration-300 hover:text-ink"
        >
          <motion.svg
            viewBox="0 0 24 24"
            className="h-4 w-4"
            initial={false}
            animate={{ scale: liked ? [1, 1.3, 1] : 1 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            fill={liked ? "currentColor" : "none"}
            stroke="currentColor"
            strokeWidth={1.6}
          >
            <path d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
          </motion.svg>
        </button>
      </div>

      <div className="mt-4 flex items-end justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate text-base font-bold tracking-tight">{product.name}</h3>
          <p className="mt-0.5 truncate text-xs text-ink-soft">{product.tagline}</p>
          <p className="mt-2 text-lg font-bold">{formatPrice(size.price)}</p>
        </div>

        <button
          type="button"
          onClick={handleAdd}
          aria-label={`Add ${product.name} to bag`}
          className="relative z-20 flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-ink text-paper transition-transform duration-300 ease-out hover:scale-105 active:scale-95"
        >
          <AnimatePresence mode="wait" initial={false}>
            <motion.span
              key={justAdded ? "check" : "plus"}
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.5, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="text-lg leading-none"
            >
              {justAdded ? "✓" : "+"}
            </motion.span>
          </AnimatePresence>
        </button>
      </div>
    </article>
  );
}
