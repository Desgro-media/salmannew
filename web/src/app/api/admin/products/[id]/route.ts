import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { productUpdateSchema } from "@/lib/admin-schema";
import { revalidateStorefront } from "@/lib/revalidate";
import {
  SaveConflict,
  codeConflictBody,
  findCodeConflicts,
  isUniqueViolation,
  newSizeId,
} from "@/lib/product-codes";

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

        // What this product already owns, archived sizes included. A size id the
        // form sends that exists but is not in this set belongs to another
        // product, and is not ours to rewrite.
        const ownIds = new Set(
          (await tx.productSize.findMany({ where: { productId: id }, select: { id: true } })).map(
            (s) => s.id,
          ),
        );
        const foreign = sizes.filter((s) => s.id && !ownIds.has(s.id)).map((s) => s.id!);
        if (foreign.length > 0 && (await tx.productSize.count({ where: { id: { in: foreign } } })) > 0) {
          throw new SaveConflict({
            error: "A size on this form belongs to a different product. Reload the page and try again.",
          });
        }

        // After the sweep above, so a size removed in this very save frees its
        // code for another one added in the same save. Inside the transaction,
        // so the answer cannot go stale before the writes below.
        const conflicts = await findCodeConflicts(
          tx,
          sizes.map((s) => ({ sku: s.sku, sizeId: s.id })),
        );
        if (conflicts.length > 0) throw new SaveConflict(codeConflictBody(conflicts));

        for (const size of sizes) {
          const data = {
            label: size.label,
            volumeMl: size.volumeMl,
            sku: size.sku,
            price: size.price,
            compareAtPrice: size.compareAtPrice,
            image: size.image,
            thumb: size.thumb,
          };

          if (size.id && ownIds.has(size.id)) {
            await tx.productSize.update({ where: { id: size.id }, data });
          } else {
            // A new size. Never an upsert keyed on something derived from its
            // code: that is how an "add" used to overwrite another product's size.
            await tx.productSize.create({
              data: { id: size.id ?? newSizeId(), productId: id, ...data },
            });
          }
        }
      }

      return tx.product.findUniqueOrThrow({
        where: { id: row.id },
        include: { sizes: { orderBy: { volumeMl: "asc" } } },
      });
    });

    revalidateStorefront();

    return NextResponse.json(updated);
  } catch (err) {
    if (err instanceof SaveConflict) {
      return NextResponse.json(err.body, { status: 409 });
    }
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2003") {
      return NextResponse.json(
        { error: "Can't remove a size that already has orders against it." },
        { status: 409 },
      );
    }
    if (isUniqueViolation(err)) {
      // The slug is taken, or someone saved the same code between the check and
      // the write. The transaction rolled back, so nothing is half-saved.
      const raced = sizes
        ? await findCodeConflicts(
            prisma,
            sizes.map((s) => ({ sku: s.sku, sizeId: s.id })),
          )
        : [];
      if (raced.length > 0) {
        return NextResponse.json(codeConflictBody(raced), { status: 409 });
      }
      return NextResponse.json({ error: "A product with this slug already exists." }, { status: 409 });
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
    revalidateStorefront();
    return NextResponse.json({ archived: true, product: archived });
  }

  await prisma.product.delete({ where: { id } });
  revalidateStorefront();
  return NextResponse.json({ deleted: true });
}
