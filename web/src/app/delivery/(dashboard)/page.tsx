import { prisma } from "@/lib/db";
import { PAID_ORDER_FILTER } from "@/lib/payments";
import { OrdersOverview } from "@/components/orders/OrdersOverview";

export const dynamic = "force-dynamic";

export default async function DeliveryOrdersPage() {
  const [orders, counts] = await Promise.all([
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
  ]);

  return (
    <div>
      <div>
        <h1 className="text-3xl font-black tracking-tight">Orders</h1>
        <p className="mt-1 text-sm text-ink-soft">
          Open an order to see the delivery address and update its status as
          you move it along.
        </p>
      </div>

      <div className="mt-8">
        <OrdersOverview orders={orders} counts={counts} basePath="/delivery/orders" />
      </div>
    </div>
  );
}
