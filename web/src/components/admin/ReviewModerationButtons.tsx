"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function ReviewModerationButtons({
  reviewId,
  isHidden,
  authorName,
}: {
  reviewId: string;
  isHidden: boolean;
  authorName: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function send(action: () => Promise<Response>, failure: string) {
    setBusy(true);
    try {
      const res = await action();
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        window.alert(typeof body?.error === "string" ? body.error : failure);
        return;
      }
      router.refresh();
    } catch {
      window.alert(failure);
    } finally {
      setBusy(false);
    }
  }

  function toggleHidden() {
    return send(
      () =>
        fetch(`/api/admin/reviews/${reviewId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ isHidden: !isHidden }),
        }),
      "Could not update this review.",
    );
  }

  function remove() {
    const confirmed = window.confirm(
      `Permanently delete ${authorName}'s review? Hiding it instead keeps it recoverable.`,
    );
    if (!confirmed) return;
    return send(
      () => fetch(`/api/admin/reviews/${reviewId}`, { method: "DELETE" }),
      "Could not delete this review.",
    );
  }

  return (
    <div className="flex shrink-0 gap-2">
      <button
        type="button"
        onClick={toggleHidden}
        disabled={busy}
        className="border border-line px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.06em] transition-colors hover:border-ink hover:bg-ink hover:text-paper disabled:opacity-50"
      >
        {isHidden ? "Restore" : "Hide"}
      </button>
      <button
        type="button"
        onClick={remove}
        disabled={busy}
        className="border border-line px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.06em] text-red-700 transition-colors hover:border-red-700 hover:bg-red-700 hover:text-paper disabled:opacity-50"
      >
        Delete
      </button>
    </div>
  );
}
