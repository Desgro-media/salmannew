"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";

export function LogoutLink() {
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/account/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  }

  return (
    <Button variant="secondary" onClick={handleLogout}>
      Log Out
    </Button>
  );
}
