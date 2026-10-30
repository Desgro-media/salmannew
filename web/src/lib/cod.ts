import { OrderStatus } from "@/lib/order-status";
import { PaymentMethod, PaymentStatus } from "@/lib/payment-status";

/**
 * Cash-on-delivery rules, configured in admin (StoreSettings) like shipping.
 *
 * Pure functions of their arguments with no database import, for the same
 * reason shipping.ts is: the checkout form renders in a Client Component and
 * would drag Prisma into the browser bundle otherwise. The server re-runs these
 * in /api/orders — the browser's copy is only a preview of the same decision.
 */

export interface CodSettings {
  codEnabled: boolean;
  /** Extra charge on COD orders, in whole rupees. 0 means none. */
  codFee: number;
  /** Largest order value COD is offered on, in whole rupees. 0 means no cap. */
  codMaxOrderValue: number;
}

/** Match the column defaults — what checkout falls back to if the row is missing. */
export const DEFAULT_COD_SETTINGS: CodSettings = {
  codEnabled: true,
  codFee: 0,
  codMaxOrderValue: 5000,
};

export type CodAvailability =
  | { available: true }
  | { available: false; reason: "disabled" | "over-limit" };

/**
 * Whether a COD order can be placed for this much.
 *
 * `orderValue` is items plus delivery, deliberately *without* the COD fee: the
 * cap is about how much cash a courier is asked to carry back, and the fee is
 * the shop's own surcharge on top of a value the customer can see and compare.
 */
export function codAvailability(orderValue: number, settings: CodSettings): CodAvailability {
  if (!settings.codEnabled) return { available: false, reason: "disabled" };
  if (settings.codMaxOrderValue > 0 && orderValue > settings.codMaxOrderValue) {
    return { available: false, reason: "over-limit" };
  }
  return { available: true };
}

/**
 * The payment fields that must move with a fulfilment change.
 *
 * A COD order is paid in cash at the door, so the money arrives at exactly one
 * fulfilment transition: DELIVERED. Moving there settles it, and moving back off
 * DELIVERED (a mis-tap corrected, or a return) un-settles it, so the books never
 * say cash was collected for a parcel that is not with the customer.
 *
 * Returns an empty object for everything else — online orders are settled by
 * Razorpay and never touched by a fulfilment change.
 */
export function codPaymentChange(
  order: { paymentMethod: PaymentMethod; paymentStatus: PaymentStatus },
  newStatus: OrderStatus,
): { paymentStatus?: PaymentStatus; paidAt?: Date | null } {
  if (order.paymentMethod !== PaymentMethod.COD) return {};

  if (newStatus === OrderStatus.DELIVERED && order.paymentStatus === PaymentStatus.COD_PENDING) {
    return { paymentStatus: PaymentStatus.PAID, paidAt: new Date() };
  }

  if (newStatus !== OrderStatus.DELIVERED && order.paymentStatus === PaymentStatus.PAID) {
    return { paymentStatus: PaymentStatus.COD_PENDING, paidAt: null };
  }

  return {};
}
