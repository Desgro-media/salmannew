import { loadProductCodeRows, toCsv } from "@/lib/product-code-list";

// Access is enforced by proxy.ts, which guards /api/admin/:path* — same as the
// other admin routes.
//
// The product codes as a spreadsheet file. Retired products and sizes are left
// out unless ?retired=1, because they are not for sale and PostBridge has no use
// for them.

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const includeRetired = new URL(request.url).searchParams.get("retired") === "1";
  const rows = await loadProductCodeRows({ includeRetired });
  const day = new Date().toISOString().slice(0, 10);

  return new Response(toCsv(rows), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="salman-perfumes-product-codes-${day}.csv"`,
      // A list that must be current the moment a product is added.
      "Cache-Control": "no-store",
    },
  });
}
