"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function DeleteProductButton({
  productId,
  productName,
}: {
  productId: string;
  productName: string;
}) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    const confirmed = window.confirm(
      `Delete "${productName}"? This can't be undone unless the product already has orders, in which case it will be archived instead of deleted.`,
    );
    if (!confirmed) return;

    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/products/${productId}`, { method: "DELETE" });
      const body = await res.json().catch(() => null);
      if (!res.ok) {
        window.alert(typeof body?.error === "string" ? body.error : "Could not delete product.");
        return;
      }
      if (body?.archived) {
        window.alert(
          `"${productName}" already has orders against it, so it was archived instead of deleted. It's hidden from the shop but its sales history is kept.`,
        );
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
      {deleting ? "Deleting…" : "Delete"}
    </button>
  );
}
