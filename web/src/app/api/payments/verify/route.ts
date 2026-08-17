import { NextResponse } from "next/server";
import { z } from "zod";
import { isValidPaymentSignature } from "@/lib/razorpay";
import { markOrderPaid } from "@/lib/payments";

// The success path the customer actually waits on: the checkout modal reports
// a payment, the browser posts the three fields it was given, and this decides
// whether they are real.
//
// Treat the body as hostile. It arrives from the browser like any other
// request, so "razorpay said it succeeded" is a claim, not evidence — the
// signature is the evidence, and it is the only reason this route trusts
// anything it was sent.

export const dynamic = "force-dynamic";

const verifySchema = z.object({
  razorpay_order_id: z.string().min(1),
  razorpay_payment_id: z.string().min(1),
  razorpay_signature: z.string().min(1),
});

export async function POST(request: Request) {
  const parsed = verifySchema.safeParse(await request.json().catch(() => null));

  if (!parsed.success) {
    return NextResponse.json({ error: "Incomplete payment details." }, { status: 400 });
  }

  const {
    razorpay_order_id: razorpayOrderId,
    razorpay_payment_id: razorpayPaymentId,
    razorpay_signature: signature,
  } = parsed.data;

  if (!isValidPaymentSignature({ razorpayOrderId, razorpayPaymentId, signature })) {
    console.warn("[razorpay] rejected a payment with a bad signature", { razorpayOrderId });
    return NextResponse.json(
      { error: "We could not verify this payment." },
      { status: 400 },
    );
  }

  const confirmed = await markOrderPaid({ razorpayOrderId, razorpayPaymentId });

  // A valid signature for an order we have no row for should be impossible —
  // we created it. Worth a loud log rather than a silent 404, since it means
  // the row was deleted or the keys belong to a different environment.
  if (!confirmed) {
    console.error("[razorpay] verified a payment with no matching order", { razorpayOrderId });
    return NextResponse.json({ error: "Order not found." }, { status: 404 });
  }

  return NextResponse.json({
    orderId: confirmed.orderNumber,
    estimatedDelivery: confirmed.estimatedDelivery.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "long",
    }),
  });
}
