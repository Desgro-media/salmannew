import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCustomerSession } from "@/lib/customer-session";

// The product page is cached (revalidate = 60), so it must not render anything
// user-specific — one visitor's draft would be served to the next. The form
// fetches the author's own review from here on the client instead.
export async function GET(request: Request) {
  const session = await getCustomerSession();
  if (!session) return NextResponse.json(null);

  const productId = new URL(request.url).searchParams.get("productId");
  if (!productId) {
    return NextResponse.json({ error: "productId is required." }, { status: 400 });
  }

  const review = await prisma.review.findUnique({
    where: { productId_customerId: { productId, customerId: session.sub } },
    select: {
      id: true,
      rating: true,
      title: true,
      body: true,
      photos: true,
      isHidden: true,
    },
  });

  return NextResponse.json(review);
}
