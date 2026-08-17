import type { CheckoutSession, OrderConfirmation, OrderPayload } from "@/lib/types";

// This is the seam between the frontend and the backend. Checkout is two calls
// with the Razorpay modal between them, and both live here so the components
// never talk to the payment API directly.

/**
 * Step one: reserve the order and open a payment against it. Returns what the
 * modal needs — notably the amount, which is computed server-side from DB
 * prices and is not the total the cart happens to be showing.
 */
export async function startCheckout(payload: OrderPayload): Promise<CheckoutSession> {
  const res = await fetch("/api/orders", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const message = await res
      .json()
      .then((body: { error?: string }) => body.error)
      .catch(() => null);
    throw new Error(message ?? "Could not start checkout. Please try again.");
  }

  return res.json();
}

/** The three fields Razorpay's success handler hands back, verbatim. */
export interface RazorpaySuccess {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

/**
 * Step two: have the server check the signature and confirm the order. The
 * order is only real once this resolves — a success from the modal alone is
 * not something the client is allowed to act on.
 */
export async function confirmPayment(
  result: RazorpaySuccess,
): Promise<OrderConfirmation> {
  const res = await fetch("/api/payments/verify", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(result),
  });

  if (!res.ok) {
    throw new Error("We could not verify your payment.");
  }

  return res.json();
}
