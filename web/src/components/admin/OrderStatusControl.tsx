"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { clsx } from "clsx";
import {
  ALL_ORDER_STATUSES,
  ORDER_STATUS_LABEL,
  OrderStatus,
  type OrderStatus as OrderStatusType,
} from "@/lib/order-status";

export function OrderStatusControl({
  orderId,
  currentStatus,
  orderNumber,
  endpoint,
}: {
  orderId: string;
  currentStatus: OrderStatusType;
  orderNumber: string;
  /** Defaults to the admin status API; delivery passes its own. */
  endpoint?: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function setStatus(status: OrderStatusType) {
    if (status === OrderStatus.CANCELLED) {
      const ok = window.confirm(
        `Mark ${orderNumber} as cancelled? The customer will see this on their tracking page.`,
      );
      if (!ok) return;
    }

    setBusy(true);
    setError(null);
    try {
      const res = await fetch(endpoint ?? `/api/admin/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, note: note.trim() || undefined }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        setError(typeof body?.error === "string" ? body.error : "Could not update this order.");
        return;
      }
      setNote("");
      router.refresh();
    } catch {
      setError("Could not reach the server. Try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.1em] text-ink-soft">
        Move to
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        {ALL_ORDER_STATUSES.map((status) => {
          const isCurrent = status === currentStatus;
          const destructive = status === OrderStatus.CANCELLED;
          return (
            <button
              key={status}
              type="button"
              disabled={busy || isCurrent}
              onClick={() => setStatus(status)}
              className={clsx(
                // min-h-11 on phones so each stage is a real touch target;
                // relaxed from md up where a pointer is doing the aiming
                "flex min-h-11 items-center border px-3.5 text-xs font-semibold uppercase tracking-[0.06em] transition-colors disabled:cursor-not-allowed md:min-h-0 md:py-1.5",
                isCurrent
                  ? "border-ink bg-ink text-paper opacity-100"
                  : destructive
                    ? "border-line text-red-700 hover:border-red-700 hover:bg-red-700 hover:text-paper disabled:opacity-50"
                    : "border-line hover:border-ink hover:bg-ink hover:text-paper disabled:opacity-50",
              )}
            >
              {ORDER_STATUS_LABEL[status]}
              {isCurrent && " ✓"}
            </button>
          );
        })}
      </div>

      <label className="mt-4 block">
        <span className="text-xs font-semibold uppercase tracking-[0.1em] text-ink-soft">
          Note for the customer <span className="font-normal normal-case">(optional)</span>
        </span>
        <input
          value={note}
          onChange={(e) => setNote(e.target.value)}
          maxLength={280}
          placeholder="e.g. Handed to BlueDart, AWB 1234567890"
          // 16px on phones: anything smaller makes iOS Safari zoom the page in
          // on focus, which leaves the admin panned sideways after typing
          className="mt-2 min-h-11 w-full max-w-md border border-line bg-paper px-3 py-2 text-base outline-none transition-colors focus:border-ink sm:text-sm"
        />
      </label>
      <p className="mt-1.5 text-xs text-ink-soft">
        Attached to whichever stage you pick next, and shown on their tracking page.
      </p>

      {error && (
        <p role="alert" className="mt-3 text-sm font-medium text-red-700">
          {error}
        </p>
      )}
    </div>
  );
}
