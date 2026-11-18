import Image from "next/image";
import { formatPrice } from "@/lib/format";
import type { SalesLine, SalesSummary } from "@/lib/purchase-stats";

export interface SoldProduct {
  id: string;
  name: string;
  image: string | undefined;
  units: number;
  revenue: number;
  lines: SalesLine[];
}

interface Props {
  /** Products with at least one sale, biggest earner first. */
  products: SoldProduct[];
  totalRevenue: number;
  summary: SalesSummary;
}

function plural(n: number, one: string, many: string): string {
  return `${n} ${n === 1 ? one : many}`;
}

/**
 * Shows where the Revenue figure comes from, in the same numbers: the rule, how
 * the product money relates to what orders billed, and every sold product with
 * the price × quantity sum behind its amount.
 */
export function SalesBreakdown({ products, totalRevenue, summary }: Props) {
  const { notCounted } = summary;
  const leftOut = notCounted.notPaid + notCounted.refunded + notCounted.cancelled;

  return (
    <section id="sales-breakdown" className="mt-10 scroll-mt-6">
      <h2 className="text-xl font-black tracking-tight">Sales breakdown</h2>
      <p className="mt-1 text-sm text-ink-soft">How the Revenue figure above is worked out.</p>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <div className="border border-line bg-paper p-4 sm:p-6">
          <h3 className="text-xs font-semibold uppercase tracking-[0.1em] text-ink-soft">
            How it&rsquo;s calculated
          </h3>
          <p className="mt-3 text-sm leading-relaxed">
            <span className="font-semibold">Revenue</span> = price × quantity, added up for every
            item on every sold order.
          </p>
          <ul className="mt-3 space-y-2 text-sm leading-relaxed text-ink-soft">
            <li>
              <span className="font-semibold text-ink">Counted:</span> paid online orders, and
              cash-on-delivery orders from the moment they&rsquo;re placed (cash is due on
              delivery) &mdash; {plural(summary.ordersCounted, "order", "orders")} so far.
            </li>
            <li>
              <span className="font-semibold text-ink">Not counted:</span>{" "}
              {leftOut === 0
                ? "nothing has been left out yet."
                : `${plural(notCounted.notPaid, "abandoned or failed checkout", "abandoned or failed checkouts")}, ${notCounted.refunded} refunded, ${notCounted.cancelled} cancelled.`}
            </li>
            <li>
              The price is what the customer was charged at checkout, so changing a price later
              never rewrites past sales.
            </li>
          </ul>
        </div>

        <div className="border border-line bg-paper p-4 sm:p-6">
          <h3 className="text-xs font-semibold uppercase tracking-[0.1em] text-ink-soft">
            From product revenue to money billed
          </h3>
          <dl className="mt-3 text-sm">
            <div className="flex items-baseline justify-between gap-3 py-1.5">
              <dt>Product revenue</dt>
              <dd className="font-semibold tabular-nums">{formatPrice(totalRevenue)}</dd>
            </div>
            <div className="flex items-baseline justify-between gap-3 py-1.5 text-ink-soft">
              <dt>+ Shipping charged</dt>
              <dd className="tabular-nums">{formatPrice(summary.shipping)}</dd>
            </div>
            <div className="flex items-baseline justify-between gap-3 py-1.5 text-ink-soft">
              <dt>+ COD handling fees</dt>
              <dd className="tabular-nums">{formatPrice(summary.codFees)}</dd>
            </div>
            <div className="mt-1 flex items-baseline justify-between gap-3 border-t border-line pt-2.5 font-black">
              <dt>= Billed on {plural(summary.ordersCounted, "order", "orders")}</dt>
              <dd className="tabular-nums">{formatPrice(summary.totalBilled)}</dd>
            </div>
          </dl>
          <p className="mt-3 text-xs leading-relaxed text-ink-soft">
            Shipping and COD fees belong to the whole order rather than to any one product, so
            they&rsquo;re kept out of Revenue.
          </p>
        </div>
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
                : `${plural(products.length, "product", "products")} · ${formatPrice(totalRevenue)}`}
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
                  const share = totalRevenue > 0 ? (product.revenue / totalRevenue) * 100 : 0;
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
                            {plural(product.units, "unit", "units")} sold &middot;{" "}
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
                <span className="text-lg tabular-nums">{formatPrice(totalRevenue)}</span>
              </div>
            </>
          )}
        </div>
      </details>
    </section>
  );
}
