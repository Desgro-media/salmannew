import { NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { revalidateStorefront } from "@/lib/revalidate";

// Node's timingSafeEqual is not available on the edge runtime.
export const runtime = "nodejs";

// Writes that bypass the app entirely — prisma/sync-catalogue.ts pushing
// seed-data.ts straight into the database — cannot call revalidatePath(), since
// that only works inside a running Next server. Without this endpoint the
// storefront keeps serving its cached pages until the 60s ISR window in
// (site)/layout.tsx lapses, and because Vercel serves stale-while-revalidate
// per edge region, the first visitor to each region sees the old catalogue.
// That is the "everyone else still sees the old site" gap.
//
// Guarded by a shared secret rather than an admin session: the callers are
// scripts and CI, which have no cookie to present.
function authorized(request: Request): boolean {
  const secret = process.env.REVALIDATE_SECRET;
  // Unset secret denies rather than allows — a misconfigured deploy must not
  // leave an open cache-busting endpoint.
  if (!secret) return false;

  const header = request.headers.get("authorization");
  if (!header?.startsWith("Bearer ")) return false;

  const provided = Buffer.from(header.slice("Bearer ".length));
  const expected = Buffer.from(secret);
  // timingSafeEqual throws on a length mismatch, so check that first.
  if (provided.length !== expected.length) return false;
  return timingSafeEqual(provided, expected);
}

export async function POST(request: Request) {
  if (!authorized(request)) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  revalidateStorefront();

  return NextResponse.json({ revalidated: true, at: new Date().toISOString() });
}
