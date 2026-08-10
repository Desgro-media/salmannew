import { clsx } from "clsx";

const STAR_PATH =
  "M10 1.6l2.47 5.006 5.525.803-3.998 3.897.944 5.503L10 14.209l-4.941 2.6.944-5.503L2.005 7.409l5.525-.803z";

const SIZES = {
  sm: "h-3.5 w-3.5",
  md: "h-4 w-4",
  lg: "h-5 w-5",
} as const;

export type StarSize = keyof typeof SIZES;

function StarRow({ className, size }: { className?: string; size: StarSize }) {
  return (
    // w-max keeps the row at its natural width so the clipped overlay lines up
    // with the track instead of squeezing its stars together.
    <span className={clsx("flex w-max gap-0.5", className)}>
      {[0, 1, 2, 3, 4].map((i) => (
        <svg key={i} viewBox="0 0 20 20" aria-hidden className={clsx("shrink-0", SIZES[size])}>
          <path d={STAR_PATH} />
        </svg>
      ))}
    </span>
  );
}

/**
 * Renders fractional ratings exactly — 4.6 shows 4.6 stars' worth of gold —
 * by clipping a gold row over a muted one rather than rounding to whole stars.
 */
export function Stars({
  rating,
  size = "sm",
  className,
}: {
  rating: number;
  size?: StarSize;
  className?: string;
}) {
  const clamped = Math.min(5, Math.max(0, rating));

  return (
    <span
      role="img"
      aria-label={`${clamped} out of 5 stars`}
      className={clsx("relative inline-block leading-none", className)}
    >
      <StarRow className="fill-line" size={size} />
      <span
        aria-hidden
        className="absolute inset-y-0 left-0 overflow-hidden"
        style={{ width: `${(clamped / 5) * 100}%` }}
      >
        <StarRow className="fill-gold-deep" size={size} />
      </span>
    </span>
  );
}
