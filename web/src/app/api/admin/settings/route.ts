import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { STORE_SETTINGS_ID } from "@/lib/store-settings";
import { revalidateStorefront } from "@/lib/revalidate";

// Authentication is handled upstream by proxy.ts, which covers /api/admin/* and
// rejects both unauthenticated requests and DELIVERY-role sessions.

const settingsSchema = z.object({
  // Whole rupees, matching every other price in the schema. Capped rather than
  // unbounded so a stray keystroke cannot post a five-digit delivery charge to
  // the live storefront.
  shippingFee: z.number().int().min(0).max(10_000),
  freeShippingThreshold: z.number().int().min(0).max(1_000_000),
});

export async function PUT(request: Request) {
  const parsed = settingsSchema.safeParse(await request.json().catch(() => null));

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Enter a whole number of rupees for both fields." },
      { status: 400 },
    );
  }

  // Upsert rather than update: the row is created by the migration, but a
  // database restored from an older dump would not have it, and an admin
  // saving settings should create it rather than see a P2025.
  const settings = await prisma.storeSettings.upsert({
    where: { id: STORE_SETTINGS_ID },
    update: parsed.data,
    create: { id: STORE_SETTINGS_ID, ...parsed.data },
  });

  // The threshold is quoted in the homepage marquee and on every product page,
  // both of which are cached. Without this purge the storefront would keep
  // advertising the old figure while checkout charged the new one.
  revalidateStorefront();

  return NextResponse.json({
    shippingFee: settings.shippingFee,
    freeShippingThreshold: settings.freeShippingThreshold,
  });
}
