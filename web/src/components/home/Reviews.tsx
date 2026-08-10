import Link from "next/link";
import { clsx } from "clsx";
import { Reveal } from "@/components/motion/Reveal";
import { ButtonLink } from "@/components/ui/Button";
import { HorizontalScroller } from "@/components/ui/HorizontalScroller";
import { formatReviewDate, getReviewSummary, getReviews } from "@/lib/reviews";

const STAR_PATH =
  "M10 1.6l2.47 5.006 5.525.803-3.998 3.897.944 5.503L10 14.209l-4.941 2.6.944-5.503L2.005 7.409l5.525-.803z";

function StarRow({ className, large }: { className?: string; large?: boolean }) {
  return (
    // w-max keeps the row at its natural width so the clipped overlay below
    // lines up with the track instead of squeezing its stars together.
    <span className={clsx("flex w-max gap-0.5", className)}>
      {[0, 1, 2, 3, 4].map((i) => (
        <svg
          key={i}
          viewBox="0 0 20 20"
          aria-hidden
          className={clsx("shrink-0", large ? "h-5 w-5" : "h-3.5 w-3.5")}
        >
          <path d={STAR_PATH} />
        </svg>
      ))}
    </span>
  );
}

// Renders fractional ratings exactly (4.6 → 4.6 stars' worth of gold) by
// clipping a gold row over a muted one, rather than rounding to whole stars.
function Stars({
  rating,
  large,
  className,
}: {
  rating: number;
  large?: boolean;
  className?: string;
}) {
  const clamped = Math.min(5, Math.max(0, rating));

  return (
    <span
      role="img"
      aria-label={`${clamped} out of 5 stars`}
      className={clsx("relative inline-block leading-none", className)}
    >
      <StarRow className="fill-line" large={large} />
      <span
        aria-hidden
        className="absolute inset-y-0 left-0 overflow-hidden"
        style={{ width: `${(clamped / 5) * 100}%` }}
      >
        <StarRow className="fill-gold-deep" large={large} />
      </span>
    </span>
  );
}

export function Reviews() {
  const reviews = getReviews();
  const summary = getReviewSummary();

  if (reviews.length === 0) return null;

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
                <Stars rating={summary.average} large />
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

                <h3 className="mt-4 text-lg font-bold leading-snug">{review.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-ink-soft">{review.body}</p>

                <div className="mt-auto pt-6">
                  <div className="flex items-start justify-between gap-3 border-t border-line pt-4">
                    <div>
                      <p className="text-sm font-semibold">{review.name}</p>
                      <p className="mt-0.5 text-xs text-ink-soft">
                        {review.city} &middot; {formatReviewDate(review.date)}
                      </p>
                    </div>
                    {review.verified && (
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
