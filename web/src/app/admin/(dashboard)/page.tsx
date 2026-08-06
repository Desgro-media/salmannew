import Link from "next/link";
import Image from "next/image";
import { clsx } from "clsx";
import { prisma } from "@/lib/db";
import { getPurchaseStatsByProduct } from "@/lib/purchase-stats";
import { formatPrice } from "@/lib/format";

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
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight">Products</h1>
          <p className="mt-1 text-sm text-ink-soft">
            {rows.length} product{rows.length === 1 ? "" : "s"} in the catalog
          </p>
        </div>
        <Link
          href="/admin/products/new"
          className="inline-flex items-center gap-2 bg-ink px-6 py-3 text-xs font-semibold uppercase tracking-[0.14em] text-paper transition-colors hover:bg-gold hover:text-ink"
        >
          + New Product
        </Link>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-px overflow-hidden border border-line bg-line sm:grid-cols-3">
        <div className="bg-paper px-6 py-5">
          <p className="text-2xl font-black">{rows.length}</p>
          <p className="mt-0.5 text-xs uppercase tracking-[0.1em] text-ink-soft">Products</p>
        </div>
        <div className="bg-paper px-6 py-5">
          <p className="text-2xl font-black">{totals.buyers}</p>
          <p className="mt-0.5 text-xs uppercase tracking-[0.1em] text-ink-soft">Total Buyers</p>
        </div>
        <div className="bg-paper px-6 py-5">
          <p className="text-2xl font-black">{totals.units}</p>
          <p className="mt-0.5 text-xs uppercase tracking-[0.1em] text-ink-soft">Units Sold</p>
        </div>
      </div>

      <div className="mt-8 overflow-x-auto border border-line">
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
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
