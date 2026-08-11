import Link from "next/link";
import { LogoutButton } from "@/components/admin/LogoutButton";

const NAV_LINKS = [
  { href: "/admin", label: "Products" },
  { href: "/admin/orders", label: "Orders" },
  { href: "/admin/products/new", label: "New Product" },
  { href: "/admin/reviews", label: "Reviews" },
];

export default function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen pt-16 md:pt-20">
      <div className="border-b border-line bg-paper">
        {/* Four links and a logout do not fit one phone-width row — that forced
            the whole admin area to ~576px and left every page pannable
            sideways. The bar wraps instead: brand and logout hold the top row,
            the links drop to their own scrollable strip beneath. A strip rather
            than a hamburger, because four destinations do not justify hiding
            them behind a tap. */}
        <div className="container-grid flex flex-wrap items-center justify-between gap-x-4 gap-y-1 py-3 md:gap-y-0 md:py-5">
          <Link
            href="/admin"
            className="order-1 flex min-h-11 shrink-0 items-center text-sm font-black uppercase tracking-[0.14em] md:min-h-0"
          >
            Admin
          </Link>

          <div className="order-2 md:order-3">
            <LogoutButton />
          </div>

          <nav className="order-3 w-full md:order-2 md:w-auto md:flex-1">
            {/* Wraps rather than scrolls sideways: four short links fit two
                rows, and every destination stays visible. A scroll strip would
                clip the last one behind an edge nobody thinks to swipe. */}
            <ul className="flex flex-wrap items-center gap-x-1 gap-y-0 md:flex-nowrap md:gap-6">
              {NAV_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    // min-h-11 gives a 44px touch target on phones; reset from
                    // md up so the desktop bar keeps its original density.
                    className="flex min-h-11 items-center whitespace-nowrap rounded px-2.5 text-xs font-medium uppercase tracking-[0.1em] text-ink-soft transition-colors hover:bg-paper-2 hover:text-ink md:min-h-0 md:px-0 md:hover:bg-transparent"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </div>
      <div className="container-grid py-8 md:py-10">{children}</div>
    </div>
  );
}
