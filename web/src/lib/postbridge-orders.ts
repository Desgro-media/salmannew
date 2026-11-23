import { after } from "next/server";
import type { Order, OrderItem } from "@prisma/client";
import { prisma } from "@/lib/db";
import {
  PostbridgeError,
  isPostbridgeEnabled,
  postbridge,
  readOrderReply,
  readTracking,
  type PostbridgeOrderInput,
  type TrackingInfo,
} from "@/lib/postbridge";
import { formatScanTime, type ShipmentView } from "@/lib/shipment";
import { parcelWeight, type ParcelWeight } from "@/lib/parcel-weight";
import { getStoreSettings } from "@/lib/store-settings";

// What to send PostBridge for one of our orders, and what to do with each answer.
//
// The hand-off is deliberately separate from the order itself. Checkout, payment
// and the owner's email never wait on it and never fail because of it: a
// PostBridge outage leaves the order exactly as it was, marked FAILED, with a
// Retry button on the admin order page.

/** PostBridge's own words for where an order is — only the ones its docs name. */
export const PB_STATUS = {
  PLACED: "Order Placed",
  PENDING: "Pending",
  MANIFESTED: "Manifested",
  CANCELLED: "Cancelled",
} as const;

const is = (status: string | null | undefined, wanted: string) =>
  (status ?? "").trim().toLowerCase() === wanted.toLowerCase();

export type ActionResult = { ok: true } | { ok: false; status: number; error: string };
const fail = (status: number, error: string): ActionResult => ({ ok: false, status, error });

/** What an admin may read on screen: short, and never a stack trace. */
function describe(err: unknown): string {
  const text = err instanceof PostbridgeError ? err.message : "Something went wrong talking to PostBridge.";
  return text.length > 300 ? `${text.slice(0, 297)}…` : text;
}

/**
 * Real orders only: paid, or cash on delivery. A PENDING row is an abandoned
 * checkout, REFUNDED is money already handed back, and a cancelled order is not
 * going anywhere.
 */
export function isShippable(order: Pick<Order, "paymentStatus" | "status">): boolean {
  return (order.paymentStatus === "PAID" || order.paymentStatus === "COD_PENDING") && order.status !== "CANCELLED";
}

/** A courier reads this number: digits only, without a +91 or a leading 0. */
function cleanPhone(raw: string): string {
  let digits = raw.replace(/\D/g, "");
  if (digits.length === 12 && digits.startsWith("91")) digits = digits.slice(2);
  else if (digits.length === 11 && digits.startsWith("0")) digits = digits.slice(1);
  return digits;
}

/**
 * A fixed weight to use for an order containing a product nobody has weighed yet,
 * if the owner configured one. Only ever a safety net: a weight worked out from
 * the items always wins, because one number cannot suit both a single small
 * bottle and a box of several.
 */
function fallbackWeightGrams(): number | null {
  const grams = Math.round(Number(process.env.POSTBRIDGE_DEFAULT_WEIGHT_GRAMS));
  return Number.isFinite(grams) && grams > 0 ? grams : null;
}

/** An order with each line's size weight loaded, which is all the weighing needs. */
type WeighableOrder = { items: { quantity: number; size: { weightGrams: number | null } }[] };

/**
 * What this order's parcel weighs: the weight entered for each size times how many
 * were bought, plus the packing allowance from Settings. See lib/parcel-weight.ts.
 */
export async function weighOrder(order: WeighableOrder): Promise<ParcelWeight | null> {
  const { packingGrams } = await getStoreSettings();
  return parcelWeight(
    order.items.map((item) => ({ quantity: item.quantity, weightGrams: item.size.weightGrams })),
    packingGrams,
    fallbackWeightGrams(),
  );
}

export function buildPostbridgeOrder(
  order: Order & { items: OrderItem[] },
  weightGrams: number | null,
): PostbridgeOrderInput {
  const phone = cleanPhone(order.customerPhone);
  // PostBridge has no field for our cash-on-delivery fee, and what the courier
  // collects is amount + deliveryCharge. Folding the fee into the delivery
  // charge makes that sum equal what the customer was actually asked to pay.
  const deliveryCharge = order.shipping + order.codFee;

  return {
    // Our order number is the id: PostBridge treats a repeat of it as the same
    // order, so a retry can never ship twice.
    externalOrderId: order.orderNumber,
    customer: { name: order.customerFullName, phone, email: order.customerEmail },
    shippingAddress: {
      name: order.customerFullName,
      phone,
      email: order.customerEmail,
      fullAddress: order.customerAddress,
      pincode: order.customerPincode,
      city: order.customerCity,
      state: order.customerState,
      country: "India",
    },
    // The SKU is how PostBridge finds the product in its catalogue. The name is
    // only used when it can't.
    products: order.items.map((item) => ({
      sku: item.sku,
      qty: item.quantity,
      unitPrice: item.price,
      productName: `${item.name} (${item.sizeLabel})`,
    })),
    payment: { method: order.paymentMethod === "COD" ? "COD" : "Pre-paid" },
    amount: order.subtotal,
    deliveryCharge,
    totalOrderValue: order.total,
    // When left out, PostBridge uses the weights in its own catalogue — which is
    // why an order with nothing trustworthy to declare sends none at all.
    ...(weightGrams ? { shipment: { weightGrams } } : {}),
  };
}

