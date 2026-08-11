"use client";

import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import { formatPrice } from "@/lib/format";
import { ORDER_STATUS_LABEL, type OrderStatus } from "@/lib/order-status";
import { OrderTimeline, type TimelineEvent } from "./OrderTimeline";

interface TrackedOrder {
  orderNumber: string;
  status: OrderStatus;
  total: number;
  createdAt: string;
  estimatedDelivery: string;
  customerFullName: string;
  customerCity: string;
  customerState: string;
  items: { id: string; name: string; sizeLabel: string; quantity: number }[];
  statusEvents: { status: OrderStatus; note: string | null; createdAt: string }[];
}

const dateFormatter = new Intl.DateTimeFormat("en-IN", {
  day: "numeric",
  month: "long",
  year: "numeric",
});

export function TrackOrderForm({
  initialOrderNumber = "",
  /** Set when a customer session exists; their identity is already proven. */
  signedInAs = null,
}: {
  initialOrderNumber?: string;
  signedInAs?: string | null;
}) {
  const [orderNumber, setOrderNumber] = useState(initialOrderNumber);
  const [email, setEmail] = useState("");
  // Signed-in customers never type an email. The field is revealed only if they
  // ask for it, to look up an order placed under a different address — a gift
  // bought by a partner, say.
  const [useOtherEmail, setUseOtherEmail] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [order, setOrder] = useState<TrackedOrder | null>(null);

  const needsEmail = !signedInAs || useOtherEmail;

  const lookup = useCallback(async (number: string, typedEmail: string | null) => {
    setBusy(true);
    setError(null);
    setOrder(null);

    try {
      const res = await fetch("/api/orders/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // Omitted entirely when signed in, so the server falls back to the
        // session rather than trying to match a blank string.
        body: JSON.stringify(
          typedEmail ? { orderNumber: number, email: typedEmail } : { orderNumber: number },
        ),
      });
      const body = await res.json().catch(() => null);

      if (!res.ok) {
        setError(
          typeof body?.error === "string"
            ? body.error
            : "We couldn't look that order up. Please try again.",
        );
        return;
      }
      setOrder(body.order as TrackedOrder);
    } catch {
      setError("We couldn't reach the server. Check your connection and try again.");
    } finally {
      setBusy(false);
    }
  }, []);

  // Arriving from the confirmation screen already signed in: there is nothing
  // left to ask for, so resolve straight to the timeline.
  const autoRan = useRef(false);
  useEffect(() => {
    if (autoRan.current || !signedInAs || !initialOrderNumber) return;
    autoRan.current = true;
    void lookup(initialOrderNumber, null);
  }, [signedInAs, initialOrderNumber, lookup]);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    void lookup(orderNumber, needsEmail ? email : null);
  }

  // The API sends ISO strings; the timeline works in Date objects.
  const events: TimelineEvent[] = (order?.statusEvents ?? []).map((event) => ({
    status: event.status,
    note: event.note,
    createdAt: new Date(event.createdAt),
  }));

  return (
    <div>
      <form onSubmit={handleSubmit} className="mt-8 max-w-xl">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="text-xs font-semibold uppercase tracking-[0.1em] text-ink-soft">
              Order number
            </span>
            <input
              value={orderNumber}
              onChange={(e) => setOrderNumber(e.target.value)}
              required
              autoComplete="off"
              spellCheck={false}
              placeholder="SP-XXXXXXXX"
              className="mt-2 w-full border border-line bg-paper px-4 py-3 text-sm outline-none transition-colors focus:border-ink"
            />
          </label>

          {needsEmail && (
            <label className="block">
              <span className="text-xs font-semibold uppercase tracking-[0.1em] text-ink-soft">
                Email used at checkout
              </span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                placeholder="you@example.com"
                className="mt-2 w-full border border-line bg-paper px-4 py-3 text-sm outline-none transition-colors focus:border-ink"
              />
            </label>
          )}
        </div>

        {signedInAs && !useOtherEmail && (
          <p className="mt-3 text-xs text-ink-soft">
            Signed in as <span className="font-semibold text-ink">{signedInAs}</span>.{" "}
            <button
              type="button"
              onClick={() => setUseOtherEmail(true)}
              className="underline underline-offset-2 hover:text-ink"
            >
              Someone else ordered it for me
            </button>
          </p>
        )}

        <button
          type="submit"
          disabled={busy}
          className="mt-5 bg-ink px-7 py-3 text-xs font-semibold uppercase tracking-[0.14em] text-paper transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {busy ? "Looking…" : "Track order"}
        </button>

        {error && (
          <p role="alert" className="mt-4 text-sm font-medium text-red-700">
            {error}
          </p>
        )}
      </form>

      {order && (
        <div className="mt-12 border-t border-line pt-10">
          <div className="flex flex-wrap items-baseline justify-between gap-3">
            <div>
              <p className="eyebrow text-ink-soft">{ORDER_STATUS_LABEL[order.status]}</p>
              <h2 className="mt-2 font-mono text-2xl font-black tracking-tight">
                {order.orderNumber}
              </h2>
            </div>
            <p className="text-sm text-ink-soft">
              Placed {dateFormatter.format(new Date(order.createdAt))}
            </p>
          </div>

          <div className="mt-8 grid grid-cols-1 gap-10 lg:grid-cols-12">
            <div className="lg:col-span-7">
              <OrderTimeline status={order.status} events={events} />
            </div>

            <div className="lg:col-span-5">
              <p className="eyebrow text-ink-soft">Order</p>
              <ul className="mt-4 space-y-1.5 text-sm">
                {order.items.map((item) => (
                  <li key={item.id}>
                    {item.quantity} × {item.name}{" "}
                    <span className="text-ink-soft">({item.sizeLabel})</span>
                  </li>
                ))}
              </ul>
              <p className="mt-4 text-lg font-bold">{formatPrice(order.total)}</p>

              <p className="eyebrow mt-8 text-ink-soft">Delivering to</p>
              <p className="mt-3 text-sm">
                {order.customerFullName}
                <br />
                <span className="text-ink-soft">
                  {order.customerCity}, {order.customerState}
                </span>
              </p>

              <p className="eyebrow mt-8 text-ink-soft">Estimated delivery</p>
              <p className="mt-3 text-sm">
                {dateFormatter.format(new Date(order.estimatedDelivery))}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
