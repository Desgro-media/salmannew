import type { Prisma } from "@prisma/client";
import { prisma } from "./db";

export interface ProductPurchaseStats {
  uniqueBuyerCount: number;
  totalUnitsSold: number;
  /**
   * Whole rupees taken for the product itself: each line's price (snapshotted at
   * checkout, so later repricing cannot rewrite it) times its quantity. Shipping
   * and the COD fee belong to the order rather than any one product, so they are
   * not in here.
   */
  totalRevenue: number;
}

export const EMPTY_PURCHASE_STATS: ProductPurchaseStats = {
  uniqueBuyerCount: 0,
  totalUnitsSold: 0,
  totalRevenue: 0,
};

/**
 * Which orders count as a sale in the admin numbers.
 *
 * Narrower than PLACED_ORDER_FILTER (payments.ts), which is about what needs
 * packing and so keeps REFUNDED and cancelled parcels in view. Here the question
 * is what the shop actually earned: an abandoned checkout (PENDING), a declined
 * card (FAILED), a refund, or a cancelled order brought in nothing and must not
 * be added to revenue. COD_PENDING stays in — a real order, cash due on delivery.
 *
 * One constant shared by every figure, so buyers, units and revenue always
 * describe the same set of orders.
 */
export const SOLD_ORDER_FILTER = {
  paymentStatus: { in: ["PAID", "COD_PENDING"] },
  status: { not: "CANCELLED" },
} satisfies Prisma.OrderWhereInput;

// Low-volume admin tool: aggregating in JS over all order items is simpler
// and fast enough here than hand-rolling a raw SQL COUNT(DISTINCT ...) query.
export async function getPurchaseStatsByProduct(): Promise<Map<string, ProductPurchaseStats>> {
  const items = await prisma.orderItem.findMany({
    where: { order: SOLD_ORDER_FILTER },
    select: {
      productId: true,
      quantity: true,
      price: true,
      order: { select: { customerEmail: true } },
    },
  });

  const buyersByProduct = new Map<string, Set<string>>();
  const stats = new Map<string, ProductPurchaseStats>();

  for (const item of items) {
    const buyers = buyersByProduct.get(item.productId) ?? new Set<string>();
    buyers.add(item.order.customerEmail);
    buyersByProduct.set(item.productId, buyers);

    const current = stats.get(item.productId) ?? { ...EMPTY_PURCHASE_STATS };
    current.totalUnitsSold += item.quantity;
    current.totalRevenue += item.price * item.quantity;
    stats.set(item.productId, current);
  }

  for (const [productId, buyers] of buyersByProduct) {
    const current = stats.get(productId)!;
    current.uniqueBuyerCount = buyers.size;
  }

  return stats;
}

/** One row of the working: `quantity` units of one size, all sold at `unitPrice`. */
export interface SalesLine {
  sizeLabel: string;
  unitPrice: number;
  quantity: number;
  /** `unitPrice × quantity`, in whole rupees. */
  amount: number;
}

/**
 * The sum behind each product's revenue, line by line.
 *
 * Grouped by size *and* price rather than size alone: the price on an order item
 * is the one charged at checkout, so a size that was repriced mid-way shows as
 * two lines (30 ml at ₹899, 30 ml at ₹999) instead of one blended average that
 * no customer ever paid.
 */
export async function getSalesLinesByProduct(): Promise<Map<string, SalesLine[]>> {
  const groups = await prisma.orderItem.groupBy({
    by: ["productId", "sizeLabel", "price"],
    where: { order: SOLD_ORDER_FILTER },
    _sum: { quantity: true },
  });

  const byProduct = new Map<string, SalesLine[]>();
  for (const group of groups) {
    const quantity = group._sum.quantity ?? 0;
    const lines = byProduct.get(group.productId) ?? [];
    lines.push({
      sizeLabel: group.sizeLabel,
      unitPrice: group.price,
      quantity,
      amount: group.price * quantity,
    });
    byProduct.set(group.productId, lines);
  }

  for (const lines of byProduct.values()) {
    lines.sort((a, b) => a.unitPrice - b.unitPrice || a.sizeLabel.localeCompare(b.sizeLabel));
  }

  return byProduct;
}

export interface SalesSummary {
  /** Orders that passed SOLD_ORDER_FILTER — the ones every figure is built from. */
  ordersCounted: number;
  /** Delivery charged across those orders. Order-level, so not in product revenue. */
  shipping: number;
  /** Cash-on-delivery handling fees across those orders. Also order-level. */
  codFees: number;
  /** What those orders billed in full: product revenue + shipping + COD fees. */
  totalBilled: number;
  /** Orders left out, by why. Together with `ordersCounted` this is every order. */
  notCounted: { notPaid: number; refunded: number; cancelled: number };
}

export async function getSalesSummary(): Promise<SalesSummary> {
  const [sold, byState] = await Promise.all([
    prisma.order.aggregate({
      where: SOLD_ORDER_FILTER,
      _count: { _all: true },
      _sum: { shipping: true, codFee: true, total: true },
    }),
    prisma.order.groupBy({ by: ["status", "paymentStatus"], _count: { _all: true } }),
  ]);

  // Each leftover order is filed under exactly one reason, refund first, so the
  // three numbers never add up to more than the orders that were left out. This
  // is the complement of SOLD_ORDER_FILTER — change one, change the other.
  const notCounted = { notPaid: 0, refunded: 0, cancelled: 0 };
  for (const group of byState) {
    const n = group._count._all;
    if (group.paymentStatus === "REFUNDED") notCounted.refunded += n;
    else if (group.paymentStatus === "PENDING" || group.paymentStatus === "FAILED") notCounted.notPaid += n;
    else if (group.status === "CANCELLED") notCounted.cancelled += n;
  }

  return {
    ordersCounted: sold._count._all,
    shipping: sold._sum.shipping ?? 0,
    codFees: sold._sum.codFee ?? 0,
    totalBilled: sold._sum.total ?? 0,
    notCounted,
  };
}

export async function getPurchaseStatsForProduct(productId: string): Promise<ProductPurchaseStats> {
  const items = await prisma.orderItem.findMany({
    where: { productId, order: SOLD_ORDER_FILTER },
    select: { quantity: true, price: true, order: { select: { customerEmail: true } } },
  });

  const buyers = new Set(items.map((item) => item.order.customerEmail));
  const totalUnitsSold = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalRevenue = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return { uniqueBuyerCount: buyers.size, totalUnitsSold, totalRevenue };
}
