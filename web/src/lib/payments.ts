import type { Prisma } from "@prisma/client";
import { after } from "next/server";
import { prisma } from "@/lib/db";
import { OrderStatus } from "@/lib/order-status";
import { notifyOwnerOfPaidOrder } from "@/lib/notify-owner";

/**
 * What counts as a real order: one the money arrived for.
 *
 * A PENDING row is a checkout someone opened and walked away from, and a FAILED
 * one is a card that was declined — neither is something to pack, track, or show
 * a customer as an order. Both still exist as rows, deliberately, because they
 * are the record of what was attempted.
 *
 * Exported as one constant because six different queries need this and the day
 * they disagree is the day an unpaid parcel ships. REFUNDED stays included: the
 * order was real and may already be halfway to the customer.
 */
export const PAID_ORDER_FILTER = {
  paymentStatus: { in: ["PAID", "REFUNDED"] },
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
        subtotal: true,
        shipping: true,
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

  if (result.justPaid) {
    // Scheduled for after the response goes out, so a slow (or down) Brevo
    // API never adds latency to the payment confirmation the customer or
    // Razorpay's webhook is waiting on. `after()` keeps the serverless
    // function alive until this settles, unlike a bare unawaited promise.
    after(() =>
      notifyOwnerOfPaidOrder(result.order).catch((error) => {
        console.error("[email] failed to notify owner of order", result.order.orderNumber, error);
      }),
    );
  }

  return { orderNumber: result.order.orderNumber, estimatedDelivery: result.order.estimatedDelivery };
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
