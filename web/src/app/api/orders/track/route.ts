import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { PAID_ORDER_FILTER } from "@/lib/payments";
import { CUSTOMER_SESSION_COOKIE_NAME, verifyCustomerSessionToken } from "@/lib/customer-auth";

// Lookup is open to guests, because checkout does not require an account — a
// guest order has customerId null and would otherwise be untrackable by anyone.
//
// Order numbers are `SP-${Date.now().toString(36)}`, so they are sequential and
// trivially guessable. Something must therefore prove the requester owns the
// order before it reveals a name and city, and there are two ways to do that:
//
//   signed in — the session already establishes identity, so no email is asked
//               for. Matches on customerId, or on the session's email so that
//               orders placed as a guest before signing up still resolve.
//   guest     — the email typed at checkout is the proof.
//
// Either way the check happens inside the query, so a failed match is
// indistinguishable from a nonexistent order.

export const dynamic = "force-dynamic";

const lookupSchema = z.object({
  orderNumber: z.string().trim().min(1).max(64),
  // Optional: a signed-in customer is identified by their session instead.
  email: z.string().trim().email().optional(),
});

export async function POST(request: Request) {
  const parsed = lookupSchema.safeParse(await request.json().catch(() => null));

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Enter both your order number and the email you ordered with." },
      { status: 400 },
    );
  }

  const { orderNumber, email } = parsed.data;

  const cookieStore = await cookies();
  const sessionToken = cookieStore.get(CUSTOMER_SESSION_COOKIE_NAME)?.value;
  const session = sessionToken ? await verifyCustomerSessionToken(sessionToken) : null;

  if (!session && !email) {
    return NextResponse.json(
      { error: "Enter the email you used at checkout." },
      { status: 400 },
    );
  }

  // An explicitly typed email still has to match, even when signed in — that is
  // how someone looks up an order placed under a different address, and it must
  // not become a way to read orders that are not theirs.
  const ownership = email
    ? [{ customerEmail: { equals: email, mode: "insensitive" as const } }]
    : [
        { customerId: session!.sub },
        { customerEmail: { equals: session!.email, mode: "insensitive" as const } },
      ];

  // Ownership is matched in the query rather than compared afterwards, so the
  // email never enters the response object and cannot be echoed back to someone
  // who merely guessed a number. `select` is likewise an allowlist: the
  // customer's phone and street address stay server-side.
  const order = await prisma.order.findFirst({
    where: {
      orderNumber: orderNumber.toUpperCase(),
      OR: ownership,
      // An unpaid checkout is not a trackable order, and saying "we couldn't
      // find it" is the truthful answer for one.
      ...PAID_ORDER_FILTER,
    },
    select: {
      orderNumber: true,
      status: true,
      total: true,
      createdAt: true,
      estimatedDelivery: true,
      customerFullName: true,
      customerCity: true,
      customerState: true,
      items: {
        select: { id: true, name: true, sizeLabel: true, quantity: true, image: true },
      },
      statusEvents: {
        orderBy: { createdAt: "asc" },
        select: { status: true, note: true, createdAt: true },
      },
    },
  });

  // One message for "no such order" and for "wrong email" alike. Distinguishing
  // them would turn this into an oracle for which order numbers exist.
  if (!order) {
    return NextResponse.json(
      { error: "We couldn't find an order with that number and email." },
      { status: 404 },
    );
  }

  return NextResponse.json({ order });
}
