// Curated customer reviews, shown on the homepage. This is editorial content
// the shop controls — not user-generated — so it lives in code alongside
// contact-info.ts rather than in the database. Edit this file to change what
// the storefront shows.
//
// `productSlug` must match a Product.slug in the database: the card links to
// /product/<slug>, so rename these in step with any slug change.

export interface Review {
  id: string;
  name: string;
  city: string;
  /** Whole stars, 1–5. */
  rating: number;
  productSlug: string;
  /** Display label for the product, e.g. "Oud Lavender". */
  productName: string;
  title: string;
  body: string;
  /** ISO date (YYYY-MM-DD). Displayed, and used to sort newest first. */
  date: string;
  /** True when the reviewer was matched to a real order at publishing time. */
  verified: boolean;
}

const REVIEWS: Review[] = [
  {
    id: "r-aisha-oud-lavender",
    name: "Aisha Rahman",
    city: "Kozhikode",
    rating: 5,
    productSlug: "oud-lavender",
    productName: "Oud Lavender",
    title: "Still there at the end of the day",
    body: "I sprayed it before the morning commute and could still catch it when I got home. The lavender keeps the oud from getting heavy — it reads warm rather than smoky.",
    date: "2026-07-28",
    verified: true,
  },
  {
    id: "r-nikhil-imperial",
    name: "Nikhil Menon",
    city: "Bengaluru",
    rating: 5,
    productSlug: "imperial",
    productName: "Imperial",
    title: "My default for evenings out",
    body: "Two sprays is plenty. It opens sharp and settles into something much softer after twenty minutes, which is exactly what I wanted from an oriental.",
    date: "2026-07-19",
    verified: true,
  },
  {
    id: "r-fathima-orchid",
    name: "Fathima Nasrin",
    city: "Kochi",
    rating: 5,
    productSlug: "orchid",
    productName: "Orchid",
    title: "Floral without being sweet",
    body: "I usually avoid florals because they turn syrupy on me. This one stays clean the whole way through. Three people at work asked what I was wearing.",
    date: "2026-07-11",
    verified: true,
  },
  {
    id: "r-arjun-akhdar",
    name: "Arjun Pillai",
    city: "Thrissur",
    rating: 4,
    productSlug: "akhdar",
    productName: "Akhdar",
    title: "Perfect for the humidity here",
    body: "Genuinely fresh — green and a little citrusy — and it survives a Kerala afternoon. Only reason it isn't five stars is that I wish it lasted an hour or two longer.",
    date: "2026-06-30",
    verified: true,
  },
  {
    id: "r-sana-latheer",
    name: "Sana Kabeer",
    city: "Malappuram",
    rating: 5,
    productSlug: "latheer",
    productName: "Latheer",
    title: "Clean musk, done properly",
    body: "It smells like good soap and warm skin, which is the highest compliment I can give a musk. I ordered the larger bottle on the second go.",
    date: "2026-06-22",
    verified: true,
  },
  {
    id: "r-rohan-lather",
    name: "Rohan Varghese",
    city: "Kannur",
    rating: 5,
    productSlug: "lather",
    productName: "Lather",
    title: "Bought it for my brother, kept it",
    body: "Soft, close to the skin, not the kind of thing that announces itself across a room. Ended up ordering a second bottle so he could actually have his.",
    date: "2026-06-14",
    verified: true,
  },
  {
    id: "r-meera-imperial",
    name: "Meera Suresh",
    city: "Kozhikode",
    rating: 4,
    productSlug: "imperial",
    productName: "Imperial",
    title: "Packaging is genuinely nice",
    body: "Arrived in three days, boxed well, nothing rattling. The scent is richer than I expected from the description — start with one spray and work up.",
    date: "2026-06-02",
    verified: true,
  },
  {
    id: "r-hari-oud-lavender",
    name: "Hari Krishnan",
    city: "Kollam",
    rating: 5,
    productSlug: "oud-lavender",
    productName: "Oud Lavender",
    title: "The one people ask about",
    body: "I've been through a lot of oud fragrances and most of them are too much. This sits close and stays balanced. It's the only bottle I've finished.",
    date: "2026-05-24",
    verified: true,
  },
];

/** Reviews in display order — newest first. */
export function getReviews(): Review[] {
  return [...REVIEWS].sort((a, b) => b.date.localeCompare(a.date));
}

export interface ReviewSummary {
  count: number;
  /** Mean rating rounded to one decimal, or null when there are no reviews. */
  average: number | null;
}

export function getReviewSummary(): ReviewSummary {
  if (REVIEWS.length === 0) return { count: 0, average: null };

  const total = REVIEWS.reduce((sum, review) => sum + review.rating, 0);
  return {
    count: REVIEWS.length,
    average: Math.round((total / REVIEWS.length) * 10) / 10,
  };
}

const monthFormatter = new Intl.DateTimeFormat("en-IN", {
  month: "long",
  year: "numeric",
  // Dates are plain calendar days, so pin the zone to stop a server in one
  // timezone and a browser in another from rendering different months.
  timeZone: "UTC",
});

export function formatReviewDate(isoDate: string): string {
  return monthFormatter.format(new Date(`${isoDate}T00:00:00Z`));
}
