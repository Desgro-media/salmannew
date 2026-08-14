"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function DeleteDeliveryBoyButton({
  deliveryBoyId,
  deliveryBoyName,
}: {
  deliveryBoyId: string;
  deliveryBoyName: string;
}) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    const confirmed = window.confirm(
      `Remove ${deliveryBoyName}'s delivery account? They will no longer be able to sign in.`,
    );
    if (!confirmed) return;

    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/delivery-boys/${deliveryBoyId}`, { method: "DELETE" });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        window.alert(typeof body?.error === "string" ? body.error : "Could not remove this account.");
        return;
      }
      router.refresh();
    } catch {
      window.alert("Something went wrong. Please try again.");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleDelete}
      disabled={deleting}
      className="flex min-h-11 items-center justify-center border border-line px-3.5 text-xs font-semibold uppercase tracking-[0.06em] text-red-700 transition-colors hover:border-red-700 hover:bg-red-700 hover:text-paper disabled:opacity-50 md:min-h-0 md:py-1.5"
    >
      {deleting ? "Removing…" : "Remove"}
    </button>
  );
}
