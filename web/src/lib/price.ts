import type { Product } from "./types";

export function priceRangeFor(product: Product): { min: number; max: number } {
  const prices = product.sizes.map((s) => s.price);
  return { min: Math.min(...prices), max: Math.max(...prices) };
}
