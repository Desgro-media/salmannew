import { revalidatePath } from "next/cache";

// A catalogue change is never confined to one page: the same products drive the
// homepage rows (BestSellers, SignatureCollections), the shop grid, and every
// product page. Revalidating individual paths meant the homepage kept serving a
// stale product list after an admin edit — and a rename left the old
// /product/<slug> entry behind unless the caller remembered to clear it too.
//
// Revalidating the root layout invalidates every page beneath it in one call,
// which is both cheaper to reason about and impossible to get half-right. The
// storefront is a handful of routes over a 17-product catalogue, so the extra
// regeneration is not worth optimising away.
export function revalidateStorefront() {
  revalidatePath("/", "layout");
}
