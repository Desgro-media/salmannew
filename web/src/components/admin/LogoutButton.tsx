"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";

export function LogoutButton() {
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/admin/login");
    router.refresh();
  }

  return (
    // Compact on phones so it fits its share of the header row: at full width
    // it outgrows the grid column and pushes the centred brand off-centre on
    // anything narrower than ~390px.
    // The ! modifiers are load-bearing: Button composes with clsx, which does
    // not resolve conflicting Tailwind utilities, and there is no
    // tailwind-merge in the project — so px-4 and px-7 would race on CSS order.
    // min-h-11 holds the 44px touch target that the reduced padding gives up.
    <Button
      variant="secondary"
      onClick={handleLogout}
      className="min-h-11 !px-4 !py-2 !text-[10px] sm:min-h-0 sm:!px-7 sm:!py-3.5 sm:!text-xs"
    >
      Log Out
    </Button>
  );
}
