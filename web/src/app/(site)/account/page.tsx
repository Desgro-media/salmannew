import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { PAID_ORDER_FILTER } from "@/lib/payments";
import { verifyCustomerSessionToken, CUSTOMER_SESSION_COOKIE_NAME } from "@/lib/customer-auth";
import { formatPrice } from "@/lib/format";
import { LogoutLink } from "@/components/account/LogoutLink";
import { OrderTimeline } from "@/components/orders/OrderTimeline";
import { ORDER_STATUS_LABEL } from "@/lib/order-status";

export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get(CUSTOMER_SESSION_COOKIE_NAME)?.value;
  const session = token ? await verifyCustomerSessionToken(token) : null;

  if (!session) {
    redirect("/account/login?redirect=/account");
  }

  const customer = await prisma.customer.findUnique({ where: { id: session.sub } });
  if (!customer) {
    redirect("/account/login?redirect=/account");
  }

  const orders = await prisma.order.findMany({
    // Abandoned checkouts are not order history — showing one here would read
    // as "you bought this" for something never paid for.
    where: { customerId: customer.id, ...PAID_ORDER_FILTER },
    include: {
      items: true,
      statusEvents: { orderBy: { createdAt: "asc" } },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    // pt clears the fixed Header, as on every other page under this layout
    <div className="container-grid pb-12 pt-28 md:pb-16 md:pt-36">
      <div className="flex items-baseline justify-between">
        <div>
          <p className="eyebrow text-ink-soft">Account</p>
          <h1 className="mt-2 text-4xl font-black tracking-tight">Hi, {customer.fullName}</h1>
        </div>
        <LogoutLink />
      </div>

      <div className="mt-10 grid grid-cols-1 gap-10 lg:grid-cols-12">
        <div className="lg:col-span-8">
          <p className="eyebrow text-ink-soft">Order History</p>
          {orders.length === 0 ? (
            <p className="mt-4 text-sm text-ink-soft">You haven&rsquo;t placed any orders yet.</p>
          ) : (
            <div className="mt-4 divide-y divide-line border-y border-line">
              {orders.map((order) => (
                <div key={order.id} className="py-6">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <p className="font-mono text-sm font-semibold">{order.orderNumber}</p>
                    <p className="text-xs text-ink-soft">
                      {order.createdAt.toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}{" "}
                      · {ORDER_STATUS_LABEL[order.status]}
                    </p>
                  </div>
                  <ul className="mt-3 space-y-1 text-sm text-ink-soft">
                    {order.items.map((item) => (
                      <li key={item.id}>
                        {item.quantity} × {item.name} ({item.sizeLabel})
                      </li>
                    ))}
                  </ul>
                  <p className="mt-2 text-sm font-semibold">{formatPrice(order.total)}</p>

                  <OrderTimeline
                    status={order.status}
                    events={order.statusEvents}
                    className="mt-6 border-t border-line pt-6"
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="lg:col-span-4">
          <p className="eyebrow text-ink-soft">Saved Details</p>
          <p className="mt-4 text-xs text-ink-soft">
            Updated automatically from your most recent checkout.
          </p>
          <dl className="mt-4 space-y-3 text-sm">
            <div>
              <dt className="text-xs uppercase tracking-[0.1em] text-ink-soft">Email</dt>
              <dd className="mt-0.5">{customer.email}</dd>
            </div>
            {customer.phone && (
              <div>
                <dt className="text-xs uppercase tracking-[0.1em] text-ink-soft">Phone</dt>
                <dd className="mt-0.5">{customer.phone}</dd>
              </div>
            )}
            {customer.address && (
              <div>
                <dt className="text-xs uppercase tracking-[0.1em] text-ink-soft">Address</dt>
                <dd className="mt-0.5">
                  {customer.address}
                  {customer.city && `, ${customer.city}`}
                  {customer.state && `, ${customer.state}`}
                  {customer.pincode && ` – ${customer.pincode}`}
                </dd>
              </div>
            )}
          </dl>
        </div>
      </div>
    </div>
  );
}
