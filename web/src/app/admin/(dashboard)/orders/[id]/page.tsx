import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { formatPrice } from "@/lib/format";
import { ORDER_STATUS_LABEL } from "@/lib/order-status";
import { OrderStatusControl } from "@/components/admin/OrderStatusControl";
import { OrderTimeline } from "@/components/orders/OrderTimeline";

export const dynamic = "force-dynamic";

const stampFormatter = new Intl.DateTimeFormat("en-IN", {
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "numeric",
  minute: "2-digit",
  hour12: true,
});

export default async function AdminOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      items: true,
      statusEvents: {
        orderBy: { createdAt: "asc" },
        include: { admin: { select: { email: true } } },
      },
    },
  });

  if (!order) notFound();

  return (
    <div>
      <Link
        href="/admin/orders"
        className="inline-flex min-h-11 items-center text-xs font-semibold uppercase tracking-[0.1em] text-ink-soft hover:text-ink md:min-h-0"
      >
        ← All orders
      </Link>

      <div className="mt-4 flex flex-wrap items-baseline justify-between gap-3">
        <div>
          <h1 className="font-mono text-3xl font-black tracking-tight">{order.orderNumber}</h1>
          <p className="mt-1 text-sm text-ink-soft">
            Placed {stampFormatter.format(order.createdAt)} · currently{" "}
            <strong className="text-ink">{ORDER_STATUS_LABEL[order.status]}</strong>
          </p>
        </div>
        <p className="text-2xl font-black">{formatPrice(order.total)}</p>
      </div>

      <div className="mt-8 border border-line bg-paper-2 px-6 py-6">
        <OrderStatusControl
          orderId={order.id}
          currentStatus={order.status}
          orderNumber={order.orderNumber}
        />
      </div>

      <div className="mt-10 grid grid-cols-1 gap-10 lg:grid-cols-12">
        <div className="lg:col-span-5">
          <p className="eyebrow text-ink-soft">Customer Sees</p>
          <OrderTimeline
            status={order.status}
            events={order.statusEvents}
            className="mt-5"
          />
        </div>

        <div className="lg:col-span-7">
          <p className="eyebrow text-ink-soft">Items</p>
          <ul className="mt-4 divide-y divide-line border-y border-line">
            {order.items.map((item) => (
              <li key={item.id} className="flex justify-between gap-4 py-3 text-sm">
                <span>
                  {item.quantity} × {item.name}{" "}
                  <span className="text-ink-soft">({item.sizeLabel})</span>
                  <br />
                  <span className="font-mono text-xs text-ink-soft">{item.sku}</span>
                </span>
                <span className="shrink-0 font-semibold">
                  {formatPrice(item.price * item.quantity)}
                </span>
              </li>
            ))}
          </ul>
          <dl className="mt-4 space-y-1 text-sm">
            <div className="flex justify-between">
              <dt className="text-ink-soft">Subtotal</dt>
              <dd>{formatPrice(order.subtotal)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-ink-soft">Shipping</dt>
              <dd>{order.shipping === 0 ? "Free" : formatPrice(order.shipping)}</dd>
            </div>
            <div className="flex justify-between font-bold">
              <dt>Total</dt>
              <dd>{formatPrice(order.total)}</dd>
            </div>
          </dl>

          <p className="eyebrow mt-8 text-ink-soft">Ship To</p>
          <address className="mt-3 text-sm not-italic">
            {order.customerFullName}
            <br />
            {order.customerAddress}
            <br />
            {order.customerCity}, {order.customerState} – {order.customerPincode}
            <br />
            <span className="text-ink-soft">
              {order.customerEmail} · {order.customerPhone}
            </span>
          </address>

          <p className="eyebrow mt-8 text-ink-soft">Change Log</p>
          <ul className="mt-3 space-y-2 text-xs text-ink-soft">
            {order.statusEvents.map((event) => (
              <li key={event.id}>
                <strong className="text-ink">{ORDER_STATUS_LABEL[event.status]}</strong> ·{" "}
                {stampFormatter.format(event.createdAt)} ·{" "}
                {event.admin?.email ?? "system (checkout)"}
                {event.note && <> · &ldquo;{event.note}&rdquo;</>}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
