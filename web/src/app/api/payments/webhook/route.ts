import { NextResponse } from "next/server";
import { isValidWebhookSignature } from "@/lib/razorpay";
import { markOrderPaid, markOrderPaymentFailed } from "@/lib/payments";

/**
 * Razorpay's server-to-server report of what happened to a payment.
 *
 * This exists because the browser is not a reliable narrator of its own
 * checkout. A customer who pays and immediately closes the tab, or whose phone
 * drops off wifi during the redirect, never reaches /api/payments/verify — and
 * without this route their money would be taken against an order that stayed
 * PENDING forever. Both paths converge on markOrderPaid(), which is written to
 * be safe to run twice.
 *
 * Configure in the Razorpay dashboard (Settings → Webhooks) against
 * `<public-url>/api/payments/webhook` with the `payment.captured` and
 * `payment.failed` events, and put the secret it gives you in
 * RAZORPAY_WEBHOOK_SECRET.
 */

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const signature = request.headers.get("x-razorpay-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing signature." }, { status: 400 });
  }

  // The raw text, not a re-serialised object: the digest is over the exact
  // bytes Razorpay signed, and JSON.stringify would not reproduce them.
  const rawBody = await request.text();

  let verified: boolean;
  try {
    verified = isValidWebhookSignature(rawBody, signature);
  } catch (error) {
    // Only thrown when the secret is unset, which is a deployment fault. 500 is
    // right: it tells Razorpay to retry, and these are recoverable once set.
    console.error("[razorpay] webhook secret is not configured", error);
    return NextResponse.json({ error: "Webhook not configured." }, { status: 500 });
  }

  if (!verified) {
    console.warn("[razorpay] rejected a webhook with a bad signature");
    return NextResponse.json({ error: "Invalid signature." }, { status: 400 });
  }

  const payload = JSON.parse(rawBody);
  const event: string = payload?.event;
  const entity = payload?.payload?.payment?.entity;
  const razorpayOrderId: string | undefined = entity?.order_id;
  const razorpayPaymentId: string | undefined = entity?.id;

  if (!razorpayOrderId || !razorpayPaymentId) {
    // Signed by Razorpay but not a payment event we model. Acknowledged, so it
    // is not retried forever.
    return NextResponse.json({ received: true });
  }

  if (event === "payment.captured") {
    const confirmed = await markOrderPaid({ razorpayOrderId, razorpayPaymentId });
    if (!confirmed) {
      console.error("[razorpay] webhook for an unknown order", { razorpayOrderId });
    }
  } else if (event === "payment.failed") {
    await markOrderPaymentFailed(razorpayOrderId);
  }

  // Anything that reaches here has been handled or deliberately ignored. A 200
  // stops Razorpay's retry schedule; failures above are logged, not re-raised,
  // because a retry would hit the same fault.
  return NextResponse.json({ received: true });
}
