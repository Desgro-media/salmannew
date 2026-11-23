import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { findCodeConflicts } from "@/lib/product-codes";

// Access is enforced by proxy.ts, which guards /api/admin/:path* — same as the
// other admin routes.
//
// The product form asks this while the admin is still typing, so a taken code is
// swapped for a free one before they press Save. It is advisory: saving checks
// again, because someone else can take the code in between.

const bodySchema = z.object({
  items: z
    .array(
      z.object({
        sku: z.string().max(80),
        // The saved size the code belongs to, so it isn't reported as clashing with itself.
        sizeId: z.string().max(100).optional(),
      }),
    )
    .min(1)
    .max(40),
});

export async function POST(request: Request) {
  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Nothing to check." }, { status: 400 });
  }

  const conflicts = await findCodeConflicts(prisma, parsed.data.items);
  return NextResponse.json({ conflicts });
}
