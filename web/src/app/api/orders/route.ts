import { NextResponse } from "next/server";
import type { OrderPayload } from "@/lib/types";

// Mock order endpoint. Validates the shape a real order-service would expect
// and returns a confirmation. Replace the body of this handler with a real
// payment capture + database write (e.g. Razorpay order + Postgres insert)
// when the backend is ready — the request/response contract can stay as-is.
export async function POST(request: Request) {
  const payload = (await request.json()) as Partial<OrderPayload>;

  if (!payload.items?.length || !payload.customer?.email) {
    return NextResponse.json(
      { error: "Missing items or customer details." },
      { status: 400 },
    );
  }

  const orderId = `SP-${Date.now().toString(36).toUpperCase()}`;
  const estimatedDelivery = new Date(
    Date.now() + 5 * 24 * 60 * 60 * 1000,
  ).toLocaleDateString("en-IN", { day: "numeric", month: "long" });

  await new Promise((resolve) => setTimeout(resolve, 600));

  return NextResponse.json({
    orderId,
    status: "received",
    estimatedDelivery,
  });
}
