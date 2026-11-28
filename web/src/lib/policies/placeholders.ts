// Tags a policy can use for facts that live somewhere else, so a change to the
// delivery charge in Settings cannot leave a policy quoting the old figure.

import { CONTACT_EMAIL, CONTACT_PHONE, LOCATION_ADDRESS } from "@/lib/contact-info";
import { formatPrice } from "@/lib/format";
import { ESTIMATED_DELIVERY_DAYS, type ShippingSettings } from "@/lib/shipping";
import type { CodSettings } from "@/lib/cod";

export const PLACEHOLDERS = [
  { key: "delivery_charges", source: "Delivery charge and free-delivery limit, from Settings" },
  { key: "cash_on_delivery", source: "Cash on delivery rules, from Settings" },
  { key: "delivery_days", source: "Days used for the estimated delivery date on new orders" },
  { key: "contact_email", source: "The shop's contact email" },
  { key: "contact_phone", source: "The shop's phone number" },
  { key: "address", source: "The shop's address" },
] as const;

export type PlaceholderKey = (typeof PLACEHOLDERS)[number]["key"];

export type PlaceholderValues = Record<PlaceholderKey, string>;

function deliveryCharges({ shippingFee, freeShippingThreshold }: ShippingSettings): string {
  if (shippingFee === 0 || freeShippingThreshold === 0) return "Delivery is free on every order.";
  return `Delivery costs ${formatPrice(shippingFee)} when your items total less than ${formatPrice(
    freeShippingThreshold,
  )}. It is free when they total ${formatPrice(freeShippingThreshold)} or more.`;
}

// Mirrors codAvailability() and the fee added in /api/orders.
function cashOnDelivery({ codEnabled, codFee, codMaxOrderValue }: CodSettings): string {
  if (!codEnabled) return "Cash on delivery isn't available at the moment. Please pay online at checkout.";
  const where =
    codMaxOrderValue > 0
      ? `Cash on delivery is available when your items and delivery charge together come to ${formatPrice(codMaxOrderValue)} or less.`
      : "Cash on delivery is available on all orders.";
  const fee =
    codFee > 0
      ? `A cash on delivery fee of ${formatPrice(codFee)} is added to the order.`
      : "There is no extra charge for it.";
  return `${where} ${fee}`;
}

export function placeholderValues(settings: ShippingSettings & CodSettings): PlaceholderValues {
  return {
    delivery_charges: deliveryCharges(settings),
    cash_on_delivery: cashOnDelivery(settings),
    delivery_days: String(ESTIMATED_DELIVERY_DAYS),
    contact_email: CONTACT_EMAIL,
    // Non-breaking spaces, so the number is never split across two lines.
    contact_phone: CONTACT_PHONE.replace(/ /g, " "),
    address: LOCATION_ADDRESS,
  };
}

const TAG = /\{\{\s*([^{}]*?)\s*\}\}/g;

const KNOWN: ReadonlySet<string> = new Set(PLACEHOLDERS.map((p) => p.key));

export function fillPlaceholders(text: string, values: PlaceholderValues): string {
  return text.replace(TAG, (tag, key: string) => (KNOWN.has(key) ? values[key as PlaceholderKey] : tag));
}

/** Tags that would reach customers as raw {{...}} — a typo, usually. */
export function unknownPlaceholders(text: string): string[] {
  const found = [...text.matchAll(TAG)].filter((m) => !KNOWN.has(m[1])).map((m) => m[0]);
  return [...new Set(found)];
}
