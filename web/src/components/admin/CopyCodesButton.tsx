"use client";

import { useState } from "react";

/** Puts the codes on the clipboard as tab-separated text, ready to paste into a spreadsheet. */
export function CopyCodesButton({ text }: { text: string }) {
  const [state, setState] = useState<"idle" | "copied" | "failed">("idle");

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setState("copied");
    } catch {
      // Clipboard access can be refused (an insecure page, a blocked permission).
      setState("failed");
    }
    setTimeout(() => setState("idle"), 2500);
  }

  return (
    <button
      type="button"
      onClick={copy}
      className="flex min-h-11 items-center border border-line px-4 text-xs font-semibold uppercase tracking-[0.06em] transition-colors hover:border-ink hover:bg-ink hover:text-paper md:min-h-0 md:py-2"
    >
      {state === "copied" ? "Copied — paste into a sheet" : state === "failed" ? "Could not copy — use Download" : "Copy for a sheet"}
    </button>
  );
}
