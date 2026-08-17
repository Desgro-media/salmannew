import { prisma } from "@/lib/db";
import { PAID_ORDER_FILTER } from "@/lib/payments";
import { OrdersOverview } from "@/components/orders/OrdersOverview";

export const dynamic = "force-dynamic";

export default async function AdminOrdersPage() {
  const [orders, counts, unpaidCount] = await Promise.all([
    prisma.order.findMany({
      where: PAID_ORDER_FILTER,
      orderBy: { createdAt: "desc" },
      include: {
        items: { select: { id: true, name: true, sizeLabel: true, quantity: true } },
      },
    }),
    prisma.order.groupBy({
      by: ["status"],
      where: PAID_ORDER_FILTER,
      _count: { _all: true },
    }),
    // Counted but not listed. Abandoned checkouts would swamp the queue, but a
    // number climbing here is worth noticing — it usually means payments are
    // failing rather than that customers changed their minds.
    prisma.order.count({ where: { paymentStatus: { in: ["PENDING", "FAILED"] } } }),
  ]);

  return (
    <div>
      <div>
        <h1 className="text-3xl font-black tracking-tight">Orders</h1>
        <p className="mt-1 text-sm text-ink-soft">
          Open an order to move it through packing, shipping and delivery. Each
          change is stamped and shown on the customer&rsquo;s tracking page.
        </p>
        {unpaidCount > 0 && (
          <p className="mt-3 text-xs text-ink-soft">
            {unpaidCount} checkout{unpaidCount === 1 ? " was" : "s were"} started but
            never paid for, and {unpaidCount === 1 ? "is" : "are"} not listed below.
          </p>
        )}
      </div>

      <div className="mt-8">
        <OrdersOverview orders={orders} counts={counts} basePath="/admin/orders" />
      </div>
    </div>
  );
}
