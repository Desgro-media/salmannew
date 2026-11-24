import Link from "next/link";
import { clsx } from "clsx";
import { loadProductCodeRows, toTsv, type ProductCodeRow } from "@/lib/product-code-list";
import { formatPrice } from "@/lib/format";
import { CopyCodesButton } from "@/components/admin/CopyCodesButton";

export const dynamic = "force-dynamic";

const ACTION =
  "flex min-h-11 items-center border border-line px-4 text-xs font-semibold uppercase tracking-[0.06em] transition-colors hover:border-ink hover:bg-ink hover:text-paper md:min-h-0 md:py-2";

function Weight({ row }: { row: ProductCodeRow }) {
  if (row.weightGrams !== null) return <>{row.weightGrams} g</>;
  // A retired size will never be shipped, so a missing weight there is no problem.
  return row.status === "Retired" ? <span className="text-ink-soft">—</span> : <span className="font-medium text-red-700">No weight yet</span>;
}

function StatusChip({ status }: { status: ProductCodeRow["status"] }) {
  return (
    <span
      className={clsx(
        "inline-block px-2 py-0.5 text-xs font-medium uppercase tracking-[0.06em]",
        status === "On sale" ? "bg-gold/15 text-gold-ink" : "bg-paper-2 text-ink-soft",
      )}
    >
      {status}
    </span>
  );
}

export default async function ProductCodesPage({
  searchParams,
}: {
  searchParams: Promise<{ retired?: string }>;
}) {
  const includeRetired = (await searchParams).retired === "1";
  const rows = await loadProductCodeRows({ includeRetired });

  const forSale = rows.filter((row) => row.status !== "Retired");
  const noWeight = forSale.filter((row) => row.weightGrams === null).length;

  return (
    <div>
      <h1 className="text-3xl font-black tracking-tight">Product Codes</h1>
      <p className="mt-1 max-w-2xl text-sm text-ink-soft">
        Every size has its own code. The shop sends it with each order, and PostBridge needs the same list in its
        catalogue — one entry per size, spelled exactly as it is here. Download this whenever you add a product, and send
        PostBridge the new rows.
      </p>

      <p className="mt-5 text-sm">
        <strong>{forSale.length}</strong> {forSale.length === 1 ? "code" : "codes"}
        {noWeight > 0 ? (
          <>
            {" "}
            · <strong className="text-red-700">{noWeight}</strong> still without a weight
          </>
        ) : (
          <> · every size has a weight</>
        )}
        {includeRetired && rows.length > forSale.length && <> · {rows.length - forSale.length} retired shown below</>}
      </p>

      <div className="mt-4 flex flex-wrap gap-2">
        <a href={`/api/admin/product-codes/export${includeRetired ? "?retired=1" : ""}`} download className={clsx(ACTION, "bg-ink text-paper hover:bg-gold hover:text-ink")}>
          Download (Excel / CSV)
        </a>
        <CopyCodesButton text={toTsv(rows)} />
        <Link href={includeRetired ? "/admin/product-codes" : "/admin/product-codes?retired=1"} className={ACTION}>
          {includeRetired ? "Hide retired" : "Show retired too"}
        </Link>
      </div>

      {rows.length === 0 ? (
        <p className="mt-8 border border-line px-4 py-10 text-center text-sm text-ink-soft">No products yet.</p>
      ) : (
        <>
          {/* A table on a desktop; a phone gets cards, as the Products list does. */}
          <div className="mt-6 hidden overflow-x-auto border border-line md:block">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-line bg-paper-2 text-left text-xs uppercase tracking-[0.1em] text-ink-soft">
                  <th className="py-3 pl-4 pr-4 font-medium">Code</th>
                  <th className="py-3 pr-4 font-medium">Product</th>
                  <th className="py-3 pr-4 font-medium">Size</th>
                  <th className="py-3 pr-4 font-medium">Weight</th>
                  <th className="py-3 pr-4 font-medium">Price</th>
                  <th className="py-3 pr-4 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.code} className="border-b border-line last:border-b-0 hover:bg-paper-2/60">
                    <td className="py-2.5 pl-4 pr-4 font-mono text-xs font-semibold">{row.code}</td>
                    <td className="py-2.5 pr-4">{row.product}</td>
                    <td className="py-2.5 pr-4 text-ink-soft">{row.size}</td>
                    <td className="py-2.5 pr-4"><Weight row={row} /></td>
                    <td className="py-2.5 pr-4">{formatPrice(row.price)}</td>
                    <td className="py-2.5 pr-4"><StatusChip status={row.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <ul className="mt-6 space-y-3 md:hidden">
            {rows.map((row) => (
              <li key={row.code} className="border border-line bg-paper p-4">
                <p className="break-all font-mono text-sm font-semibold">{row.code}</p>
                <p className="mt-1 text-sm">
                  {row.product} <span className="text-ink-soft">· {row.size}</span>
                </p>
                <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-ink-soft">
                  <span><Weight row={row} /></span>
                  <span>{formatPrice(row.price)}</span>
                  <StatusChip status={row.status} />
                </p>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
