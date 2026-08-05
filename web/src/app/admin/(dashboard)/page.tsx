import Link from "next/link";
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

  return (
    <div>
      <h1 className="text-3xl font-black tracking-tight">Products</h1>
      <p className="mt-1 text-sm text-ink-soft">
        {rows.length} product{rows.length === 1 ? "" : "s"}
      </p>

      <div className="mt-8 overflow-x-auto">
        <table className="w-full min-w-[720px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-line text-left text-xs uppercase tracking-[0.1em] text-ink-soft">
              <th className="py-3 pr-4 font-medium">Product</th>
              <th className="py-3 pr-4 font-medium">Category</th>
              <th className="py-3 pr-4 font-medium">Price</th>
              <th className="py-3 pr-4 font-medium">Status</th>
              <th className="py-3 pr-4 font-medium">Buyers</th>
              <th className="py-3 pr-4 font-medium">Units Sold</th>
              <th className="py-3 pr-4 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const { min, max } = priceRange(row.sizes);
              const s = stats.get(row.id) ?? { uniqueBuyerCount: 0, totalUnitsSold: 0 };
              return (
                <tr key={row.id} className="border-b border-line">
                  <td className="py-3 pr-4">
                    <p className="font-semibold">{row.name}</p>
                    <p className="text-xs text-ink-soft">/{row.slug}</p>
                  </td>
                  <td className="py-3 pr-4 text-ink-soft">{row.category}</td>
                  <td className="py-3 pr-4">
                    {min === max ? formatPrice(min) : `${formatPrice(min)} – ${formatPrice(max)}`}
                  </td>
                  <td className="py-3 pr-4">
                    {row.isArchived ? (
                      <span className="text-ink-soft">Archived</span>
                    ) : row.bestseller ? (
                      <span className="text-gold-ink">Bestseller</span>
                    ) : row.isNew ? (
                      <span className="text-gold-ink">New</span>
                    ) : (
                      <span className="text-ink-soft">Active</span>
                    )}
                  </td>
                  <td className="py-3 pr-4">{s.uniqueBuyerCount}</td>
                  <td className="py-3 pr-4">{s.totalUnitsSold}</td>
                  <td className="py-3 pr-4 text-right">
                    <div className="flex justify-end gap-4 text-xs font-semibold uppercase tracking-[0.08em]">
                      <Link href={`/admin/products/${row.id}/edit`} className="hover:text-gold-ink">
                        Edit
                      </Link>
                      <Link href={`/admin/products/${row.id}/purchasers`} className="hover:text-gold-ink">
                        Purchasers
                      </Link>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
