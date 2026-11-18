import Image from "next/image";
import { clsx } from "clsx";
import { formatPrice } from "@/lib/format";
import type {
  NotCountedOrders,
  PaymentBreakdown,
  PaymentBucket,
  SalesLine,
} from "@/lib/purchase-stats";

export interface SoldProduct {
  id: string;
  name: string;
  image: string | undefined;
  units: number;
  /** Of `units`, how many were paid online and how many are cash on delivery. */
  online: number;
  cod: number;
  revenue: number;
  lines: SalesLine[];
}

interface Props {
  /** Products with at least one sale, biggest earner first. */
  products: SoldProduct[];
  payments: PaymentBreakdown;
  notCounted: NotCountedOrders;
}

function plural(n: number, one: string, many: string): string {
  return `${n} ${n === 1 ? one : many}`;
}

/** Shipping and COD fee are often nothing; a dash reads better than ₹0 in a column of figures. */
function moneyOrDash(value: number): string {
  return value === 0 ? "—" : formatPrice(value);
}

function methodSplit(online: number, cod: number): string {
  if (cod === 0) return "all online";
  if (online === 0) return "all COD";
  return `${online} online, ${cod} COD`;
}

/** Column template shared by the header and every row, from `sm` up. */
const ROW_COLUMNS = "sm:grid-cols-[minmax(0,1.8fr)_repeat(6,minmax(0,1fr))]";

function Figure({
  label,
  amount,
  bucket,
  emphasis = false,
  children,
}: {
  label: string;
  amount: number;
  bucket: PaymentBucket;
  emphasis?: boolean;
  children?: React.ReactNode;
}) {
  return (
    <div className={clsx("flex-1 border bg-paper px-4 py-4 sm:px-5", emphasis ? "border-ink" : "border-line")}>
      <p className="text-xs font-semibold uppercase tracking-[0.1em] text-ink-soft">{label}</p>
      <p className="mt-1 text-2xl font-black tabular-nums">{formatPrice(amount)}</p>
      <p className="mt-0.5 text-xs text-ink-soft">
        {plural(bucket.orders, "order", "orders")} &middot; {plural(bucket.units, "unit", "units")}
      </p>
      {children}
    </div>
  );
}

function Operator({ children }: { children: string }) {
  return (
    <span aria-hidden="true" className="self-center text-2xl font-black leading-none text-ink-soft">
      {children}
    </span>
  );
}

/** One figure in a payments row. On a phone it carries its own label; on a wide screen the header row does. */
function Cell({ label, children, strong = false }: { label: string; children: React.ReactNode; strong?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-2 sm:block sm:text-right">
      <span className="text-[10px] uppercase tracking-[0.1em] text-ink-soft sm:hidden">{label}</span>
      <span className={clsx("tabular-nums", strong && "font-semibold")}>{children}</span>
    </div>
  );
}

function PaymentRow({
  name,
  note,
  bucket,
  variant,
}: {
  name: string;
  note?: string;
  bucket: PaymentBucket;
  variant: "main" | "sub" | "total";
}) {
  return (
    <li
      className={clsx(
        "grid grid-cols-2 gap-x-6 gap-y-1.5 px-4 py-3 text-sm sm:items-baseline sm:gap-x-3",
        ROW_COLUMNS,
        variant === "sub" && "bg-paper-2/50 text-ink-soft",
        variant === "total" && "border-t border-ink font-black",
      )}
    >
      <div className={clsx("col-span-2 sm:col-span-1", variant === "sub" && "sm:pl-4")}>
        <p className={clsx(variant === "sub" ? "font-medium text-ink" : "font-semibold")}>{name}</p>
        {note && <p className="text-xs font-normal text-ink-soft">{note}</p>}
      </div>
      <Cell label="Orders">{bucket.orders}</Cell>
      <Cell label="Units">{bucket.units}</Cell>
      <Cell label="Products">{formatPrice(bucket.products)}</Cell>
      <Cell label="Shipping">{moneyOrDash(bucket.shipping)}</Cell>
      <Cell label="COD fee">{moneyOrDash(bucket.codFees)}</Cell>
      <Cell label="Total" strong>
        {formatPrice(bucket.total)}
      </Cell>
    </li>
  );
}

/**
 * Shows where the Revenue figure comes from, and how the money splits between
 * online payment and cash on delivery: the equation, the line-by-line payments
 * table, the rule behind it all, and every sold product with the price ×
 * quantity sum behind its amount.
 */
