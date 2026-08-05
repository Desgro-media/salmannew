import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getPurchaseStatsForProduct } from "@/lib/purchase-stats";

const PAGE_SIZE = 20;

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const { searchParams } = new URL(request.url);
  const page = Math.max(1, Number(searchParams.get("page") ?? "1") || 1);

  const product = await prisma.product.findUnique({ where: { id } });
  if (!product) {
    return NextResponse.json({ error: "Product not found." }, { status: 404 });
  }

  const [stats, total, orderItems] = await Promise.all([
    getPurchaseStatsForProduct(id),
    prisma.orderItem.count({ where: { productId: id } }),
    prisma.orderItem.findMany({
      where: { productId: id },
      include: { order: true },
      orderBy: { order: { createdAt: "desc" } },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
  ]);

  return NextResponse.json({
    ...stats,
    page,
    pageSize: PAGE_SIZE,
    totalItems: total,
    totalPages: Math.max(1, Math.ceil(total / PAGE_SIZE)),
    buyers: orderItems.map((item) => ({
      orderNumber: item.order.orderNumber,
      customerFullName: item.order.customerFullName,
      customerEmail: item.order.customerEmail,
      customerPhone: item.order.customerPhone,
      sizeLabel: item.sizeLabel,
      quantity: item.quantity,
      price: item.price,
      purchasedAt: item.order.createdAt,
    })),
  });
}
