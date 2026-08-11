import { clsx } from "clsx";
import {
  ORDER_STATUS_BLURB,
  ORDER_STATUS_LABEL,
  ORDER_TIMELINE,
  OrderStatus,
  isCancelled,
  timelineIndex,
} from "@/lib/order-status";

export interface TimelineEvent {
  status: OrderStatus;
  note: string | null;
  createdAt: Date;
}

const stampFormatter = new Intl.DateTimeFormat("en-IN", {
  day: "numeric",
  month: "short",
  hour: "numeric",
  minute: "2-digit",
  hour12: true,
});

/**
 * Renders the fulfilment checkpoints for one order.
 *
 * `events` is the append-only log, so a checkpoint's date comes from when it
 * was actually reached rather than being inferred. Where a stage was skipped —
 * a local hand-delivery that never "ships", say — it still renders as reached
 * once a later stage has been, because the parcel demonstrably got past it; it
 * just carries no timestamp of its own.
 */
export function OrderTimeline({
  status,
  events,
  className,
}: {
  status: OrderStatus;
  events: TimelineEvent[];
  className?: string;
}) {
  if (isCancelled(status)) {
    const cancelledAt = [...events]
      .reverse()
      .find((event) => event.status === OrderStatus.CANCELLED);
    return (
      <div className={clsx("border border-line bg-paper-2 px-5 py-4", className)}>
        <p className="text-sm font-bold">{ORDER_STATUS_LABEL.CANCELLED}</p>
        <p className="mt-1 text-sm text-ink-soft">{ORDER_STATUS_BLURB.CANCELLED}</p>
        {cancelledAt?.note && (
          <p className="mt-2 text-sm text-ink-soft">{cancelledAt.note}</p>
        )}
        {cancelledAt && (
          <p className="mt-2 text-xs text-ink-soft">
            {stampFormatter.format(cancelledAt.createdAt)}
          </p>
        )}
      </div>
    );
  }

  const reachedIndex = timelineIndex(status);
  // First occurrence of each stage — if an order bounced back and forth, the
  // date a stage was first reached is the meaningful one.
  const firstEventFor = new Map<OrderStatus, TimelineEvent>();
  for (const event of events) {
    if (!firstEventFor.has(event.status)) firstEventFor.set(event.status, event);
  }

  return (
    <ol className={clsx("relative", className)}>
      {ORDER_TIMELINE.map((step, i) => {
        const reached = i <= reachedIndex;
        const current = i === reachedIndex;
        const event = firstEventFor.get(step);
        const last = i === ORDER_TIMELINE.length - 1;

        return (
          <li key={step} className="relative flex gap-4 pb-6 last:pb-0">
            {/* connector, drawn behind the dot and stopped before the last row */}
            {!last && (
              <span
                aria-hidden
                className={clsx(
                  "absolute left-[7px] top-4 h-full w-px",
                  i < reachedIndex ? "bg-ink" : "bg-line",
                )}
              />
            )}

            <span
              aria-hidden
              className={clsx(
                "relative mt-1 h-[15px] w-[15px] shrink-0 rounded-full border-2 transition-colors",
                reached ? "border-ink bg-ink" : "border-line bg-paper",
                current && "ring-4 ring-gold/40",
              )}
            />

            <div className="min-w-0 flex-1">
              <p
                className={clsx(
                  "text-sm font-bold",
                  reached ? "text-ink" : "text-ink-soft/60",
                )}
              >
                {ORDER_STATUS_LABEL[step]}
              </p>
              {reached && (
                <>
                  <p className="mt-0.5 text-sm text-ink-soft">
                    {ORDER_STATUS_BLURB[step]}
                  </p>
                  {event?.note && (
                    <p className="mt-1 text-sm text-ink">{event.note}</p>
                  )}
                  {event && (
                    <p className="mt-1 text-xs text-ink-soft">
                      {stampFormatter.format(event.createdAt)}
                    </p>
                  )}
                </>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
