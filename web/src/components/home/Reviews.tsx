import Link from "next/link";
import { Reveal } from "@/components/motion/Reveal";
import { ButtonLink } from "@/components/ui/Button";
import { HorizontalScroller } from "@/components/ui/HorizontalScroller";
import { Stars } from "@/components/ui/Stars";
import { ReviewPhotoStrip } from "@/components/product/ReviewPhotoStrip";
import { formatReviewDate, getFeaturedReviews, getSiteReviewSummary } from "@/lib/reviews";

export async function Reviews() {
  const [reviews, summary] = await Promise.all([
    getFeaturedReviews(),
    getSiteReviewSummary(),
  ]);

  // No reviews yet is the normal state for a new store, so the section still
  // renders — it keeps the closing Shop Now CTA that used to live in the brand
  // banner, rather than the homepage just ending at the newsletter band.
  if (reviews.length === 0) {
    return (
      <section className="border-t border-line py-16 sm:py-24 md:py-32">
        <div className="container-grid text-center">
          <Reveal>
            <p className="eyebrow text-ink-soft">Worn &amp; Reviewed</p>
            <h2 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl md:text-5xl">
              No reviews yet.
            </h2>
            <p className="mx-auto mt-4 max-w-md text-sm text-ink-soft">
              Wear one for a week, then tell us how it held up. Reviews appear
              here as soon as they&rsquo;re written.
            </p>
            <div className="mt-9 flex justify-center">
              <ButtonLink href="/shop">Shop Now</ButtonLink>
            </div>
          </Reveal>
        </div>
      </section>
    );
  }

  return (
    <section className="border-t border-line py-16 sm:py-24 md:py-32">
      <div className="container-grid flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
        <Reveal>
          <p className="eyebrow text-ink-soft">Worn &amp; Reviewed</p>
          <h2 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl md:text-6xl">
            What people say
          </h2>
        </Reveal>

        {summary.average != null && (
          <Reveal delay={0.1}>
            <div className="flex items-center gap-4">
              <span className="text-4xl font-black leading-none md:text-5xl">
                {summary.average.toFixed(1)}
              </span>
              <span className="block">
                <Stars rating={summary.average} size="lg" />
                <span className="mt-1.5 block text-xs text-ink-soft">
                  Based on {summary.count} {summary.count === 1 ? "review" : "reviews"}
                </span>
              </span>
            </div>
          </Reveal>
        )}
      </div>

      <div className="container-grid mt-10 sm:mt-14">
        <HorizontalScroller>
          {reviews.map((review, i) => (
            <Reveal
              key={review.id}
              delay={(i % 3) * 0.06}
              className="w-[78vw] max-w-[330px] shrink-0 sm:w-[360px] sm:max-w-none"
            >
              <article className="flex h-full flex-col rounded-[28px] border border-line bg-paper-2 p-6 sm:p-7">
                <Stars rating={review.rating} />

                {review.title && (
                  <h3 className="mt-4 text-lg font-bold leading-snug">{review.title}</h3>
                )}
                <p className="mt-3 line-clamp-6 text-sm leading-relaxed text-ink-soft">
                  {review.body}
                </p>

                {review.photos.length > 0 && (
                  <ReviewPhotoStrip photos={review.photos} className="mt-4" />
                )}

                <div className="mt-auto pt-6">
                  <div className="flex items-start justify-between gap-3 border-t border-line pt-4">
                    <div>
                      <p className="text-sm font-semibold">{review.author.name}</p>
                      <p className="mt-0.5 text-xs text-ink-soft">
                        {formatReviewDate(review.createdAt)}
                      </p>
                    </div>
                    {review.verifiedPurchase && (
                      <span className="shrink-0 rounded-full border border-line px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-soft">
                        Verified
                      </span>
                    )}
                  </div>

                  <Link
                    href={`/product/${review.productSlug}`}
                    className="mt-4 inline-block text-xs font-semibold uppercase tracking-[0.14em] transition-colors duration-300 hover:text-gold-ink"
                  >
                    me. {review.productName} &rarr;
                  </Link>
                </div>
              </article>
            </Reveal>
          ))}
        </HorizontalScroller>
      </div>

      <div className="container-grid mt-10 flex justify-center sm:mt-14">
        <ButtonLink href="/shop">Shop Now</ButtonLink>
      </div>
    </section>
  );
}
