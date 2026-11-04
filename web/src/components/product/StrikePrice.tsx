import { clsx } from "clsx";
import { formatPrice } from "@/lib/format";

/**
 * A size is on sale only when its original price is genuinely above what is
 * charged. The admin form and its schema already enforce that on save; this
 * keeps the storefront honest about data that predates the check, or was
 * written some other way.
 */
export function isOnSale(price: number, compareAtPrice?: number | null): compareAtPrice is number {
  return compareAtPrice != null && compareAtPrice > price;
}

/**
 * The crossed-out original price, in red. Renders nothing when there is no
 * markdown, so callers drop it in beside a price without a condition of their
 * own — one definition of "on sale" for every surface that shows it.
 *
 * The strike is a drawn line rather than `text-decoration: line-through`, since
 * a text decoration cannot be animated. `animate` draws it across left to right
 * once on mount; it is only meant for the product page, where the price is the
 * focus. Everywhere else the same line is simply there, so the two look the
 * same once settled. Remount it (give it a `key`) to replay the animation.
 *
 * No "use client": it is plain markup plus a CSS animation, so server components
 * (the homepage rows) and client ones (cards, cart) can both use it.
 */
export function StrikePrice({
  price,
  compareAtPrice,
  animate = false,
  className,
}: {
  price: number;
  compareAtPrice?: number | null;
  animate?: boolean;
  className?: string;
}) {
  if (!isOnSale(price, compareAtPrice)) return null;

  return (
    <del className={clsx("relative inline-block whitespace-nowrap text-sale no-underline", className)}>
      <span className="sr-only">Original price </span>
      {formatPrice(compareAtPrice)}
      {/* Centred on the digits, not on the line box. The box includes room for
          descenders, so its middle sits about 0.1em below the middle of a row
          of numerals — which is where a native line-through lands, and reads as
          a line under the number rather than through it. In em so the nudge
          follows the text size (cards, bag and product page differ). */}
      <span
        aria-hidden
        className={clsx(
          "pointer-events-none absolute inset-x-0 top-[calc(50%_-_0.1em)] h-[1.5px] origin-left bg-sale",
          animate && "animate-strike motion-reduce:animate-none",
        )}
      />
    </del>
  );
}
