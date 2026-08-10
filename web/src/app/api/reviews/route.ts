import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { getCustomerSession } from "@/lib/customer-session";
import { reviewPayloadSchema } from "@/lib/review-schema";

export async function POST(request: Request) {
  const session = await getCustomerSession();
  if (!session) {
    return NextResponse.json(
      { error: "Please sign in to write a review." },
      { status: 401 },
    );
  }

  const json = await request.json().catch(() => null);
  const parsed = reviewPayloadSchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid review." },
      { status: 400 },
    );
  }

  const { productId, rating, title, body, photos } = parsed.data;

  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: { id: true, slug: true },
  });
  if (!product) {
    return NextResponse.json({ error: "Unknown product." }, { status: 404 });
  }

  // Matched on customerId rather than email: an unverified signup email would
  // otherwise be enough to claim a stranger's purchase history as your own.
  const purchaseCount = await prisma.orderItem.count({
    where: { productId: product.id, order: { customerId: session.sub } },
  });

  const review = await prisma.review.upsert({
    where: { productId_customerId: { productId: product.id, customerId: session.sub } },
    create: {
      productId: product.id,
      customerId: session.sub,
      rating,
      title: title || null,
      body,
      photos,
      verifiedPurchase: purchaseCount > 0,
    },
    update: {
      rating,
      title: title || null,
      body,
      photos,
      verifiedPurchase: purchaseCount > 0,
      // Re-editing a hidden review does not put it back on the storefront —
      // an admin took it down and only an admin can restore it.
    },
    select: { id: true },
  });

  revalidatePath(`/product/${product.slug}`);
  revalidatePath("/");

  return NextResponse.json({ id: review.id }, { status: 201 });
}
