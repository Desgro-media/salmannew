import { NextResponse } from "next/server";
import { z } from "zod";
import {
  bookShipment,
  cancelAtPostbridge,
  refreshFromPostbridge,
  sendToPostbridge,
} from "@/lib/postbridge-orders";

// Access is enforced by proxy.ts, which guards /api/admin/:path* and keeps
// DELIVERY-role sessions out of it — the same as the other admin routes.
//
// One endpoint for what an admin can do about an order's India Post shipment.
// `book` is the one that matters: it creates a real shipment, so it exists only
// here, behind an admin session and a confirmation in the page, and never runs on
// its own from anywhere else in the app.

export const dynamic = "force-dynamic";

const bodySchema = z.object({ action: z.enum(["send", "book", "refresh", "cancel"]) });

const actions = {
  send: sendToPostbridge,
  book: bookShipment,
  refresh: refreshFromPostbridge,
  cancel: cancelAtPostbridge,
} as const;

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Unknown action." }, { status: 400 });
  }

  const result = await actions[parsed.data.action](id);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }
  return NextResponse.json({ ok: true });
}
