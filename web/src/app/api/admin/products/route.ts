import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { productInputSchema } from "@/lib/admin-schema";
import { getPurchaseStatsByProduct } from "@/lib/purchase-stats";

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
      ...(stats.get(product.id) ?? { uniqueBuyerCount: 0, totalUnitsSold: 0 }),
    })),
  );
}

export async function POST(request: Request) {
  const json = await request.json();
  const parsed = productInputSchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { notes, sizes, ...product } = parsed.data;

  const existing = await prisma.product.findUnique({ where: { slug: product.slug } });
  if (existing) {
    return NextResponse.json({ error: "A product with this slug already exists." }, { status: 409 });
  }

  const created = await prisma.product.create({
    data: {
      ...product,
      notesTop: notes.top,
      notesHeart: notes.heart,
      notesBase: notes.base,
      sizes: {
        create: sizes.map((size) => ({
          id: size.id ?? size.sku.toLowerCase(),
          label: size.label,
          volumeMl: size.volumeMl,
          sku: size.sku,
          price: size.price,
          compareAtPrice: size.compareAtPrice,
          image: size.image,
          thumb: size.thumb,
        })),
      },
    },
    include: { sizes: true },
  });

  return NextResponse.json(created, { status: 201 });
}
