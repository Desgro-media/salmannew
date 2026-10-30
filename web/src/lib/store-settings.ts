import { cache } from "react";
import { prisma } from "@/lib/db";
import { DEFAULT_COD_SETTINGS, type CodSettings } from "@/lib/cod";
import { DEFAULT_SHIPPING_SETTINGS, type ShippingSettings } from "@/lib/shipping";

export const STORE_SETTINGS_ID = 1;

export type StoreSettings = ShippingSettings & CodSettings;

/**
 * The admin-configured storefront settings. Server-only — it touches Prisma.
 *
 * Wrapped in React's `cache` so that a single render reading it from several
 * places (the page, the marquee, the checkout summary) makes one query rather
 * than one each. The cache is per-request, so an admin's save is visible on the
 * very next request rather than being held behind a stale window.
 */
export const getStoreSettings = cache(async (): Promise<StoreSettings> => {
  // Falls back rather than throwing: a missing row is a fresh or half-seeded
  // database, and refusing to render checkout over it would turn a
  // configuration gap into an outage. The defaults are the same values the
  // column defaults carry, so behaviour is identical either way.
  const row = await prisma.storeSettings.findUnique({
    where: { id: STORE_SETTINGS_ID },
    select: {
      shippingFee: true,
      freeShippingThreshold: true,
      codEnabled: true,
      codFee: true,
      codMaxOrderValue: true,
    },
  });

  return row ?? { ...DEFAULT_SHIPPING_SETTINGS, ...DEFAULT_COD_SETTINGS };
});
