import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db";

// Auth is enforced by proxy.ts, which guards /api/admin/:path* — same as the
// other admin routes in this app.

const patchSchema = z.object({ isHidden: z.boolean() });

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const parsed = patchSchema.safeParse(await request.json().catch(() => null));

  if (!parsed.success) {
    return NextResponse.json({ error: "isHidden must be a boolean." }, { status: 400 });
  }

  const existing = await prisma.review.findUnique({
    where: { id },
    select: { product: { select: { slug: true } } },
  });
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.review.update({
    where: { id },
    data: { isHidden: parsed.data.isHidden },
  });

  revalidatePath(`/product/${existing.product.slug}`);
  revalidatePath("/");

  return NextResponse.json({ ok: true });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const existing = await prisma.review.findUnique({
    where: { id },
    select: { product: { select: { slug: true } } },
  });
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.review.delete({ where: { id } });

  revalidatePath(`/product/${existing.product.slug}`);
  revalidatePath("/");

  return NextResponse.json({ ok: true });
}
