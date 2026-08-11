import Link from "next/link";
import Image from "next/image";
import { clsx } from "clsx";
import { prisma } from "@/lib/db";
import { getPurchaseStatsByProduct } from "@/lib/purchase-stats";
import { formatPrice } from "@/lib/format";
import { DeleteProductButton } from "@/components/admin/DeleteProductButton";

function priceRange(sizes: { price: number }[]): { min: number; max: number } {
  const prices = sizes.map((s) => s.price);
  return { min: Math.min(...prices), max: Math.max(...prices) };
}

export const dynamic = "force-dynamic";

export default async function AdminProductsPage() {
  const [rows, stats] = await Promise.all([
    prisma.product.findMany({
      include: { sizes: { orderBy: { volumeMl: "asc" } } },
      orderBy: { createdAt: "desc" },
    }),
    getPurchaseStatsByProduct(),
  ]);

  const totals = rows.reduce(
    (acc, row) => {
      const s = stats.get(row.id) ?? { uniqueBuyerCount: 0, totalUnitsSold: 0 };
      acc.buyers += s.uniqueBuyerCount;
      acc.units += s.totalUnitsSold;
      return acc;
    },
    { buyers: 0, units: 0 },
  );

  return (
    <div>
      <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-black tracking-tight">Products</h1>
          <p className="mt-1 text-sm text-ink-soft">
            {rows.length} product{rows.length === 1 ? "" : "s"} in the catalog
          </p>
        </div>
        <Link
          href="/admin/products/new"
          className="inline-flex min-h-11 items-center justify-center gap-2 bg-ink px-6 text-xs font-semibold uppercase tracking-[0.14em] text-paper transition-colors hover:bg-gold hover:text-ink sm:py-3"
        >
          + New Product
        </Link>
      </div>

      {/* Three across even on a phone — stacked, these were three full-height
          rows of mostly empty space before any product was visible. */}
      <div className="mt-8 grid grid-cols-3 gap-px overflow-hidden border border-line bg-line">
        <div className="bg-paper px-3 py-4 sm:px-6 sm:py-5">
          <p className="text-xl font-black sm:text-2xl">{rows.length}</p>
          <p className="mt-0.5 text-[10px] uppercase tracking-[0.1em] text-ink-soft sm:text-xs">
            Products
          </p>
        </div>
        <div className="bg-paper px-3 py-4 sm:px-6 sm:py-5">
          <p className="text-xl font-black sm:text-2xl">{totals.buyers}</p>
          <p className="mt-0.5 text-[10px] uppercase tracking-[0.1em] text-ink-soft sm:text-xs">
            Buyers
          </p>
        </div>
        <div className="bg-paper px-3 py-4 sm:px-6 sm:py-5">
          <p className="text-xl font-black sm:text-2xl">{totals.units}</p>
          <p className="mt-0.5 text-[10px] uppercase tracking-[0.1em] text-ink-soft sm:text-xs">
            Units Sold
          </p>
        </div>
      </div>

      {/* Phones get stacked cards below; this table would otherwise be an
          820px-wide sideways scroll, which is reading a spreadsheet through a
          letterbox. */}
      <div className="mt-8 hidden overflow-x-auto border border-line md:block">
        <table className="w-full min-w-[820px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-line bg-paper-2 text-left text-xs uppercase tracking-[0.1em] text-ink-soft">
              <th className="py-3 pl-4 pr-4 font-medium">Product</th>
              <th className="py-3 pr-4 font-medium">Category</th>
              <th className="py-3 pr-4 font-medium">Price</th>
              <th className="py-3 pr-4 font-medium">Status</th>
              <th className="py-3 pr-4 font-medium">Buyers</th>
              <th className="py-3 pr-4 font-medium">Units Sold</th>
              <th className="py-3 pr-4 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-12 text-center text-ink-soft">
                  No products yet —{" "}
                  <Link href="/admin/products/new" className="text-gold-ink hover:underline">
                    add your first one
                  </Link>
                  .
                </td>
              </tr>
            ) : (
              rows.map((row) => {
                const { min, max } = priceRange(row.sizes);
                const s = stats.get(row.id) ?? { uniqueBuyerCount: 0, totalUnitsSold: 0 };
                return (
                  <tr key={row.id} className="border-b border-line last:border-b-0 hover:bg-paper-2/60">
                    <td className="py-3 pl-4 pr-4">
                      <div className="flex items-center gap-3">
                        <div className="relative h-12 w-10 shrink-0 overflow-hidden border border-line bg-paper-2">
                          {row.images[0] && (
                            <Image src={row.images[0]} alt="" fill sizes="40px" className="object-cover" />
                          )}
                        </div>
                        <div>
                          <p className="font-semibold">{row.name}</p>
                          <p className="text-xs text-ink-soft">/{row.slug}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 pr-4 text-ink-soft">{row.category}</td>
                    <td className="py-3 pr-4">
                      {min === max ? formatPrice(min) : `${formatPrice(min)} – ${formatPrice(max)}`}
                    </td>
                    <td className="py-3 pr-4">
                      <span
                        className={clsx(
                          "inline-block px-2 py-0.5 text-xs font-medium uppercase tracking-[0.06em]",
                          row.isArchived
                            ? "bg-paper-2 text-ink-soft"
                            : row.bestseller || row.isNew
                              ? "bg-gold/15 text-gold-ink"
                              : "bg-paper-2 text-ink-soft",
                        )}
                      >
                        {row.isArchived ? "Archived" : row.bestseller ? "Bestseller" : row.isNew ? "New" : "Active"}
                      </span>
                    </td>
                    <td className="py-3 pr-4">{s.uniqueBuyerCount}</td>
                    <td className="py-3 pr-4">{s.totalUnitsSold}</td>
                    <td className="py-3 pr-4">
                      <div className="flex justify-end gap-2 text-xs font-semibold uppercase tracking-[0.06em]">
                        <Link
                          href={`/admin/products/${row.id}/edit`}
                          className="border border-line px-3 py-1.5 transition-colors hover:border-ink hover:bg-ink hover:text-paper"
                        >
                          Edit
                        </Link>
                        <Link
                          href={`/admin/products/${row.id}/purchasers`}
                          className="border border-line px-3 py-1.5 transition-colors hover:border-ink hover:bg-ink hover:text-paper"
                        >
                          Purchasers
                        </Link>
                        <DeleteProductButton productId={row.id} productName={row.name} />
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Same data, re-laid-out for a phone: the row becomes a card, the
          columns become a labelled pair grid, and the actions become
          full-width 44px targets instead of 24px chips. */}
      <div className="mt-8 md:hidden">
        {rows.length === 0 ? (
          <p className="border border-line px-4 py-10 text-center text-sm text-ink-soft">
            No products yet —{" "}
            <Link href="/admin/products/new" className="text-gold-ink underline">
              add your first one
            </Link>
            .
          </p>
        ) : (
          <ul className="space-y-4">
            {rows.map((row) => {
              const { min, max } = priceRange(row.sizes);
              const s = stats.get(row.id) ?? { uniqueBuyerCount: 0, totalUnitsSold: 0 };
              return (
                <li key={row.id} className="border border-line bg-paper">
                  <div className="flex items-start gap-3 p-4">
                    <div className="relative h-16 w-[52px] shrink-0 overflow-hidden border border-line bg-paper-2">
                      {row.images[0] && (
                        <Image src={row.images[0]} alt="" fill sizes="52px" className="object-cover" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold leading-tight">{row.name}</p>
                      <p className="mt-0.5 truncate text-xs text-ink-soft">/{row.slug}</p>
                      <span
                        className={clsx(
                          "mt-2 inline-block px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.06em]",
                          row.isArchived
                            ? "bg-paper-2 text-ink-soft"
                            : row.bestseller || row.isNew
                              ? "bg-gold/15 text-gold-ink"
                              : "bg-paper-2 text-ink-soft",
                        )}
                      >
                        {row.isArchived
                          ? "Archived"
                          : row.bestseller
                            ? "Bestseller"
                            : row.isNew
                              ? "New"
                              : "Active"}
                      </span>
                    </div>
                  </div>

                  <dl className="grid grid-cols-3 gap-px border-y border-line bg-line text-center">
                    <div className="bg-paper px-2 py-2.5">
                      <dt className="text-[10px] uppercase tracking-[0.1em] text-ink-soft">Price</dt>
                      <dd className="mt-0.5 text-sm font-semibold">
                        {min === max ? formatPrice(min) : `${formatPrice(min)}+`}
                      </dd>
                    </div>
                    <div className="bg-paper px-2 py-2.5">
                      <dt className="text-[10px] uppercase tracking-[0.1em] text-ink-soft">Buyers</dt>
                      <dd className="mt-0.5 text-sm font-semibold">{s.uniqueBuyerCount}</dd>
                    </div>
                    <div className="bg-paper px-2 py-2.5">
                      <dt className="text-[10px] uppercase tracking-[0.1em] text-ink-soft">Units</dt>
                      <dd className="mt-0.5 text-sm font-semibold">{s.totalUnitsSold}</dd>
                    </div>
                  </dl>

                  <div className="flex items-stretch gap-2 p-3 text-xs font-semibold uppercase tracking-[0.06em]">
                    <Link
                      href={`/admin/products/${row.id}/edit`}
                      className="flex min-h-11 flex-1 items-center justify-center border border-line transition-colors hover:border-ink hover:bg-ink hover:text-paper"
                    >
                      Edit
                    </Link>
                    <Link
                      href={`/admin/products/${row.id}/purchasers`}
                      className="flex min-h-11 flex-1 items-center justify-center border border-line transition-colors hover:border-ink hover:bg-ink hover:text-paper"
                    >
                      Purchasers
                    </Link>
                    <DeleteProductButton productId={row.id} productName={row.name} />
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
