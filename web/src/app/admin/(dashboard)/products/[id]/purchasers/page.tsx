import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { getPurchaseStatsForProduct, SOLD_ORDER_FILTER } from "@/lib/purchase-stats";
import { formatPrice } from "@/lib/format";

const PAGE_SIZE = 20;

export default async function ProductPurchasersPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ page?: string }>;
}) {
  const { id } = await params;
  const { page: pageParam } = await searchParams;
  const page = Math.max(1, Number(pageParam ?? "1") || 1);

  const product = await prisma.product.findUnique({ where: { id } });
  if (!product) notFound();

  const [stats, total, orderItems] = await Promise.all([
    getPurchaseStatsForProduct(id),
    prisma.orderItem.count({ where: { productId: id, order: SOLD_ORDER_FILTER } }),
    prisma.orderItem.findMany({
      where: { productId: id, order: SOLD_ORDER_FILTER },
      include: { order: true },
      orderBy: { order: { createdAt: "desc" } },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div>
      <Link href="/admin" className="text-xs font-semibold uppercase tracking-[0.08em] text-ink-soft hover:text-ink">
        ← Back to Products
      </Link>
      <h1 className="mt-3 text-3xl font-black tracking-tight">{product.name} — Purchasers</h1>

      <div className="mt-6 flex gap-8">
        <div>
          <p className="text-3xl font-black">{stats.uniqueBuyerCount}</p>
          <p className="text-xs uppercase tracking-[0.1em] text-ink-soft">Unique Buyers</p>
        </div>
        <div>
          <p className="text-3xl font-black">{stats.totalUnitsSold}</p>
          <p className="text-xs uppercase tracking-[0.1em] text-ink-soft">Units Sold</p>
        </div>
        <div>
          <p className="text-3xl font-black">{formatPrice(stats.totalRevenue)}</p>
          <p className="text-xs uppercase tracking-[0.1em] text-ink-soft">Revenue</p>
        </div>
      </div>
      <p className="mt-3 max-w-xl text-xs leading-relaxed text-ink-soft">
        Revenue is the sum of each row&rsquo;s Price &times; Qty below. Abandoned or failed
        checkouts, refunded orders and cancelled orders are not counted, and shipping and COD
        fees are not part of it.
      </p>

      <div className="mt-8 overflow-x-auto">
        <table className="w-full min-w-[800px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-line text-left text-xs uppercase tracking-[0.1em] text-ink-soft">
              <th className="py-3 pr-4 font-medium">Order #</th>
              <th className="py-3 pr-4 font-medium">Buyer</th>
              <th className="py-3 pr-4 font-medium">Contact</th>
              <th className="py-3 pr-4 font-medium">Size</th>
              <th className="py-3 pr-4 font-medium">Qty</th>
              <th className="py-3 pr-4 font-medium">Price</th>
              <th className="py-3 pr-4 font-medium">Amount</th>
              <th className="py-3 pr-4 font-medium">Date</th>
            </tr>
          </thead>
          <tbody>
            {orderItems.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-8 text-center text-ink-soft">
                  No purchases yet.
                </td>
              </tr>
            ) : (
              orderItems.map((item) => (
                <tr key={item.id} className="border-b border-line">
                  <td className="py-3 pr-4 font-mono text-xs">{item.order.orderNumber}</td>
                  <td className="py-3 pr-4">{item.order.customerFullName}</td>
                  <td className="py-3 pr-4 text-ink-soft">
                    <div>{item.order.customerEmail}</div>
                    <div>{item.order.customerPhone}</div>
                  </td>
                  <td className="py-3 pr-4">{item.sizeLabel}</td>
                  <td className="py-3 pr-4">{item.quantity}</td>
                  <td className="py-3 pr-4">{formatPrice(item.price)}</td>
                  <td className="py-3 pr-4 font-semibold">{formatPrice(item.price * item.quantity)}</td>
                  <td className="py-3 pr-4 text-ink-soft">
                    {item.order.createdAt.toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="mt-6 flex gap-4 text-xs font-semibold uppercase tracking-[0.08em]">
          {page > 1 && (
            <Link href={`?page=${page - 1}`} className="hover:text-gold-ink">
              ← Previous
            </Link>
          )}
          <span className="text-ink-soft">
            Page {page} of {totalPages}
          </span>
          {page < totalPages && (
            <Link href={`?page=${page + 1}`} className="hover:text-gold-ink">
              Next →
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
