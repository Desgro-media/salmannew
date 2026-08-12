import { Reveal } from "@/components/motion/Reveal";
import { Stars } from "@/components/ui/Stars";
import { ReviewForm } from "@/components/product/ReviewForm";
import { ReviewPhotoStrip } from "@/components/product/ReviewPhotoStrip";
import {
  formatReviewDate,
  getProductReviews,
  getProductReviewSummary,
} from "@/lib/reviews";

// Server component on purpose: it renders only public data, so the product
// page stays cacheable. Anything user-specific lives in ReviewForm, which
// fetches it on the client.
export async function ProductReviews({
  productId,
  productName,
}: {
  productId: string;
  productName: string;
}) {
  const [reviews, summary] = await Promise.all([
    getProductReviews(productId),
    getProductReviewSummary(productId),
  ]);

  return (
    <section
      id="reviews"
      className="container-grid border-t border-line py-20 md:py-28"
    >
      <Reveal>
        <p className="eyebrow text-ink-soft">Reviews</p>
        <h2 className="mt-3 text-3xl font-black tracking-tight md:text-4xl">
          What people say about {productName}
        </h2>
      </Reveal>

      <div className="mt-12 grid grid-cols-1 gap-12 lg:grid-cols-12 lg:gap-16">
        <div className="lg:col-span-5">
          {summary.average != null ? (
            <Reveal>
              <div className="flex items-center gap-4">
                <span className="text-5xl font-black leading-none">
                  {summary.average.toFixed(1)}
                </span>
                <span className="block">
                  <Stars rating={summary.average} size="lg" />
                  <span className="mt-1.5 block text-xs text-ink-soft">
                    {summary.count} {summary.count === 1 ? "review" : "reviews"}
                  </span>
                </span>
              </div>

              <ul className="mt-6 space-y-1.5">
                {([5, 4, 3, 2, 1] as const).map((star) => {
                  const n = summary.distribution[star];
                  const percent =
                    summary.count === 0 ? 0 : (n / summary.count) * 100;
                  return (
                    <li key={star} className="flex items-center gap-3 text-xs">
                      <span className="w-8 shrink-0 text-ink-soft">
                        {star}★
                      </span>
                      <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-paper-3">
                        <span
                          className="block h-full rounded-full bg-gold-deep"
                          style={{ width: `${percent}%` }}
                        />
                      </span>
                      <span className="w-6 shrink-0 text-right tabular-nums text-ink-soft">
                        {n}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </Reveal>
          ) : (
            <Reveal>
              <p className="text-sm text-ink-soft">
                No reviews for {productName} yet — yours would be the first.
              </p>
            </Reveal>
          )}
        </div>

        <div className="lg:col-span-6 lg:col-start-7">
          {reviews.length === 0 ? (
            <p className="text-sm text-ink-soft">
              Nothing written yet. Wear it for a week, then come back and say
              how it held up.
            </p>
          ) : (
            <ul className="divide-y divide-line border-y border-line">
              {reviews.map((review) => (
                <li key={review.id} className="py-7 first:pt-0 last:pb-0">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <Stars rating={review.rating} />
                      {review.title && (
                        <h3 className="mt-2.5 text-base font-bold leading-snug">
                          {review.title}
                        </h3>
                      )}
                    </div>
                    {review.verifiedPurchase && (
                      <span className="shrink-0 rounded-full border border-line px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-soft">
                        Verified purchase
                      </span>
                    )}
                  </div>

                  <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-ink-soft">
                    {review.body}
                  </p>

                  {review.photos.length > 0 && (
                    <ReviewPhotoStrip photos={review.photos} className="mt-4" />
                  )}

                  <p className="mt-4 text-xs text-ink-soft">
                    <span className="font-semibold text-ink">
                      {review.author.name}
                    </span>
                    {" · "}
                    {formatReviewDate(review.createdAt)}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Full width rather than stacked under the summary in the left column.
          Confined to five of twelve columns the form had no room to put two
          fields side by side, so every field became another row and the section
          ran on for a screen and a half. */}
      <div className="mt-12">
        <ReviewForm productId={productId} />
      </div>
    </section>
  );
}
