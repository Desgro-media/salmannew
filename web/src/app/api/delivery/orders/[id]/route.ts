import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { SESSION_COOKIE_NAME, verifySessionToken } from "@/lib/auth";
import { ALL_ORDER_STATUSES, isRedundantChange } from "@/lib/order-status";

// Access is enforced by proxy.ts, which guards /api/delivery/:path* to
// DELIVERY-role sessions only. The session is re-read here only to attribute
// the change to a delivery account, not to authorise it.

const patchSchema = z.object({
  status: z.enum(ALL_ORDER_STATUSES),
  // Optional customer-visible line shown against this checkpoint.
  note: z.string().trim().max(280).optional(),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const parsed = patchSchema.safeParse(await request.json().catch(() => null));

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Pick a valid status. Notes are limited to 280 characters." },
      { status: 400 },
    );
  }

  const { status, note } = parsed.data;

  const order = await prisma.order.findUnique({
    where: { id },
    select: { id: true, status: true },
  });
  if (!order) {
    return NextResponse.json({ error: "Order not found." }, { status: 404 });
  }

  // Re-selecting the same stage would append a duplicate checkpoint to the
  // customer's timeline for no reason. A note-only update is still allowed.
  if (isRedundantChange(order.status, status) && !note) {
    return NextResponse.json(
      { error: `This order is already marked ${status.toLowerCase().replace(/_/g, " ")}.` },
      { status: 409 },
    );
  }

  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  const session = token ? await verifySessionToken(token) : null;

  // The order's current stage and its history have to move together, or a
  // failure between them would leave a timeline that disagrees with the badge.
  await prisma.$transaction([
    prisma.order.update({ where: { id }, data: { status } }),
    prisma.orderStatusEvent.create({
      data: {
        orderId: id,
        status,
        note: note || null,
        adminId: session?.sub ?? null,
      },
    }),
  ]);

  return NextResponse.json({ ok: true, status });
}
