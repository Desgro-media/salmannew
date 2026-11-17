import { prisma } from "./db";

/** Products a gift set's "What's inside" rows can link to: everything that isn't itself a set. */
export async function getLinkableProducts(excludeId?: string) {
  return prisma.product.findMany({
    where: { isArchived: false, isSet: false, ...(excludeId && { id: { not: excludeId } }) },
    select: { slug: true, name: true, fullName: true },
    orderBy: { name: "asc" },
  });
}
