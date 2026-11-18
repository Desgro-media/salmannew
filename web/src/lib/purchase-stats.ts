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

/** Orders left out of the sales figures, by why. */
export interface NotCountedOrders {
  notPaid: number;
  refunded: number;
  cancelled: number;
}

export async function getNotCountedOrders(): Promise<NotCountedOrders> {
  const byState = await prisma.order.groupBy({
    by: ["status", "paymentStatus"],
    _count: { _all: true },
  });

  // Each leftover order is filed under exactly one reason, refund first, so the
  // three numbers never add up to more than the orders that were left out. This
  // is the complement of SOLD_ORDER_FILTER — change one, change the other.
  const notCounted: NotCountedOrders = { notPaid: 0, refunded: 0, cancelled: 0 };
  for (const group of byState) {
    const n = group._count._all;
    if (group.paymentStatus === "REFUNDED") notCounted.refunded += n;
    else if (group.paymentStatus === "PENDING" || group.paymentStatus === "FAILED") notCounted.notPaid += n;
    else if (group.status === "CANCELLED") notCounted.cancelled += n;
  }
  return notCounted;
}

/** Orders, units and rupees for one slice of the sold orders. */
export interface PaymentBucket {
  orders: number;
  units: number;
  /** The goods themselves: each line's price × quantity. */
  products: number;
  /** Delivery charged. Belongs to the order, not to any product. */
  shipping: number;
  /** Cash-on-delivery handling fee. Likewise order-level. */
  codFees: number;
  /** What these orders billed in full — products + shipping + COD fees. */
  total: number;
}

export interface PaymentBreakdown {
  /** Paid online. The money is already in. */
  online: PaymentBucket;
  /** Cash on delivery that has been delivered, so the cash has changed hands. */
  codCollected: PaymentBucket;
  /** Cash on delivery placed but not yet delivered: cash still to collect. */
  codToCollect: PaymentBucket;
  /** codCollected + codToCollect. */
  cod: PaymentBucket;
  /** online + cod: every sold order. */
  overall: PaymentBucket;
  /** Units per product by how they were paid for, for the sold-products list. */
  unitsByProduct: Map<string, { online: number; cod: number }>;
}

function emptyBucket(): PaymentBucket {
  return { orders: 0, units: 0, products: 0, shipping: 0, codFees: 0, total: 0 };
}

function sumBuckets(...buckets: PaymentBucket[]): PaymentBucket {
  const sum = emptyBucket();
  for (const b of buckets) {
    sum.orders += b.orders;
    sum.units += b.units;
    sum.products += b.products;
    sum.shipping += b.shipping;
    sum.codFees += b.codFees;
    sum.total += b.total;
  }
  return sum;
}

/**
 * The sold orders split by how they were paid, so the owner can see what has
 * actually arrived versus what is still on a courier's lap.
 *
 * An online order in the sold set is always PAID. A cash-on-delivery order is
 * COD_PENDING until delivery and PAID afterwards (codPaymentChange in cod.ts), so
 * its payment status is exactly "has the cash been collected".
 */
export async function getPaymentBreakdown(): Promise<PaymentBreakdown> {
  const orders = await prisma.order.findMany({
    where: SOLD_ORDER_FILTER,
    select: {
      paymentMethod: true,
      paymentStatus: true,
      shipping: true,
      codFee: true,
      total: true,
      items: { select: { productId: true, quantity: true, price: true } },
    },
  });

  const online = emptyBucket();
  const codCollected = emptyBucket();
  const codToCollect = emptyBucket();
  const unitsByProduct = new Map<string, { online: number; cod: number }>();

  for (const order of orders) {
    const isCod = order.paymentMethod === "COD";
    const bucket = !isCod ? online : order.paymentStatus === "PAID" ? codCollected : codToCollect;

    bucket.orders += 1;
    bucket.shipping += order.shipping;
    bucket.codFees += order.codFee;
    bucket.total += order.total;

    for (const item of order.items) {
      bucket.units += item.quantity;
      bucket.products += item.price * item.quantity;

      const split = unitsByProduct.get(item.productId) ?? { online: 0, cod: 0 };
      split[isCod ? "cod" : "online"] += item.quantity;
      unitsByProduct.set(item.productId, split);
    }
  }

  const cod = sumBuckets(codCollected, codToCollect);
  return { online, codCollected, codToCollect, cod, overall: sumBuckets(online, cod), unitsByProduct };
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
