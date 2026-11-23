import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { PostbridgeError, isPostbridgeEnabled, postbridge } from "@/lib/postbridge";

// Access is enforced by proxy.ts, as for the other admin routes.
//
// Serves the India Post shipping label (a PDF) through the shop, so the
// PostBridge key never reaches the browser. It only ever asks PostBridge for a
// label once the order has a tracking number: asking earlier could make
// PostBridge assign a barcode as a side effect, which is exactly the
// irreversible step that only the Book button may take.

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  if (!isPostbridgeEnabled()) {
    return NextResponse.json({ error: "Shipping with PostBridge is not switched on." }, { status: 409 });
  }

  const order = await prisma.order.findUnique({
    where: { id },
    select: { orderNumber: true, postbridgeSync: true, trackingNumber: true },
  });
  if (!order) return NextResponse.json({ error: "Order not found." }, { status: 404 });

  if (order.postbridgeSync !== "SENT" || !order.trackingNumber) {
    return NextResponse.json(
      { error: "This shipment has not been booked yet, so there is no label." },
      { status: 409 },
    );
  }

  try {
    const { bytes, contentType } = await postbridge.getLabel(order.orderNumber);
    return new Response(bytes, {
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `inline; filename="${order.orderNumber}-label.pdf"`,
        // A label is for printing once; it should not linger in a shared cache.
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    console.error("[postbridge] could not fetch the label for", order.orderNumber, err);
    const message = err instanceof PostbridgeError ? err.message : "Could not fetch the label.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
