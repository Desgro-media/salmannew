"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { clsx } from "clsx";

// Takes a product off sale without deleting anything — for when stock runs out.
// Off hides it from the shop and homepage, and its page shows "out of stock"
// instead of the add-to-bag button. On puts it straight back.
export function ProductActiveToggle({
  productId,
  productName,
  active,
  className,
}: {
  productId: string;
  productName: string;
  active: boolean;
  className?: string;
}) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  // Shown immediately so the switch doesn't lag the click; reverted on failure.
  const [on, setOn] = useState(active);

  async function toggle() {
    const next = !on;
    setOn(next);
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/products/${productId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: next }),
      });
      if (!res.ok) throw new Error();
      router.refresh();
    } catch {
      setOn(!next);
      window.alert(`Couldn't ${next ? "enable" : "disable"} "${productName}". Please try again.`);
    } finally {
      setSaving(false);
    }
  }

  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={`${productName} is ${on ? "on sale" : "disabled"}`}
      onClick={toggle}
      disabled={saving}
      title={on ? "On sale — click to disable (e.g. out of stock)" : "Disabled — click to put back on sale"}
      className={clsx(
        "inline-flex min-h-11 items-center gap-2 text-xs font-semibold uppercase tracking-[0.06em] disabled:opacity-60 md:min-h-0",
        className,
      )}
    >
      <span
        aria-hidden
        className={clsx(
          "relative inline-block h-5 w-9 shrink-0 rounded-full transition-colors",
          on ? "bg-green-700" : "bg-line",
        )}
      >
        <span
          className={clsx(
            "absolute top-0.5 h-4 w-4 rounded-full bg-paper shadow transition-all",
            on ? "left-[18px]" : "left-0.5",
          )}
        />
      </span>
      <span className={on ? "text-green-800" : "text-ink-soft"}>{on ? "Enabled" : "Disabled"}</span>
    </button>
  );
}
