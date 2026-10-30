import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { calculateShipping } from "@/lib/shipping";
import { getStoreSettings } from "@/lib/store-settings";
import { codAvailability } from "@/lib/cod";
import { formatDeliveryDate, formatPrice } from "@/lib/format";
import { notifyOwnerAfterResponse } from "@/lib/payments";
import { orderPayloadSchema } from "@/lib/order-schema";
import { createRazorpayOrder, razorpayKeyId, toPaise } from "@/lib/razorpay";
import { verifyCustomerSessionToken, CUSTOMER_SESSION_COOKIE_NAME } from "@/lib/customer-auth";
import type { CustomerDetails } from "@/lib/types";

/**
 * Opens a checkout. Two paths, chosen by `paymentMethod`:
 *
 * ONLINE writes the order as PENDING and hands the browser what it needs to open
 * the Razorpay modal.
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
 *
 * COD has no gateway and nothing to wait for, so the order is real immediately:
 * it is written as COD_PENDING with its RECEIVED checkpoint in the same
 * transaction, and the owner is told straight away. The cash arrives at the
 * door, when the courier marks it delivered (see codPaymentChange).
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

  const { items, customer, paymentMethod } = parsed.data;

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
  const settings = await getStoreSettings();
  const shipping = calculateShipping(subtotal, settings);

  const orderNumber = `SP-${Date.now().toString(36).toUpperCase()}`;
  const estimatedDeliveryDate = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000);

  const orderLines = {
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
  };

  /** Everything both payment methods write, so the two paths cannot drift apart. */
  const sharedOrderData = {
    orderNumber,
    subtotal,
    shipping,
    customerId: customerSession?.sub,
    customerFullName: customer.fullName,
    customerEmail: customer.email,
    customerPhone: customer.phone,
    customerAddress: customer.address,
    customerCity: customer.city,
    customerState: customer.state,
    customerPincode: customer.pincode,
    estimatedDelivery: estimatedDeliveryDate,
    items: orderLines,
  } satisfies Omit<Prisma.OrderUncheckedCreateInput, "total">;

  async function saveOrder(data: Prisma.OrderUncheckedCreateInput) {
    return prisma.$transaction(async (tx) => {
      const created = await tx.order.create({ data });

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
  }

  if (paymentMethod === "COD") {
    // The browser hides the option when it is unavailable, but that is a
    // courtesy, not a control — the request can name COD regardless.
    const availability = codAvailability(subtotal + shipping, settings);
    if (!availability.available) {
      return NextResponse.json(
        {
          error:
            availability.reason === "disabled"
              ? "Cash on delivery isn't available right now. Please pay online."
              : `Cash on delivery is available on orders up to ${formatPrice(
                  settings.codMaxOrderValue,
                )}. Please pay online.`,
        },
        { status: 400 },
      );
    }

    // Nobody has paid anything, so the courier is working from these details
    // alone. Online checkout lets a sloppy phone number through because the
    // gateway has already proved the customer is real; here it is the only
    // thing standing between a parcel and a wrong door.
    const badContact = invalidCodContact(customer);
    if (badContact) {
      return NextResponse.json({ error: badContact }, { status: 400 });
    }

    const codFee = settings.codFee;
    const total = subtotal + shipping + codFee;

    const order = await saveOrder({
      ...sharedOrderData,
      total,
      codFee,
      paymentMethod: "COD",
      paymentStatus: "COD_PENDING",
      // The customer's timeline starts here rather than at payment, since
      // there is no payment to wait for. Written with the order, so a COD order
      // can never exist without its first checkpoint.
      statusEvents: { create: { status: "RECEIVED" } },
    });

    notifyOwnerAfterResponse({
      orderNumber,
      paymentMethod: "COD",
      subtotal,
      shipping,
      codFee,
      total,
      customerFullName: customer.fullName,
      customerEmail: customer.email,
      customerPhone: customer.phone,
      customerAddress: customer.address,
      customerCity: customer.city,
      customerState: customer.state,
      customerPincode: customer.pincode,
      items: orderLines.create.map((line) => ({
        name: line.name,
        sizeLabel: line.sizeLabel,
        quantity: line.quantity,
        price: line.price,
      })),
    });

    return NextResponse.json({
      orderId: order.orderNumber,
      estimatedDelivery: formatDeliveryDate(order.estimatedDelivery),
      total,
    });
  }

  const total = subtotal + shipping;

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

  const order = await saveOrder({
    ...sharedOrderData,
    total,
    razorpayOrderId: razorpayOrder.id,
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

/**
 * The extra checks a COD order gets, as a customer-facing message — or null when
 * the details are good enough to send a courier to.
 *
 * Deliberately loose on the phone (digits only, with room for a +91 prefix and
 * the spaces and dashes people type) and strict on the pincode, which is always
 * six digits in India and is what routes the parcel.
 */
function invalidCodContact(customer: CustomerDetails): string | null {
  const phoneDigits = customer.phone.replace(/\D/g, "");
  if (phoneDigits.length < 10 || phoneDigits.length > 13) {
    return "Enter a valid phone number — the delivery partner will call it before arriving.";
  }
  if (!/^\d{6}$/.test(customer.pincode)) {
    return "Enter a valid 6-digit pincode so we can deliver to you.";
  }
  return null;
}
