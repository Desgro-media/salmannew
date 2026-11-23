import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { productCreateSchema } from "@/lib/admin-schema";
import { EMPTY_PURCHASE_STATS, getPurchaseStatsByProduct } from "@/lib/purchase-stats";
import { revalidateStorefront } from "@/lib/revalidate";
import { codeConflictBody, findCodeConflicts, isUniqueViolation, newSizeId } from "@/lib/product-codes";

export async function GET() {
  const [products, stats] = await Promise.all([
    prisma.product.findMany({
      include: { sizes: { orderBy: { volumeMl: "asc" } } },
      orderBy: { createdAt: "desc" },
    }),
    getPurchaseStatsByProduct(),
  ]);

  return NextResponse.json(
    products.map((product) => ({
      ...product,
      ...(stats.get(product.id) ?? EMPTY_PURCHASE_STATS),
    })),
  );
}

export async function POST(request: Request) {
  const json = await request.json();
  const parsed = productCreateSchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { notes, sizes, ...product } = parsed.data;

  const existing = await prisma.product.findUnique({ where: { slug: product.slug } });
  if (existing) {
    return NextResponse.json({ error: "A product with this slug already exists." }, { status: 409 });
  }

  // A code can only ever belong to one size, archived ones included. The database
  // would refuse a repeat with an error that says nothing, so look first and tell
  // the admin which code clashed, who has it, and what to use instead.
  const conflicts = await findCodeConflicts(
    prisma,
    sizes.map((size) => ({ sku: size.sku })),
  );
  if (conflicts.length > 0) {
    return NextResponse.json(codeConflictBody(conflicts), { status: 409 });
  }

  try {
    const created = await prisma.product.create({
      data: {
        ...product,
        notesTop: notes.top,
        notesHeart: notes.heart,
        notesBase: notes.base,
        sizes: {
          create: sizes.map((size) => ({
            // Always a fresh id: a new product's sizes are new rows. Deriving it
            // from the code is what let two products collide on a primary key.
            id: newSizeId(),
            label: size.label,
            volumeMl: size.volumeMl,
            sku: size.sku,
            price: size.price,
            compareAtPrice: size.compareAtPrice,
            weightGrams: size.weightGrams ?? null,
            image: size.image,
            thumb: size.thumb,
          })),
        },
      },
      include: { sizes: true },
    });

    // A new product belongs on the shop grid and, if flagged, the homepage rows —
    // neither of which refreshed before, so a freshly created scent stayed
    // invisible until the ISR window lapsed.
    revalidateStorefront();

    return NextResponse.json(created, { status: 201 });
  } catch (err) {
    if (!isUniqueViolation(err)) throw err;

    // Someone saved the same slug or code between the checks above and this
    // insert. The whole create rolled back, so nothing is half-written.
    const raced = await findCodeConflicts(
      prisma,
      sizes.map((size) => ({ sku: size.sku })),
    );
    if (raced.length > 0) {
      return NextResponse.json(codeConflictBody(raced), { status: 409 });
    }
    return NextResponse.json({ error: "A product with this slug already exists." }, { status: 409 });
  }
}
