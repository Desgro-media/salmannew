import { prisma } from "./db";

export interface ReviewAuthor {
  id: string;
  /** Display name, already shortened to "First L." for public rendering. */
  name: string;
}

export interface ProductReview {
  id: string;
  rating: number;
  title: string | null;
  body: string;
  photos: string[];
  verifiedPurchase: boolean;
  author: ReviewAuthor;
  createdAt: Date;
}

export interface HomepageReview extends ProductReview {
  productSlug: string;
  productName: string;
}

export interface ReviewSummary {
  count: number;
  /** Mean rating to one decimal, or null when there are no reviews. */
  average: number | null;
  /** Counts keyed 1-5, always present so the bars can render zeroes. */
  distribution: Record<1 | 2 | 3 | 4 | 5, number>;
}

// Reviews are public, so surnames get initialled rather than printed in full.
// Done here, in the only place review rows become view models, so no caller
// can leak the full name by accident.
function displayName(fullName: string): string {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "Anonymous";
  if (parts.length === 1) return parts[0];
  return `${parts[0]} ${parts[parts.length - 1][0].toUpperCase()}.`;
}

const reviewSelect = {
  id: true,
  rating: true,
  title: true,
  body: true,
  photos: true,
  verifiedPurchase: true,
  createdAt: true,
  customer: { select: { id: true, fullName: true } },
} as const;

type ReviewRow = {
  id: string;
  rating: number;
  title: string | null;
  body: string;
  photos: string[];
  verifiedPurchase: boolean;
  createdAt: Date;
  customer: { id: string; fullName: string };
};

function toReview(row: ReviewRow): ProductReview {
  return {
    id: row.id,
    rating: row.rating,
    title: row.title,
    body: row.body,
    photos: row.photos,
    verifiedPurchase: row.verifiedPurchase,
    author: { id: row.customer.id, name: displayName(row.customer.fullName) },
    createdAt: row.createdAt,
  };
}

export async function getProductReviews(productId: string): Promise<ProductReview[]> {
  const rows = await prisma.review.findMany({
    where: { productId, isHidden: false },
    select: reviewSelect,
    orderBy: { createdAt: "desc" },
  });
  return rows.map(toReview);
}

const EMPTY_DISTRIBUTION: Record<1 | 2 | 3 | 4 | 5, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };

export async function getProductReviewSummary(productId: string): Promise<ReviewSummary> {
  const grouped = await prisma.review.groupBy({
    by: ["rating"],
    where: { productId, isHidden: false },
    _count: { rating: true },
  });

  const distribution = { ...EMPTY_DISTRIBUTION };
  let count = 0;
  let total = 0;

  for (const group of grouped) {
    const rating = group.rating as 1 | 2 | 3 | 4 | 5;
    const n = group._count.rating;
    if (rating >= 1 && rating <= 5) distribution[rating] = n;
    count += n;
    total += rating * n;
  }

  return {
    count,
    average: count === 0 ? null : Math.round((total / count) * 10) / 10,
    distribution,
  };
}

/** The one review the signed-in customer has already left, if any. */
export async function getOwnReview(
  productId: string,
  customerId: string,
): Promise<ProductReview | null> {
  const row = await prisma.review.findUnique({
    where: { productId_customerId: { productId, customerId } },
    select: reviewSelect,
  });
  return row ? toReview(row) : null;
}

/**
 * Best reviews across the whole catalog, for the homepage band. Sorted by
 * rating then recency, and biased toward ones with a photo or a title so the
 * cards have something to show.
 */
export async function getFeaturedReviews(limit = 8): Promise<HomepageReview[]> {
  const rows = await prisma.review.findMany({
    where: { isHidden: false, rating: { gte: 4 } },
    select: {
      ...reviewSelect,
      product: { select: { slug: true, name: true } },
    },
    orderBy: [{ rating: "desc" }, { createdAt: "desc" }],
    take: limit,
  });

  return rows.map((row) => ({
    ...toReview(row),
    productSlug: row.product.slug,
    productName: row.product.name,
  }));
}

export async function getSiteReviewSummary(): Promise<ReviewSummary> {
  const grouped = await prisma.review.groupBy({
    by: ["rating"],
    where: { isHidden: false },
    _count: { rating: true },
  });

  const distribution = { ...EMPTY_DISTRIBUTION };
  let count = 0;
  let total = 0;

  for (const group of grouped) {
    const rating = group.rating as 1 | 2 | 3 | 4 | 5;
    const n = group._count.rating;
    if (rating >= 1 && rating <= 5) distribution[rating] = n;
    count += n;
    total += rating * n;
  }

  return {
    count,
    average: count === 0 ? null : Math.round((total / count) * 10) / 10,
    distribution,
  };
}

const monthFormatter = new Intl.DateTimeFormat("en-IN", {
  month: "long",
  year: "numeric",
  // Pin the zone so a server in one timezone and a browser in another can't
  // render different months for the same review.
  timeZone: "UTC",
});

export function formatReviewDate(date: Date): string {
  return monthFormatter.format(date);
}
