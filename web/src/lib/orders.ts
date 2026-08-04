import type { OrderConfirmation, OrderPayload } from "@/lib/types";

// This is the seam between the frontend and a real backend. Today it calls a
// local route handler that mocks a response; swapping in a real order/payment
// service later means changing app/api/orders/route.ts, not this function or
// any of its call sites.
export async function placeOrder(
  payload: OrderPayload,
): Promise<OrderConfirmation> {
  const res = await fetch("/api/orders", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    throw new Error("Could not place order. Please try again.");
  }

  return res.json();
}
