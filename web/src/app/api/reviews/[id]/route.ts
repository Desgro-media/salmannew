import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { getCustomerSession } from "@/lib/customer-session";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getCustomerSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const review = await prisma.review.findUnique({
    where: { id },
    select: { customerId: true, product: { select: { slug: true } } },
  });

  if (!review) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Ownership is checked against the session, not anything in the request, so
  // knowing another customer's review id gets you nothing.
  if (review.customerId !== session.sub) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.review.delete({ where: { id } });

  revalidatePath(`/product/${review.product.slug}`);
  revalidatePath("/");

  return NextResponse.json({ ok: true });
}