/** The article number and link from PostBridge's tracking call, which is where it is authoritative. */
async function trackingFor(orderNumber: string): Promise<TrackingInfo | null> {
  try {
    return readTracking(await postbridge.getTracking(orderNumber));
  } catch (err) {
    console.error("[postbridge] could not read tracking for", orderNumber, err);
    return null;
  }
}

const notEnabled = () => fail(409, "Shipping with PostBridge is not switched on.");

/** Hands the order to PostBridge. Safe to repeat: PostBridge returns the order it already has. */
export async function sendToPostbridge(orderId: string): Promise<ActionResult> {
  if (!isPostbridgeEnabled()) return notEnabled();
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: { include: { size: { select: { weightGrams: true } } } } },
  });
  if (!order) return fail(404, "Order not found.");
  // Already there. Sending again would at best be a no-op, and a *failed* retry
  // must never flip an order PostBridge does hold to "failed".
  if (order.postbridgeSync === "SENT") return { ok: true };
  if (!isShippable(order)) return fail(409, "This order is unpaid or cancelled, so there is nothing to ship.");

  try {
    const weight = await weighOrder(order);
    const reply = await postbridge.createOrder(buildPostbridgeOrder(order, weight?.grams ?? null));
    let state = readOrderReply(reply);

    // An account set to book on arrival answers already booked: pick up the article.
    if (is(state.status, PB_STATUS.MANIFESTED) && !state.trackingNumber) {
      const tracking = await trackingFor(order.orderNumber);
      if (tracking?.trackingNumber) {
        state = { ...state, trackingNumber: tracking.trackingNumber, trackingUrl: tracking.trackingUrl ?? undefined };
      }
    }

    await prisma.order.update({
      where: { id: order.id },
      data: {
        postbridgeSync: "SENT",
        postbridgeError: null,
        postbridgeSyncedAt: new Date(),
        postbridgeStatus: state.status ?? "Sent",
        // Remembered so an admin can see what was declared if a parcel is ever billed oddly.
        postbridgeWeightGrams: weight?.grams ?? null,
        ...(state.trackingNumber ? { trackingNumber: state.trackingNumber, trackingUrl: state.trackingUrl ?? null } : {}),
      },
    });
    return { ok: true };
  } catch (err) {
    console.error("[postbridge] could not send", order.orderNumber, err);
    const message = describe(err);
    await prisma.order
      .update({ where: { id: order.id }, data: { postbridgeSync: "FAILED", postbridgeError: message } })
      .catch(() => {});
    return fail(502, message);
  }
}

/**
 * Books the shipment with India Post: a real parcel, a real article number,
 * not undoable from here. Only ever reached from an admin pressing the button.
 */
export async function bookShipment(orderId: string): Promise<ActionResult> {
  if (!isPostbridgeEnabled()) return notEnabled();
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) return fail(404, "Order not found.");

  if (order.postbridgeSync !== "SENT") return fail(409, "Send this order to PostBridge first.");
  if (order.status === "CANCELLED") return fail(409, "This order is cancelled.");
  if (is(order.postbridgeStatus, PB_STATUS.MANIFESTED) || order.trackingNumber) {
    return fail(409, "This shipment is already booked.");
  }
  if (is(order.postbridgeStatus, PB_STATUS.CANCELLED)) return fail(409, "This order was cancelled at PostBridge.");
  if (is(order.postbridgeStatus, PB_STATUS.PENDING)) {
    return fail(
      409,
      "PostBridge is holding this order as Pending: one of its product codes isn't in the PostBridge catalogue yet. Add it there, then press Refresh.",
    );
  }

  try {
    await postbridge.bookOrder(order.orderNumber);
    const tracking = await trackingFor(order.orderNumber);
    await prisma.order.update({
      where: { id: order.id },
      data: {
        // The docs promise the status becomes Manifested, so that is what is
        // recorded rather than whatever a reply field might be called.
        postbridgeStatus: PB_STATUS.MANIFESTED,
        postbridgeError: null,
        postbridgeSyncedAt: new Date(),
        trackingNumber: tracking?.trackingNumber ?? null,
        trackingUrl: tracking?.trackingUrl ?? null,
      },
    });
    return { ok: true };
  } catch (err) {
    console.error("[postbridge] could not book", order.orderNumber, err);
    const message = describe(err);
    await prisma.order.update({ where: { id: order.id }, data: { postbridgeError: message } }).catch(() => {});
    return fail(502, message);
  }
}

