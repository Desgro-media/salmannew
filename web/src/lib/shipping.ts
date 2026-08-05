export const SHIPPING_THRESHOLD = 2999;
export const SHIPPING_FEE = 149;

export function calculateShipping(subtotal: number): number {
  return subtotal === 0 || subtotal >= SHIPPING_THRESHOLD ? 0 : SHIPPING_FEE;
}
