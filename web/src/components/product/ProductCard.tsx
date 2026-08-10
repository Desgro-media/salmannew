"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, type CSSProperties } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { Product } from "@/lib/types";
import { formatPrice } from "@/lib/format";
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
    <article
      style={{ "--accent": product.accent } as CSSProperties}
      className="group relative flex flex-col overflow-hidden rounded-[28px] border border-black/5 bg-paper-2 shadow-[0_1px_2px_rgba(19,17,16,0.05)] transition-shadow duration-500 ease-out hover:shadow-[0_24px_44px_-20px_rgba(19,17,16,0.25)]"
    >
      <Link
        href={`/product/${product.slug}`}
        aria-label={`View ${product.fullName}`}
        className="absolute inset-0 z-10"
      />

      <div className="flex items-start justify-between p-4">
        {/* These three surfaces used backdrop-blur-sm. Each product card is
            repeated across the shop grid, so that was ~3 blurred backdrops per
            card re-compositing on every scroll frame. Raising the background
            opacity instead is visually near-identical and costs nothing. */}
        <span className="rounded-full bg-paper/85 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-soft">
          {label}
        </span>
        <button
          type="button"
          onClick={() => toggleWishlist(product.slug)}
          aria-label={liked ? "Remove from wishlist" : "Add to wishlist"}
          aria-pressed={liked}
          className="relative z-20 flex h-8 w-8 items-center justify-center rounded-full bg-paper/85 text-ink-soft transition-colors duration-300 hover:text-ink"
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

      <div className="relative mx-auto -mt-2 h-36 w-36 shrink-0 overflow-hidden rounded-full ring-1 ring-black/5 sm:h-44 sm:w-44">
        <div
          aria-hidden
          className="absolute inset-0 opacity-60 blur-2xl transition-opacity duration-500 group-hover:opacity-90"
          style={{ background: "radial-gradient(circle, var(--accent) 0%, transparent 70%)" }}
        />
        <Image
          src={product.images[0]}
          alt={product.fullName}
          fill
          sizes="(min-width: 1024px) 15vw, (min-width: 640px) 22vw, 40vw"
          className="object-cover transition-transform duration-700 ease-out group-hover:scale-110"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 rounded-full shadow-[inset_0_0_22px_10px_var(--color-paper-2)]"
        />
      </div>

      <div className="relative z-10 mt-3 flex items-end justify-between gap-3 rounded-[22px] bg-paper/90 p-4">
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