/** Re-reads the order from PostBridge, e.g. after it was booked or fixed in PostBridge itself. */
export async function refreshFromPostbridge(orderId: string): Promise<ActionResult> {
  if (!isPostbridgeEnabled()) return notEnabled();
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) return fail(404, "Order not found.");
  if (order.postbridgeSync !== "SENT") return fail(409, "This order has not been sent to PostBridge.");

  try {
    const state = readOrderReply(await postbridge.getOrder(order.orderNumber));
    let trackingNumber = state.trackingNumber ?? order.trackingNumber;
    let trackingUrl = state.trackingUrl ?? order.trackingUrl;

    if (is(state.status, PB_STATUS.MANIFESTED) || trackingNumber) {
      const tracking = await trackingFor(order.orderNumber);
      if (tracking?.trackingNumber) {
        trackingNumber = tracking.trackingNumber;
        trackingUrl = tracking.trackingUrl ?? trackingUrl;
      }
    }

    await prisma.order.update({
      where: { id: order.id },
      data: {
        postbridgeStatus: state.status ?? order.postbridgeStatus,
        postbridgeError: null,
        postbridgeSyncedAt: new Date(),
        trackingNumber,
        trackingUrl,
      },
    });
    return { ok: true };
  } catch (err) {
    console.error("[postbridge] could not refresh", order.orderNumber, err);
    return fail(502, describe(err));
  }
}

/**
 * Cancels the order at PostBridge. A no-op for an order PostBridge never had.
 * Once the shipment is booked PostBridge refuses, and the admin has to be told,
 * because the parcel is still going to move.
 */
export async function cancelAtPostbridge(orderId: string): Promise<ActionResult> {
  if (!isPostbridgeEnabled()) return { ok: true };
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) return fail(404, "Order not found.");
  if (order.postbridgeSync !== "SENT" || is(order.postbridgeStatus, PB_STATUS.CANCELLED)) return { ok: true };

  if (is(order.postbridgeStatus, PB_STATUS.MANIFESTED) || order.trackingNumber) {
    const message =
      "This shipment is already booked with India Post, so it can't be cancelled from here. Cancel it in PostBridge.";
    await prisma.order.update({ where: { id: order.id }, data: { postbridgeError: message } }).catch(() => {});
    return fail(409, message);
  }

  try {
    await postbridge.cancelOrder(order.orderNumber);
    await prisma.order.update({
      where: { id: order.id },
      data: { postbridgeStatus: PB_STATUS.CANCELLED, postbridgeError: null, postbridgeSyncedAt: new Date() },
    });
    return { ok: true };
  } catch (err) {
    console.error("[postbridge] could not cancel", order.orderNumber, err);
    const message = describe(err);
    await prisma.order.update({ where: { id: order.id }, data: { postbridgeError: message } }).catch(() => {});
    return fail(502, message);
  }
}

// ---------------------------------------------------------------------------
// Showing it
// ---------------------------------------------------------------------------

const scanCache = new Map<string, { at: number; info: TrackingInfo }>();
const CACHE_MS = 60_000;

/**
 * The tracking number and link are stored on the order; the scans change, so they
 * are read from PostBridge when shown — cached for a minute so a customer
 * refreshing the page does not become a request per refresh. If PostBridge is
 * unreachable the stored number and link still show.
 */
export async function loadShipment(
  order: Pick<Order, "orderNumber" | "postbridgeSync" | "trackingNumber" | "trackingUrl">,
): Promise<ShipmentView | null> {
  if (!order.trackingNumber) return null;
  const stored: ShipmentView = {
    trackingNumber: order.trackingNumber,
    trackingUrl: order.trackingUrl,
    scans: [],
    scansLoaded: false,
  };
  if (!isPostbridgeEnabled() || order.postbridgeSync !== "SENT") return stored;

  let info = scanCache.get(order.orderNumber);
  if (!info || Date.now() - info.at > CACHE_MS) {
    const fresh = await trackingFor(order.orderNumber);
    if (!fresh) return stored;
    if (scanCache.size > 200) scanCache.clear();
    info = { at: Date.now(), info: fresh };
    scanCache.set(order.orderNumber, info);
  }

  return {
    trackingNumber: info.info.trackingNumber ?? stored.trackingNumber,
    trackingUrl: info.info.trackingUrl ?? stored.trackingUrl,
    // Formatted here, on the server, so what a page prints is the same text on
    // both sides of hydration.
    scans: info.info.scans.map((scan) => ({ ...scan, at: formatScanTime(scan.at) || null })),
    scansLoaded: true,
  };
}

// ---------------------------------------------------------------------------
// Triggers
// ---------------------------------------------------------------------------

/**
 * Sends a new order once the response has gone out, so neither the customer nor
 * Razorpay's webhook waits on PostBridge. `after()` keeps the function alive until
 * it settles, unlike a bare unawaited promise. Does nothing while the integration
 * is switched off.
 */
export function sendToPostbridgeAfterResponse(orderId: string): void {
  if (!isPostbridgeEnabled()) return;
  after(async () => {
    try {
      await sendToPostbridge(orderId);
    } catch (err) {
      console.error("[postbridge] send failed for", orderId, err);
    }
  });
}

/** Cancels at PostBridge after an admin cancels the order here. */
export function cancelAtPostbridgeAfterResponse(orderId: string): void {
  if (!isPostbridgeEnabled()) return;
  after(async () => {
    try {
      await cancelAtPostbridge(orderId);
    } catch (err) {
      console.error("[postbridge] cancel failed for", orderId, err);
    }
  });
}
