import Link from "next/link";
import { clsx } from "clsx";
import { prisma } from "@/lib/db";
import { formatPrice } from "@/lib/format";
import { ALL_ORDER_STATUSES, ORDER_STATUS_LABEL, OrderStatus } from "@/lib/order-status";

export const dynamic = "force-dynamic";

const dateFormatter = new Intl.DateTimeFormat("en-IN", {
  day: "numeric",
  month: "short",
  year: "numeric",
});

export default async function AdminOrdersPage() {
  const [orders, counts] = await Promise.all([
    prisma.order.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        items: { select: { id: true, name: true, sizeLabel: true, quantity: true } },
      },
    }),
    prisma.order.groupBy({ by: ["status"], _count: { _all: true } }),
  ]);

  const countFor = new Map(counts.map((row) => [row.status, row._count._all]));
  // Anything not yet delivered or cancelled still needs someone to act on it.
  const openCount = orders.filter(
    (o) => o.status !== OrderStatus.DELIVERED && o.status !== OrderStatus.CANCELLED,
  ).length;

  return (
    <div>
      <div>
        <h1 className="text-3xl font-black tracking-tight">Orders</h1>
        <p className="mt-1 text-sm text-ink-soft">
          Open an order to move it through packing, shipping and delivery. Each
          change is stamped and shown on the customer&rsquo;s tracking page.
        </p>
      </div>

      <div className="mt-8 grid grid-cols-2 gap-px overflow-hidden border border-line bg-line sm:grid-cols-4">
        <div className="bg-paper px-6 py-5">
          <p className="text-2xl font-black">{orders.length}</p>
          <p className="mt-0.5 text-xs uppercase tracking-[0.1em] text-ink-soft">Total</p>
        </div>
        <div className="bg-paper px-6 py-5">
          <p className="text-2xl font-black">{openCount}</p>
          <p className="mt-0.5 text-xs uppercase tracking-[0.1em] text-ink-soft">In progress</p>
        </div>
        <div className="bg-paper px-6 py-5">
          <p className="text-2xl font-black">{countFor.get(OrderStatus.DELIVERED) ?? 0}</p>
          <p className="mt-0.5 text-xs uppercase tracking-[0.1em] text-ink-soft">Delivered</p>
        </div>
        <div className="bg-paper px-6 py-5">
          <p className="text-2xl font-black">{countFor.get(OrderStatus.CANCELLED) ?? 0}</p>
          <p className="mt-0.5 text-xs uppercase tracking-[0.1em] text-ink-soft">Cancelled</p>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap gap-2 text-xs text-ink-soft">
        {ALL_ORDER_STATUSES.map((status) => (
          <span key={status} className="border border-line px-2.5 py-1">
            {ORDER_STATUS_LABEL[status]}: <strong className="text-ink">{countFor.get(status) ?? 0}</strong>
          </span>
        ))}
      </div>

      {orders.length === 0 ? (
        <p className="mt-10 text-sm text-ink-soft">No orders have been placed yet.</p>
      ) : (
        <ul className="mt-8 divide-y divide-line border-y border-line">
          {orders.map((order) => (
            <li key={order.id}>
              <Link
                href={`/admin/orders/${order.id}`}
                className="flex flex-wrap items-start justify-between gap-4 py-5 transition-colors hover:bg-paper-2"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="font-mono text-sm font-bold">{order.orderNumber}</span>
                    <span
                      className={clsx(
                        "rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.1em]",
                        order.status === OrderStatus.DELIVERED && "bg-ink text-paper",
                        order.status === OrderStatus.CANCELLED && "bg-red-700 text-paper",
                        order.status !== OrderStatus.DELIVERED &&
                          order.status !== OrderStatus.CANCELLED &&
                          "border border-line text-ink-soft",
                      )}
                    >
                      {ORDER_STATUS_LABEL[order.status]}
                    </span>
                  </div>
                  <p className="mt-1.5 text-sm">
                    {order.customerFullName}{" "}
                    <span className="text-ink-soft">· {order.customerEmail}</span>
                  </p>
                  <p className="mt-1 text-xs text-ink-soft">
                    {order.items
                      .map((item) => `${item.quantity} × ${item.name} (${item.sizeLabel})`)
                      .join(", ")}
                  </p>
                </div>

                <div className="shrink-0 text-right">
                  <p className="text-sm font-bold">{formatPrice(order.total)}</p>
                  <p className="mt-1 text-xs text-ink-soft">
                    {dateFormatter.format(order.createdAt)}
                  </p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
