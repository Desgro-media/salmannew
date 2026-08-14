import Link from "next/link";
import { LogoutButton } from "@/components/admin/LogoutButton";

export default function DeliveryDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen pt-16 md:pt-20">
      <div className="border-b border-line bg-paper">
        <div className="container-grid flex items-center justify-between gap-4 py-3 md:py-5">
          <Link
            href="/delivery"
            className="text-sm font-black uppercase tracking-[0.14em]"
          >
            Delivery
          </Link>
          <LogoutButton logoutUrl="/api/delivery/logout" redirectUrl="/delivery/login" />
        </div>
      </div>
      <div className="container-grid py-8 md:py-10">{children}</div>
    </div>
  );
}
