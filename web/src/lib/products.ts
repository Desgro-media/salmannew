import { Prisma } from "@prisma/client";
import { prisma } from "./db";
import type { Product } from "./types";

// Archived sizes are withheld from every storefront read: a retired size still
// has to exist for the orders that reference it, but must not be offered for
// sale or priced on a card.
const productWithSizes = Prisma.validator<Prisma.ProductDefaultArgs>()({
  include: { sizes: { where: { isArchived: false }, orderBy: { volumeMl: "asc" } } },
});

type ProductRow = Prisma.ProductGetPayload<typeof productWithSizes>;

function toProduct(row: ProductRow): Product {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    fullName: row.fullName,
    tagline: row.tagline,
    category: row.category,
    description: row.description,
    story: row.story,
    notes: {
      top: row.notesTop,
      heart: row.notesHeart,
      base: row.notesBase,
    },
    concentration: row.concentration,
    accent: row.accent,
    images: row.images,
    sizes: row.sizes.map((size) => ({
      id: size.id,
      label: size.label,
      volumeMl: size.volumeMl,
      sku: size.sku,
      price: size.price,
      compareAtPrice: size.compareAtPrice ?? undefined,
      image: size.image,
      thumb: size.thumb,
    })),
    bestseller: row.bestseller,
    signature: row.signature,
    isNew: row.isNew,
  };
}

export async function getAllProducts(): Promise<Product[]> {
  const rows = await prisma.product.findMany({
    where: { isArchived: false },
    include: productWithSizes.include,
    orderBy: { createdAt: "asc" },
  });
  return rows.map(toProduct);
}

// The homepage rows (Best Sellers, Signature Collections) lead with whatever was
// added last, so a new scent shows up at the front instead of past the scroll.
// getAllProducts stays oldest-first for everything else — the footer, shop and
// about page lean on that order. id breaks ties: cuids sort by creation time,
// and rows seeded in one batch can share a createdAt.
export async function getProductsNewestFirst(): Promise<Product[]> {
  const rows = await prisma.product.findMany({
    where: { isArchived: false },
    include: productWithSizes.include,
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
  });
  return rows.map(toProduct);
}

export async function getProductBySlug(slug: string): Promise<Product | undefined> {
  const row = await prisma.product.findUnique({
    where: { slug },
    include: productWithSizes.include,
  });
  return row ? toProduct(row) : undefined;
}

export async function getRelatedProducts(slug: string, count = 3): Promise<Product[]> {
  const rows = await prisma.product.findMany({
    where: { slug: { not: slug }, isArchived: false },
    include: productWithSizes.include,
    orderBy: { createdAt: "asc" },
    take: count,
  });
  return rows.map(toProduct);
}
