import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import { calculateShipping } from "@/lib/shipping";
import { getStoreSettings } from "@/lib/store-settings";
import { orderPayloadSchema } from "@/lib/order-schema";
import { createRazorpayOrder, razorpayKeyId, toPaise } from "@/lib/razorpay";
import { verifyCustomerSessionToken, CUSTOMER_SESSION_COOKIE_NAME } from "@/lib/customer-auth";

/**
 * Opens a checkout: writes the order as PENDING and hands the browser what it
 * needs to open the Razorpay modal.
 *
 * The order row is created *before* payment on purpose. The webhook identifies
 * an order by its Razorpay order id, so a row has to exist to be found — and a
 * customer who pays and then loses their connection must still end up with an
 * order. The cost is a PENDING row per abandoned checkout, which is the honest
 * record of what happened and is filtered out of the fulfilment queue.
 *
 * Nothing here is customer-visible yet: the RECEIVED checkpoint is raised by
 * markOrderPaid(), so an unpaid order has an empty timeline and cannot be
 * tracked.
 */
export async function POST(request: Request) {
  const json = await request.json();
  const parsed = orderPayloadSchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Missing items or customer details." },
      { status: 400 },
    );
  }

  const { items, customer } = parsed.data;

  const cookieStore = await cookies();
  const sessionToken = cookieStore.get(CUSTOMER_SESSION_COOKIE_NAME)?.value;
  const customerSession = sessionToken ? await verifyCustomerSessionToken(sessionToken) : null;

  // Re-resolve authoritative prices from the DB — never trust a client-sent
  // price, since the request body is fully attacker-controlled.
  const sizes = await prisma.productSize.findMany({
    where: { id: { in: items.map((item) => item.sizeId) } },
    include: { product: true },
  });
  const sizeById = new Map(sizes.map((size) => [size.id, size]));

  for (const item of items) {
    if (!sizeById.has(item.sizeId)) {
      return NextResponse.json(
        { error: `Unknown product size: ${item.sizeId}` },
        { status: 400 },
      );
    }
  }

  const subtotal = items.reduce((sum, item) => {
    const size = sizeById.get(item.sizeId)!;
    return sum + size.price * item.quantity;
  }, 0);
  // Read here, not taken from the client: the summary the browser rendered may
  // predate an admin changing the rate, and the charge must follow the current
  // setting rather than a stale page.
  const shipping = calculateShipping(subtotal, await getStoreSettings());
  const total = subtotal + shipping;

  const orderNumber = `SP-${Date.now().toString(36).toUpperCase()}`;
  const estimatedDeliveryDate = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000);

  // Before the row, so a gateway outage leaves no orphan PENDING order behind.
  let razorpayOrder;
  try {
    razorpayOrder = await createRazorpayOrder({
      amountInPaise: toPaise(total),
      receipt: orderNumber,
      // Surfaced in the Razorpay dashboard, which is where reconciliation
      // actually happens when someone asks about a specific payment.
      notes: { orderNumber, customerEmail: customer.email },
    });
  } catch (error) {
    console.error("[razorpay] could not create order", error);
    return NextResponse.json(
      { error: "Payment could not be started. Please try again in a moment." },
      { status: 502 },
    );
  }

  const order = await prisma.$transaction(async (tx) => {
    const created = await tx.order.create({
      data: {
        orderNumber,
        subtotal,
        shipping,
        total,
        razorpayOrderId: razorpayOrder.id,
        customerId: customerSession?.sub,
        customerFullName: customer.fullName,
        customerEmail: customer.email,
        customerPhone: customer.phone,
        customerAddress: customer.address,
        customerCity: customer.city,
        customerState: customer.state,
        customerPincode: customer.pincode,
        estimatedDelivery: estimatedDeliveryDate,
        items: {
          create: items.map((item) => {
            const size = sizeById.get(item.sizeId)!;
            return {
              productId: size.productId,
              sizeId: size.id,
              name: size.product.name,
              sizeLabel: size.label,
              price: size.price,
              image: size.image,
              quantity: item.quantity,
              sku: size.sku,
            };
          }),
        },
      },
    });

    // Keep the account's saved details in sync with the latest checkout, so
    // it prefills correctly next time.
    if (customerSession) {
      await tx.customer.update({
        where: { id: customerSession.sub },
        data: {
          fullName: customer.fullName,
          phone: customer.phone,
          address: customer.address,
          city: customer.city,
          state: customer.state,
          pincode: customer.pincode,
        },
      });
    }

    return created;
  });

  return NextResponse.json({
    orderId: order.orderNumber,
    razorpayOrderId: razorpayOrder.id,
    // Echoed from Razorpay rather than recomputed, so the modal can only ever
    // display the figure the gateway will actually charge.
    amount: razorpayOrder.amount,
    currency: razorpayOrder.currency,
    keyId: razorpayKeyId(),
    prefill: {
      name: customer.fullName,
      email: customer.email,
      contact: customer.phone,
    },
  });
}
