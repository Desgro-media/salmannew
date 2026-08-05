import Link from "next/link";
import { LogoutButton } from "@/components/admin/LogoutButton";

export default function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen pt-16 md:pt-20">
      <div className="border-b border-line bg-paper">
        <div className="container-grid flex items-center justify-between py-5">
          <div className="flex items-center gap-8">
            <Link href="/admin" className="text-sm font-black uppercase tracking-[0.14em]">
              Admin
            </Link>
            <nav className="flex items-center gap-6 text-xs font-medium uppercase tracking-[0.1em] text-ink-soft">
              <Link href="/admin" className="hover:text-ink">
                Products
              </Link>
              <Link href="/admin/products/new" className="hover:text-ink">
                New Product
              </Link>
            </nav>
          </div>
          <LogoutButton />
        </div>
      </div>
      <div className="container-grid py-10">{children}</div>
    </div>
  );
}
