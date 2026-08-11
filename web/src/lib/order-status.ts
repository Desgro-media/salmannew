import type { OrderStatus as PrismaOrderStatus } from "@prisma/client";

export type OrderStatus = PrismaOrderStatus;

/**
 * Mirrors Prisma's OrderStatus enum as plain strings.
 *
 * Deliberately not re-exported from "@prisma/client": that would be a *runtime*
 * dependency on the generated client, which breaks in two ways here. It is
 * undefined until `prisma generate` has run against the current schema, and it
 * cannot be bundled for the browser — and this module is imported by the
 * timeline UI, which renders on both sides.
 *
 * `satisfies` keeps it honest: if the schema enum gains or loses a member, this
 * stops compiling rather than silently drifting.
 */
export const OrderStatus = {
  RECEIVED: "RECEIVED",
  PACKED: "PACKED",
  SHIPPED: "SHIPPED",
  OUT_FOR_DELIVERY: "OUT_FOR_DELIVERY",
  DELIVERED: "DELIVERED",
  CANCELLED: "CANCELLED",
} as const satisfies Record<PrismaOrderStatus, PrismaOrderStatus>;

/**
 * The fulfilment line a parcel walks, in order. CANCELLED is deliberately not
 * here: it is a terminal state shown *instead of* the timeline, not a further
 * step along it, and including it would make "how far along is this order"
 * arithmetic wrong for every cancelled order.
 */
export const ORDER_TIMELINE = [
  OrderStatus.RECEIVED,
  OrderStatus.PACKED,
  OrderStatus.SHIPPED,
  OrderStatus.OUT_FOR_DELIVERY,
  OrderStatus.DELIVERED,
] as const;

export type TimelineStatus = (typeof ORDER_TIMELINE)[number];

/** Every status, including CANCELLED — for admin controls and payload validation. */
export const ALL_ORDER_STATUSES = [...ORDER_TIMELINE, OrderStatus.CANCELLED] as const;

export const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  RECEIVED: "Order placed",
  PACKED: "Packed",
  SHIPPED: "Shipped",
  OUT_FOR_DELIVERY: "Out for delivery",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
};

/** Customer-facing one-liner shown under each checkpoint. */
export const ORDER_STATUS_BLURB: Record<OrderStatus, string> = {
  RECEIVED: "We have your order and are getting it ready.",
  PACKED: "Boxed and waiting for pickup.",
  SHIPPED: "Handed to the courier and on its way.",
  OUT_FOR_DELIVERY: "With the delivery agent — arriving today.",
  DELIVERED: "Delivered. We hope you love it.",
  CANCELLED: "This order was cancelled. Any payment taken will be refunded.",
};

export function isCancelled(status: OrderStatus): boolean {
  return status === OrderStatus.CANCELLED;
}

/**
 * How far along the timeline a status sits, or -1 for CANCELLED. Callers use
 * this to decide which checkpoints render as reached.
 */
export function timelineIndex(status: OrderStatus): number {
  return (ORDER_TIMELINE as readonly OrderStatus[]).indexOf(status);
}

/**
 * Admin moves are unrestricted on purpose — parcels genuinely go backwards
 * (a failed delivery returns to the courier) and stages get skipped (a local
 * hand-delivery never "ships"). The only move rejected is a no-op, which would
 * otherwise litter the customer's timeline with duplicate checkpoints.
 */
export function isRedundantChange(current: OrderStatus, next: OrderStatus): boolean {
  return current === next;
}