export function SalesBreakdown({ products, payments, notCounted }: Props) {
  const { online, cod, codCollected, codToCollect, overall } = payments;
  const leftOut = notCounted.notPaid + notCounted.refunded + notCounted.cancelled;

  const received = online.total + codCollected.total;
  const onlinePct = overall.total > 0 ? Math.round((online.total / overall.total) * 100) : 0;
  const codPct = overall.total > 0 ? 100 - onlinePct : 0;

  return (
    <section id="sales-breakdown" className="mt-10 scroll-mt-6">
      <h2 className="text-xl font-black tracking-tight">Sales breakdown</h2>
      <p className="mt-1 text-sm text-ink-soft">
        What was sold, how it was paid for, and how the figures above are worked out.
      </p>

      {/* The headline: online + cash on delivery = everything billed. */}
      <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-stretch sm:gap-3">
        <Figure label="Online payment" amount={online.total} bucket={online} />
        <Operator>+</Operator>
        <Figure label="Cash on delivery" amount={cod.total} bucket={cod}>
          {cod.orders > 0 && (
            <p className="mt-1.5 text-xs text-ink-soft">
              <span className="font-semibold text-ink">{formatPrice(codCollected.total)}</span> collected
              &middot; <span className="font-semibold text-ink">{formatPrice(codToCollect.total)}</span> to collect
            </p>
          )}
        </Figure>
        <Operator>=</Operator>
        <Figure label="Total billed" amount={overall.total} bucket={overall} emphasis />
      </div>

      {overall.total > 0 && (
        <div className="mt-3">
          <div
            className="flex h-2 overflow-hidden bg-paper-2"
            role="img"
            aria-label={`Online payment ${onlinePct} percent, cash on delivery ${codPct} percent of the total billed`}
          >
            <div className="bg-ink" style={{ width: `${onlinePct}%` }} />
            <div className="bg-gold" style={{ width: `${codPct}%` }} />
          </div>
          <p className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-xs text-ink-soft">
            <span className="inline-flex items-center gap-1.5">
              <span className="inline-block h-2 w-2 bg-ink" aria-hidden="true" />
              Online {onlinePct}%
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="inline-block h-2 w-2 bg-gold" aria-hidden="true" />
              Cash on delivery {codPct}%
            </span>
          </p>
        </div>
      )}

      <p className="mt-3 text-sm">
        <span className="text-ink-soft">Received so far </span>
        <strong className="tabular-nums">{formatPrice(received)}</strong>
        <span className="text-ink-soft"> &middot; Still to collect </span>
        <strong className="tabular-nums">{formatPrice(codToCollect.total)}</strong>
        {codToCollect.orders > 0 && (
          <span className="text-ink-soft">
            {" "}
            ({plural(codToCollect.orders, "cash-on-delivery order", "cash-on-delivery orders")} not delivered yet)
          </span>
        )}
      </p>

      <h3 className="mt-8 text-xs font-semibold uppercase tracking-[0.1em] text-ink-soft">
        Payments in detail
      </h3>
      <div className="mt-3 border border-line bg-paper">
        <div
          className={clsx(
            "hidden gap-x-3 border-b border-line bg-paper-2 px-4 py-2.5 text-xs uppercase tracking-[0.1em] text-ink-soft sm:grid",
            ROW_COLUMNS,
          )}
        >
          <span>Payment</span>
          <span className="text-right">Orders</span>
          <span className="text-right">Units</span>
          <span className="text-right">Products</span>
          <span className="text-right">Shipping</span>
          <span className="text-right">COD fee</span>
          <span className="text-right">Total</span>
        </div>
        <ul className="divide-y divide-line">
          <PaymentRow name="Online payment" note="Paid through Razorpay" bucket={online} variant="main" />
          <PaymentRow name="Cash on delivery" note="Paid in cash at the door" bucket={cod} variant="main" />
          <PaymentRow name="Cash collected" note="Delivered, cash received" bucket={codCollected} variant="sub" />
          <PaymentRow name="Cash to collect" note="Placed, not delivered yet" bucket={codToCollect} variant="sub" />
          <PaymentRow name="All sold orders" bucket={overall} variant="total" />
        </ul>
      </div>

      <div className="mt-4 border border-line bg-paper p-4 sm:p-6">
        <h3 className="text-xs font-semibold uppercase tracking-[0.1em] text-ink-soft">
          How it&rsquo;s calculated
        </h3>
        <p className="mt-3 text-sm leading-relaxed">
          <span className="font-semibold">Revenue</span> = price × quantity, added up for every item
          on every sold order. <span className="font-semibold">Total</span> = that, plus shipping and
          any cash-on-delivery fee &mdash; what the customer actually pays.
        </p>
        <ul className="mt-3 space-y-2 text-sm leading-relaxed text-ink-soft">
          <li>
            <span className="font-semibold text-ink">Counted:</span> paid online orders, and
            cash-on-delivery orders from the moment they&rsquo;re placed &mdash;{" "}
            {plural(overall.orders, "order", "orders")} so far.
          </li>
          <li>
            <span className="font-semibold text-ink">Cash collected vs to collect:</span> a
            cash-on-delivery order moves to collected when you mark it delivered.
          </li>
          <li>
            <span className="font-semibold text-ink">Not counted:</span>{" "}
            {leftOut === 0
              ? "nothing has been left out yet."
              : `${plural(notCounted.notPaid, "abandoned or failed checkout", "abandoned or failed checkouts")}, ${notCounted.refunded} refunded, ${notCounted.cancelled} cancelled.`}
          </li>
          <li>
            The price is what the customer was charged at checkout, so changing a price later never
            rewrites past sales.
          </li>
        </ul>
      </div>

      {/* A native <details>, closed by default: the list is reference detail, not
          something to scroll past every visit, and this needs no client JS. The
          two header lines are always visible so the headline is still readable
          while it is shut. */}
      <details className="group mt-8 border border-line bg-paper">
        <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 hover:bg-paper-2/60 sm:px-6 [&::-webkit-details-marker]:hidden">
          <span>
            <span className="block text-xs font-semibold uppercase tracking-[0.1em]">
              Sold products
            </span>
            <span className="mt-0.5 block text-xs text-ink-soft">
              {products.length === 0
                ? "Nothing sold yet"
                : `${plural(products.length, "product", "products")} · ${formatPrice(overall.products)}`}
            </span>
          </span>
          <span className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.08em] text-ink-soft">
            <span className="group-open:hidden">Show</span>
            <span className="hidden group-open:inline">Hide</span>
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-4 w-4 transition-transform group-open:rotate-180"
              aria-hidden="true"
            >
              <path d="m6 9 6 6 6-6" />
            </svg>
          </span>
        </summary>

        <div className="border-t border-line p-3 sm:p-4">
          {products.length === 0 ? (
            <p className="border border-line px-4 py-10 text-center text-sm text-ink-soft">
              Nothing sold yet. Paid and cash-on-delivery orders will appear here.
            </p>
          ) : (
            <>
              <ul className="space-y-3">
                {products.map((product) => {
                  const share = overall.products > 0 ? (product.revenue / overall.products) * 100 : 0;
                  return (
                    <li key={product.id} className="border border-line bg-paper">
                      <div className="flex items-center gap-3 p-4">
                        <div className="relative h-12 w-10 shrink-0 overflow-hidden border border-line bg-paper-2">
                          {product.image && (
                            <Image src={product.image} alt="" fill sizes="40px" className="object-cover" />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold leading-tight">{product.name}</p>
                          <p className="mt-0.5 text-xs text-ink-soft">
                            {plural(product.units, "unit", "units")} sold (
                            {methodSplit(product.online, product.cod)}) &middot;{" "}
                            {share.toFixed(share < 10 && share > 0 ? 1 : 0)}% of revenue
                          </p>
                        </div>
                        <p className="text-lg font-black tabular-nums">{formatPrice(product.revenue)}</p>
                      </div>

                      <div className="h-0.5 bg-paper-2" aria-hidden="true">
                        <div className="h-full bg-gold" style={{ width: `${Math.max(share, 1)}%` }} />
                      </div>

                      <ul className="divide-y divide-line text-sm">
                        {product.lines.map((line) => (
                          <li
                            key={`${line.sizeLabel}-${line.unitPrice}`}
                            className="flex items-baseline justify-between gap-3 px-4 py-2.5"
                          >
                            <span className="text-ink-soft">
                              <span className="font-medium text-ink">{line.sizeLabel}</span> &middot;{" "}
                              {formatPrice(line.unitPrice)} &times; {line.quantity}
                            </span>
                            <span className="font-semibold tabular-nums">{formatPrice(line.amount)}</span>
                          </li>
                        ))}
                      </ul>
                    </li>
                  );
                })}
              </ul>

              <div className="mt-3 flex items-baseline justify-between gap-3 border border-ink bg-paper px-4 py-3 font-black">
                <span className="uppercase tracking-[0.08em]">Total product revenue</span>
                <span className="text-lg tabular-nums">{formatPrice(overall.products)}</span>
              </div>
            </>
          )}
        </div>
      </details>
    </section>
  );
}
