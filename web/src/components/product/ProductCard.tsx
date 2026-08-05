"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import type { Product } from "@/lib/types";
import { priceRangeFor } from "@/lib/price";
import { formatPrice } from "@/lib/format";

export function ProductCard({
  product,
  index,
}: {
  product: Product;
  index: number;
}) {
  const [hovered, setHovered] = useState(false);
  const { min, max } = priceRangeFor(product);
  const secondary = product.images[1];

  return (
    <Link
      href={`/product/${product.slug}`}
      className="group block"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className="relative aspect-[4/5] overflow-hidden bg-paper-2">
        <Image
          src={product.images[0]}
          alt={product.fullName}
          fill
          sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
          className="object-cover transition-opacity duration-700"
          style={{ opacity: hovered && secondary ? 0 : 1 }}
        />
        {secondary && (
          <Image
            src={secondary}
            alt=""
            fill
            sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
            className="object-cover transition-opacity duration-700"
            style={{ opacity: hovered ? 1 : 0 }}
          />
        )}

        <span className="absolute left-2 top-2 font-mono text-[9px] tracking-widest text-ink-soft mix-blend-multiply sm:left-4 sm:top-4 sm:text-[11px]">
          {String(index + 1).padStart(2, "0")}
        </span>

        {(product.bestseller || product.isNew) && (
          <span className="absolute right-2 top-2 bg-ink px-1.5 py-0.5 text-[8px] font-semibold uppercase tracking-[0.1em] text-paper sm:right-4 sm:top-4 sm:px-2.5 sm:py-1 sm:text-[10px] sm:tracking-[0.14em]">
            {product.bestseller ? "Bestseller" : "New"}
          </span>
        )}
      </div>

      <div className="mt-2.5 flex flex-col gap-1 sm:mt-4 sm:flex-row sm:items-start sm:justify-between sm:gap-3">
        <div>
          <p className="text-[9px] uppercase tracking-[0.14em] text-ink-soft sm:text-[11px] sm:tracking-[0.18em]">
            {product.category}
          </p>
          <h3 className="mt-0.5 text-sm font-semibold sm:mt-1 sm:text-lg">
            {product.name}
          </h3>
          <p className="mt-0.5 hidden text-sm text-ink-soft sm:block">
            {product.tagline}
          </p>
        </div>
        <p className="whitespace-nowrap text-xs font-semibold sm:text-sm">
          {min === max ? formatPrice(min) : `${formatPrice(min)}–${formatPrice(max)}`}
        </p>
      </div>
    </Link>
  );
}
