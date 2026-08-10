import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { verifyCustomerSessionToken, CUSTOMER_SESSION_COOKIE_NAME } from "@/lib/customer-auth";
import { formatPrice } from "@/lib/format";
import { LogoutLink } from "@/components/account/LogoutLink";

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
    where: { customerId: customer.id },
    include: { items: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="container-grid py-12 md:py-16">
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
                <div key={order.id} className="py-5">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <p className="font-mono text-sm font-semibold">{order.orderNumber}</p>
                    <p className="text-xs text-ink-soft">
                      {order.createdAt.toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}{" "}
                      · {order.status}
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
