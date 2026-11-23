"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { clsx } from "clsx";
import { ShipmentTracking } from "@/components/orders/ShipmentTracking";
import type { ShipmentView } from "@/lib/shipment";

type Action = "send" | "book" | "refresh" | "cancel";
type Tone = "normal" | "primary" | "danger";

const BUTTON =
  "flex min-h-11 items-center border px-3.5 text-xs font-semibold uppercase tracking-[0.06em] transition-colors disabled:cursor-not-allowed disabled:opacity-50 md:min-h-0 md:py-1.5";
const TONES: Record<Tone, string> = {
  normal: "border-line hover:border-ink hover:bg-ink hover:text-paper",
  primary: "border-ink bg-ink text-paper hover:opacity-90",
  danger: "border-line text-red-700 hover:border-red-700 hover:bg-red-700 hover:text-paper",
};

/**
 * The admin's view of one order's India Post shipment (booked through
 * PostBridge): where it stands, and the one or two things worth doing next.
 *
 * Each state offers only what makes sense in it, and the one irreversible step —
 * booking, which creates a real shipment — asks first.
 */
export function ShippingPanel({
  orderId,
  orderNumber,
  enabled,
  shippable,
  sync,
  pbStatus,
  error,
  syncedLabel,
  weightGrams,
  shipment,
}: {
  orderId: string;
  orderNumber: string;
  /** Whether the shop is switched on to use PostBridge at all. */
  enabled: boolean;
  /** Paid (or cash on delivery) and not cancelled. */
  shippable: boolean;
  sync: "NOT_SENT" | "SENT" | "FAILED";
  pbStatus: string | null;
  error: string | null;
  /** When the order was last checked with PostBridge, already formatted. */
  syncedLabel: string | null;
  /** The parcel weight declared to PostBridge, or null if none was sent. */
  weightGrams: number | null;
  shipment: ShipmentView | null;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState<Action | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function run(action: Action) {
    if (
      action === "book" &&
      !window.confirm(
        `Book ${orderNumber} with India Post?\n\nThis creates a real shipment and assigns its tracking number. It can't be undone from here.`,
      )
    ) {
      return;
    }
    if (action === "cancel" && !window.confirm(`Cancel ${orderNumber} at PostBridge? India Post will no longer collect it.`)) {
      return;
    }

    setBusy(action);
    setMessage(null);
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/shipping`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        setMessage(typeof body?.error === "string" ? body.error : "That didn't work. Try again.");
      }
      // Refreshed even after a failure: the server records the reason on the order.
      router.refresh();
    } catch {
      setMessage("Could not reach the server. Try again.");
    } finally {
      setBusy(null);
    }
  }

  const button = (action: Action, label: string, tone: Tone = "normal", disabled = false) => (
    <button
      key={action}
      type="button"
      disabled={busy !== null || disabled}
      onClick={() => run(action)}
      className={clsx(BUTTON, TONES[tone])}
    >
      {busy === action ? "Working…" : label}
    </button>
  );

  const status = (pbStatus ?? "").trim().toLowerCase();
  const booked = Boolean(shipment) || status === "manifested";
  const cancelled = status === "cancelled";
  const pending = status === "pending";
  const shownError = message ?? error;

  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.1em] text-ink-soft">India Post shipping</p>

      {!enabled ? (
        <p className="mt-3 text-sm text-ink-soft">
          Shipping with India Post (through PostBridge) isn&apos;t switched on yet.
        </p>
      ) : sync === "SENT" ? (
        <>
          <p className="mt-3 text-sm">
            PostBridge: <strong>{pbStatus ?? "Sent"}</strong>
            {syncedLabel && <span className="text-ink-soft"> · checked {syncedLabel}</span>}
          </p>

          {/* India Post bills by weight slab, so what was declared is worth seeing. */}
          <p className="mt-1 text-sm text-ink-soft">
            {weightGrams !== null ? (
              <>
                Parcel weight sent: <strong className="text-ink">{weightGrams} g</strong>
              </>
            ) : (
              "No parcel weight was sent — PostBridge uses the weights in its own catalogue."
            )}
          </p>

          {pending && (
            <p className="mt-2 max-w-xl text-sm text-ink-soft">
              PostBridge is holding this order as Pending: one of its product codes isn&apos;t in the PostBridge
              catalogue yet. Add it there, then press Refresh.
            </p>
          )}
          {cancelled && <p className="mt-2 text-sm text-ink-soft">This order was cancelled at PostBridge.</p>}
          {booked && !shipment && (
            <p className="mt-2 text-sm text-ink-soft">
              Booked, but the tracking number hasn&apos;t been read yet. Press Refresh.
            </p>
          )}

          <div className="mt-4 flex flex-wrap gap-2">
            {!booked && !cancelled && !pending && button("book", "Book shipment", "primary")}
            {booked && shipment && (
              <a
                href={`/api/admin/orders/${orderId}/label`}
                target="_blank"
                rel="noopener noreferrer"
                className={clsx(BUTTON, TONES.primary)}
              >
                Download label
              </a>
            )}
            {button("refresh", "Refresh")}
            {!booked && !cancelled && button("cancel", "Cancel at PostBridge", "danger")}
          </div>

          {shipment && <ShipmentTracking shipment={shipment} className="mt-6" />}
        </>
      ) : (
        <>
          <p className="mt-3 text-sm">
            {sync === "FAILED" ? (
              <span className="font-medium text-red-700">Sending to PostBridge failed.</span>
            ) : (
              "Not sent to PostBridge yet."
            )}
          </p>
          {!shippable && (
            <p className="mt-2 text-sm text-ink-soft">
              Only paid or cash-on-delivery orders that haven&apos;t been cancelled can be sent.
            </p>
          )}
          <div className="mt-4 flex flex-wrap gap-2">
            {button("send", sync === "FAILED" ? "Try again" : "Send to PostBridge", "primary", !shippable)}
          </div>
        </>
      )}

      {enabled && shownError && (
        <p role="alert" className="mt-3 max-w-xl text-sm font-medium text-red-700">
          {shownError}
        </p>
      )}
    </div>
  );
}
