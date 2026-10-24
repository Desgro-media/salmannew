import type { CartLine } from "@/lib/types";

// The standard events the ad account reads, as thin calls over `window.fbq`.
// PageView is not here: the base snippet in MetaPixel reports it, on load and
// on every navigation after. Every call below is a quiet no-op when the pixel is
// not on the page — no META_PIXEL_ID set (local, preview deploys), or the
// script blocked — so a call site never has to ask whether tracking is on.
//
// A size's SKU is the id on every event, because a size is what is actually
// bought: it carries its own price, and it is the same value in the product
// page, the bag and the order, so a view, an add and a purchase line up.
//
// `value` is whole rupees, the unit Meta wants and the unit every price in the
// store already is (lib/format.ts). On the checkout steps and Purchase it is
// what the customer pays, shipping included, so those figures can be compared.

const CURRENCY = "INR";

type StandardEvent =
  | "ViewContent"
  | "AddToCart"
  | "InitiateCheckout"
  | "AddPaymentInfo"
  | "Purchase";

function track(
  event: StandardEvent,
  params: Record<string, unknown>,
  eventId?: string,
) {
  const fbq = typeof window === "undefined" ? undefined : window.fbq;
  if (!fbq) return;

  // Analytics must never be the reason a customer's payment screen breaks.
  try {
    if (eventId) fbq("track", event, params, { eventID: eventId });
    else fbq("track", event, params);
  } catch {
    // dropped event, nothing to tell the customer
  }
}

function cartParams(lines: CartLine[]) {
  return {
    content_ids: lines.map((line) => line.sku),
    content_type: "product",
    contents: lines.map((line) => ({
      id: line.sku,
      quantity: line.quantity,
      item_price: line.price,
    })),
    num_items: lines.reduce((sum, line) => sum + line.quantity, 0),
    currency: CURRENCY,
  };
}

export function trackViewContent(product: { sku: string; name: string; price: number }) {
  track("ViewContent", {
    content_ids: [product.sku],
    content_type: "product",
    content_name: product.name,
    value: product.price,
    currency: CURRENCY,
  });
}

export function trackAddToCart(line: Omit<CartLine, "quantity">, quantity: number) {
  track("AddToCart", {
    content_ids: [line.sku],
    content_type: "product",
    content_name: line.name,
    contents: [{ id: line.sku, quantity, item_price: line.price }],
    value: line.price * quantity,
    currency: CURRENCY,
  });
}

export function trackInitiateCheckout(lines: CartLine[], value: number) {
  track("InitiateCheckout", { ...cartParams(lines), value });
}

export function trackAddPaymentInfo(lines: CartLine[], value: number) {
  track("AddPaymentInfo", { ...cartParams(lines), value });
}

/**
 * The order number is passed as the event id. It is unique per order, so Meta
 * discards a second Purchase carrying the same one — and it is what a
 * server-side (Conversions API) report of the same order would use to be
 * matched with this one rather than counted twice.
 */
export function trackPurchase(lines: CartLine[], value: number, orderNumber: string) {
  track("Purchase", { ...cartParams(lines), value }, orderNumber);
}
