/**
 * Shipping rules are configured in admin (StoreSettings) rather than fixed here,
 * so the shop owner can change them without a deploy.
 *
 * The maths stays a pure function of (subtotal, settings) with no database
 * import, because the checkout summary renders in a Client Component and would
 * drag Prisma into the browser bundle otherwise. Server callers read the row
 * via getStoreSettings() in store-settings.ts and pass it in; client callers
 * receive it as props from the server component above them.
 */

export interface ShippingSettings {
  shippingFee: number;
  freeShippingThreshold: number;
}

/**
 * Used before the settings row exists — on a fresh database, and as the
 * fallback if the row is ever missing. Checkout must not fail over a
 * configuration read, so it falls back to these rather than throwing.
 */
export const DEFAULT_SHIPPING_SETTINGS: ShippingSettings = {
  shippingFee: 50,
  freeShippingThreshold: 2999,
};

export function calculateShipping(
  subtotal: number,
  settings: ShippingSettings,
): number {
  // An empty bag shows no shipping line at all; without this it would advertise
  // a fee against a ₹0 total.
  if (subtotal === 0) return 0;
  return subtotal >= settings.freeShippingThreshold ? 0 : settings.shippingFee;
}
