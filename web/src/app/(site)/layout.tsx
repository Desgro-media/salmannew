import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { CartDrawer } from "@/components/layout/CartDrawer";

// Products are admin-managed in the DB, so storefront pages under this
// layout (home, shop, about, ...) use ISR rather than pure static generation
// — admin edits show up within a minute instead of requiring a full rebuild.
export const revalidate = 60;

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
      <CartDrawer />
    </>
  );
}
