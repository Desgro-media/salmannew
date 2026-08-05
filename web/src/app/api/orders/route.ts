import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { calculateShipping } from "@/lib/shipping";
import { orderPayloadSchema } from "@/lib/order-schema";

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
  const shipping = calculateShipping(subtotal);
  const total = subtotal + shipping;

  const orderNumber = `SP-${Date.now().toString(36).toUpperCase()}`;
  const estimatedDeliveryDate = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000);

  const order = await prisma.order.create({
    data: {
      orderNumber,
      subtotal,
      shipping,
      total,
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

  return NextResponse.json({
    orderId: order.orderNumber,
    status: "received",
    estimatedDelivery: estimatedDeliveryDate.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "long",
    }),
  });
}
