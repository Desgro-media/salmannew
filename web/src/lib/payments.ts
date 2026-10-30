import type { Prisma } from "@prisma/client";
import { after } from "next/server";
import { prisma } from "@/lib/db";
import { OrderStatus } from "@/lib/order-status";
import { notifyOwnerOfNewOrder, type NewOrderSummary } from "@/lib/notify-owner";

/**
 * What counts as a real order: one the customer has actually committed to,
 * either because the money arrived or because they will hand it over on delivery.
 *
 * A PENDING row is a checkout someone opened and walked away from, and a FAILED
 * one is a card that was declined — neither is something to pack, track, or show
 * a customer as an order. Both still exist as rows, deliberately, because they
 * are the record of what was attempted.
 *
 * COD_PENDING is the opposite case: no money yet, but a real order to pack and
 * ship, so it belongs in the queue from the moment it is placed.
 *
 * Exported as one constant because six different queries need this and the day
 * they disagree is the day an unpaid parcel ships. REFUNDED stays included: the
 * order was real and may already be halfway to the customer.
 *
 * It is deliberately a single `paymentStatus` clause rather than an `OR`, so it
 * can be spread next to a caller's own `OR` (the tracking lookup has one for
 * ownership) without silently replacing it.
 */
export const PLACED_ORDER_FILTER = {
  paymentStatus: { in: ["PAID", "REFUNDED", "COD_PENDING"] },
} satisfies Prisma.OrderWhereInput;

/**
 * Promotes a PENDING order to PAID, and raises the RECEIVED checkpoint that the
 * customer's tracking timeline starts from.
 *
 * Two independent things call this for the same payment: the browser, straight
 * after the modal reports success, and Razorpay's webhook. Whichever arrives
 * first does the work — the browser usually, the webhook when the customer
 * closed the tab on the confirmation screen or their connection dropped mid-way.
 *
 * So it has to be idempotent, and the `updateMany` on `paymentStatus: PENDING`
 * is what makes it so: the second caller matches zero rows and skips the status
 * event rather than appending a duplicate "Order placed" to the timeline. Doing
 * this as a conditional update rather than read-then-write also closes the race
 * where both arrive at once and each sees PENDING.
 *
 * That same `count > 0` check is also what gates the owner's new-order email —
 * it fires exactly once per order, on whichever caller wins the race, never on
 * the loser.
 */
export async function markOrderPaid(input: {
  razorpayOrderId: string;
  razorpayPaymentId: string;
}): Promise<{ orderNumber: string; estimatedDelivery: Date } | null> {
  const result = await prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({
      where: { razorpayOrderId: input.razorpayOrderId },
      select: {
        id: true,
        orderNumber: true,
        estimatedDelivery: true,
        paymentStatus: true,
        paymentMethod: true,
        subtotal: true,
        shipping: true,
        codFee: true,
        total: true,
        customerFullName: true,
        customerEmail: true,
        customerPhone: true,
        customerAddress: true,
        customerCity: true,
        customerState: true,
        customerPincode: true,
        items: {
          select: { name: true, sizeLabel: true, quantity: true, price: true },
        },
      },
    });

    if (!order) return null;

    const { count } = await tx.order.updateMany({
      where: { id: order.id, paymentStatus: "PENDING" },
      data: {
        paymentStatus: "PAID",
        razorpayPaymentId: input.razorpayPaymentId,
        paidAt: new Date(),
      },
    });

    if (count > 0) {
      await tx.orderStatusEvent.create({
        data: { orderId: order.id, status: OrderStatus.RECEIVED },
      });
    }

    return { order, justPaid: count > 0 };
  });

  if (!result) return null;

  if (result.justPaid) notifyOwnerAfterResponse(result.order);

  return { orderNumber: result.order.orderNumber, estimatedDelivery: result.order.estimatedDelivery };
}

/**
 * Emails the owner about a new order once the response has gone out, so a slow
 * (or down) Brevo API never adds latency to the confirmation the customer — or
 * Razorpay's webhook — is waiting on. `after()` keeps the serverless function
 * alive until this settles, unlike a bare unawaited promise.
 *
 * Shared by the two ways an order becomes real: a verified online payment
 * (above) and a cash-on-delivery order being placed (/api/orders).
 */
export function notifyOwnerAfterResponse(order: NewOrderSummary): void {
  after(() =>
    notifyOwnerOfNewOrder(order).catch((error) => {
      console.error("[email] failed to notify owner of order", order.orderNumber, error);
    }),
  );
}

/**
 * Records a failed attempt. Only ever moves a PENDING row, so a late
 * `payment.failed` for one abandoned attempt cannot undo a later successful
 * one on the same order.
 */
export async function markOrderPaymentFailed(razorpayOrderId: string): Promise<void> {
  await prisma.order.updateMany({
    where: { razorpayOrderId, paymentStatus: "PENDING" },
    data: { paymentStatus: "FAILED" },
  });
}
