import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { productUpdateSchema } from "@/lib/admin-schema";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const json = await request.json();
  const parsed = productUpdateSchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const existing = await prisma.product.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Product not found." }, { status: 404 });
  }

  const { notes, sizes, ...product } = parsed.data;

  try {
    const updated = await prisma.$transaction(async (tx) => {
      const row = await tx.product.update({
        where: { id },
        data: {
          ...product,
          ...(notes && {
            notesTop: notes.top,
            notesHeart: notes.heart,
            notesBase: notes.base,
          }),
        },
      });

      if (sizes) {
        const keepIds = sizes.filter((s) => s.id).map((s) => s.id!);
        // Archived sizes are excluded from the sweep. They are deliberately
        // absent from the form the admin submitted, so they would otherwise
        // look like removals — and the delete would fail anyway the moment one
        // of them had an order against it.
        await tx.productSize.deleteMany({
          where: { productId: id, id: { notIn: keepIds }, isArchived: false },
        });

        for (const size of sizes) {
          const sizeId = size.id ?? size.sku.toLowerCase();
          await tx.productSize.upsert({
            where: { id: sizeId },
            update: {
              label: size.label,
              volumeMl: size.volumeMl,
              sku: size.sku,
              price: size.price,
              compareAtPrice: size.compareAtPrice,
              image: size.image,
              thumb: size.thumb,
            },
            create: {
              id: sizeId,
              productId: id,
              label: size.label,
              volumeMl: size.volumeMl,
              sku: size.sku,
              price: size.price,
              compareAtPrice: size.compareAtPrice,
              image: size.image,
              thumb: size.thumb,
            },
          });
        }
      }

      return tx.product.findUniqueOrThrow({
        where: { id: row.id },
        include: { sizes: { orderBy: { volumeMl: "asc" } } },
      });
    });

    revalidatePath("/shop");
    revalidatePath(`/product/${updated.slug}`);
    if (existing.slug !== updated.slug) {
      revalidatePath(`/product/${existing.slug}`);
    }

    return NextResponse.json(updated);
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2003") {
      return NextResponse.json(
        { error: "Can't remove a size that already has orders against it." },
        { status: 409 },
      );
    }
    throw err;
  }
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;

  const product = await prisma.product.findUnique({
    where: { id },
    include: { _count: { select: { orderItems: true } } },
  });

  if (!product) {
    return NextResponse.json({ error: "Product not found." }, { status: 404 });
  }

  if (product._count.orderItems > 0) {
    const archived = await prisma.product.update({
      where: { id },
      data: { isArchived: true },
    });
    revalidatePath("/shop");
    revalidatePath(`/product/${archived.slug}`);
    return NextResponse.json({ archived: true, product: archived });
  }

  await prisma.product.delete({ where: { id } });
  revalidatePath("/shop");
  revalidatePath(`/product/${product.slug}`);
  return NextResponse.json({ deleted: true });
}
