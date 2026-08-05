import { prisma } from "./db";

export interface ProductPurchaseStats {
  uniqueBuyerCount: number;
  totalUnitsSold: number;
}

// Low-volume admin tool: aggregating in JS over all order items is simpler
// and fast enough here than hand-rolling a raw SQL COUNT(DISTINCT ...) query.
export async function getPurchaseStatsByProduct(): Promise<Map<string, ProductPurchaseStats>> {
  const items = await prisma.orderItem.findMany({
    select: {
      productId: true,
      quantity: true,
      order: { select: { customerEmail: true } },
    },
  });

  const buyersByProduct = new Map<string, Set<string>>();
  const stats = new Map<string, ProductPurchaseStats>();

  for (const item of items) {
    const buyers = buyersByProduct.get(item.productId) ?? new Set<string>();
    buyers.add(item.order.customerEmail);
    buyersByProduct.set(item.productId, buyers);

    const current = stats.get(item.productId) ?? { uniqueBuyerCount: 0, totalUnitsSold: 0 };
    current.totalUnitsSold += item.quantity;
    stats.set(item.productId, current);
  }

  for (const [productId, buyers] of buyersByProduct) {
    const current = stats.get(productId)!;
    current.uniqueBuyerCount = buyers.size;
  }

  return stats;
}

export async function getPurchaseStatsForProduct(productId: string): Promise<ProductPurchaseStats> {
  const items = await prisma.orderItem.findMany({
    where: { productId },
    select: { quantity: true, order: { select: { customerEmail: true } } },
  });

  const buyers = new Set(items.map((item) => item.order.customerEmail));
  const totalUnitsSold = items.reduce((sum, item) => sum + item.quantity, 0);

  return { uniqueBuyerCount: buyers.size, totalUnitsSold };
}
