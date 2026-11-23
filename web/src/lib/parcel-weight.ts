// What a parcel weighs, because that is what India Post bills by.
//
// Speed Post prices in slabs — measured from PostBridge's own tariff calculator,
// the price is one figure up to 250 g, a dearer one from 251 to 500 g, and another
// again above that — so a weight that is merely close can land in the wrong slab
// and cost real money on every parcel. A single fixed weight for every order cannot
// be right for both a 20 ml bottle (about 150 g packed) and two 50 ml bottles
// (about 520 g), so the weight is worked out per order from what is in it.
//
// Pure and free of the database on purpose: it is used where the order is sent to
// PostBridge, and it is simple enough to test by feeding it numbers.

/**
 * What the shipping carton, wrapping and tape add to a parcel, in grams, until the
 * owner sets their own figure in Settings. A guess: the owner is meant to weigh one
 * packed parcel and replace it.
 */
export const DEFAULT_PACKING_GRAMS = 50;

export interface ParcelSettings {
  packingGrams: number;
}

export const DEFAULT_PARCEL_SETTINGS: ParcelSettings = { packingGrams: DEFAULT_PACKING_GRAMS };

/** One line of an order, with the weight of a single unit as entered in the admin. */
export interface WeighedItem {
  quantity: number;
  weightGrams: number | null;
}

export interface ParcelWeight {
  grams: number;
  /**
   * `items`: summed from the products' own weights plus packing.
   * `fallback`: a fixed weight, because at least one product has none.
   */
  source: "items" | "fallback";
}

/**
 * The parcel weight in whole grams, or null when there is nothing trustworthy to
 * send (the order is then sent without one and PostBridge uses its own).
 *
 * If *any* line has no weight the sum would be too light, and a too-light weight
 * quietly under-declares the parcel — so a partial sum is never used. A fixed
 * fallback is used instead if one is configured; otherwise no weight is sent, which
 * makes the booking fail loudly rather than bill the wrong slab.
 */
export function parcelWeight(
  items: WeighedItem[],
  packingGrams: number,
  fallbackGrams: number | null,
): ParcelWeight | null {
  // Nothing in the order means nothing to weigh, not a parcel of the fallback weight.
  if (items.length === 0) return null;

  const packing = Number.isFinite(packingGrams) && packingGrams > 0 ? Math.round(packingGrams) : 0;

  const allWeighed = items.every((i) => i.quantity > 0 && i.weightGrams !== null && i.weightGrams > 0);
  if (allWeighed) {
    const itemsGrams = items.reduce((sum, i) => sum + (i.weightGrams as number) * i.quantity, 0);
    return { grams: Math.round(itemsGrams + packing), source: "items" };
  }

  if (fallbackGrams !== null && fallbackGrams > 0) {
    return { grams: Math.round(fallbackGrams), source: "fallback" };
  }
  return null;
}
