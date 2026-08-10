import Image from "next/image";
import Link from "next/link";
import { clsx } from "clsx";
import { prisma } from "@/lib/db";
import { Stars } from "@/components/ui/Stars";
import { ReviewModerationButtons } from "@/components/admin/ReviewModerationButtons";

export const dynamic = "force-dynamic";

const dateFormatter = new Intl.DateTimeFormat("en-IN", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});

export default async function AdminReviewsPage() {
  // Admin view shows hidden reviews too — that is the whole point of the page.
  const reviews = await prisma.review.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      product: { select: { name: true, slug: true } },
      customer: { select: { fullName: true, email: true } },
    },
  });

  const hiddenCount = reviews.filter((r) => r.isHidden).length;
  const withPhotos = reviews.filter((r) => r.photos.length > 0).length;

  return (
    <div>
      <div>
        <h1 className="text-3xl font-black tracking-tight">Reviews</h1>
        <p className="mt-1 text-sm text-ink-soft">
          Reviews publish immediately. Hide anything that shouldn&rsquo;t be on
          the storefront — hidden reviews can be restored, deleted ones cannot.
        </p>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-px overflow-hidden border border-line bg-line sm:grid-cols-3">
        <div className="bg-paper px-6 py-5">
          <p className="text-2xl font-black">{reviews.length}</p>
          <p className="mt-0.5 text-xs uppercase tracking-[0.1em] text-ink-soft">Total</p>
        </div>
        <div className="bg-paper px-6 py-5">
          <p className="text-2xl font-black">{withPhotos}</p>
          <p className="mt-0.5 text-xs uppercase tracking-[0.1em] text-ink-soft">With Photos</p>
        </div>
        <div className="bg-paper px-6 py-5">
          <p className="text-2xl font-black">{hiddenCount}</p>
          <p className="mt-0.5 text-xs uppercase tracking-[0.1em] text-ink-soft">Hidden</p>
        </div>
      </div>

      {reviews.length === 0 ? (
        <p className="mt-10 text-sm text-ink-soft">No reviews have been written yet.</p>
      ) : (
        <ul className="mt-8 divide-y divide-line border-y border-line">
          {reviews.map((review) => (
            <li
              key={review.id}
              className={clsx("py-6", review.isHidden && "opacity-55")}
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-3">
                    <Stars rating={review.rating} />
                    <Link
                      href={`/product/${review.product.slug}`}
                      className="text-xs font-semibold uppercase tracking-[0.1em] hover:text-gold-ink"
                    >
                      {review.product.name}
                    </Link>
                    {review.verifiedPurchase && (
                      <span className="rounded-full border border-line px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.1em] text-ink-soft">
                        Verified
                      </span>
                    )}
                    {review.isHidden && (
                      <span className="rounded-full bg-ink px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.1em] text-paper">
                        Hidden
                      </span>
                    )}
                  </div>

                  {review.title && (
                    <h2 className="mt-2 text-base font-bold">{review.title}</h2>
                  )}
                  <p className="mt-1.5 max-w-2xl whitespace-pre-line text-sm text-ink-soft">
                    {review.body}
                  </p>

                  {review.photos.length > 0 && (
                    <ul className="mt-3 flex flex-wrap gap-2">
                      {review.photos.map((photo, i) => (
                        <li key={photo}>
                          <a href={photo} target="_blank" rel="noopener noreferrer">
                            <span className="relative block h-16 w-16 overflow-hidden rounded-lg border border-line bg-paper-2">
                              <Image
                                src={photo}
                                alt={`Review photo ${i + 1}`}
                                fill
                                sizes="64px"
                                className="object-cover"
                              />
                            </span>
                          </a>
                        </li>
                      ))}
                    </ul>
                  )}

                  <p className="mt-3 text-xs text-ink-soft">
                    {review.customer.fullName} &middot; {review.customer.email} &middot;{" "}
                    {dateFormatter.format(review.createdAt)}
                  </p>
                </div>

                <ReviewModerationButtons
                  reviewId={review.id}
                  isHidden={review.isHidden}
                  authorName={review.customer.fullName}
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
