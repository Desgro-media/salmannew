import Image from "next/image";
import Link from "next/link";
import { getAllProducts } from "@/lib/products";

export async function Footer() {
  const products = await getAllProducts();

  return (
    <footer className="border-t border-line bg-ink text-paper">
      <div className="container-grid grid grid-cols-2 gap-x-8 gap-y-12 py-16 md:grid-cols-12 md:py-24">
        <div className="col-span-2 md:col-span-4">
          <span className="relative inline-block aspect-[1406/2628] h-10">
            <Image
              src="/logo/mark-gold-transparent.png"
              alt="Salman Perfumes"
              fill
              sizes="30px"
              className="object-contain"
            />
          </span>
          <p className="mt-6 max-w-xs text-sm leading-relaxed text-paper/70">
            Six scents, no fillers. Eau de parfum, made to be worn — not just
            smelled from across the room.
          </p>
        </div>

        <div className="md:col-span-2 md:col-start-6">
          <p className="eyebrow text-paper/50">Shop</p>
          <ul className="mt-5 space-y-3 text-sm">
            {products.slice(0, 5).map((p) => (
              <li key={p.slug}>
                <Link
                  href={`/product/${p.slug}`}
                  className="text-paper/80 hover:text-gold transition-colors"
                >
                  {p.name}
                </Link>
              </li>
            ))}
            <li>
              <Link
                href="/shop"
                className="text-gold hover:text-paper transition-colors"
              >
                View all →
              </Link>
            </li>
          </ul>
        </div>

        <div className="md:col-span-2">
          <p className="eyebrow text-paper/50">Company</p>
          <ul className="mt-5 space-y-3 text-sm">
            <li>
              <Link href="/about" className="text-paper/80 hover:text-gold transition-colors">
                About
              </Link>
            </li>
            <li>
              <Link href="/shop" className="text-paper/80 hover:text-gold transition-colors">
                Shop
              </Link>
            </li>
            <li>
              <Link href="/checkout" className="text-paper/80 hover:text-gold transition-colors">
                Checkout
              </Link>
            </li>
          </ul>
        </div>

        <div className="col-span-2 md:col-span-3">
          <p className="eyebrow text-paper/50">Get in touch</p>
          <ul className="mt-5 space-y-3 text-sm text-paper/80">
            <li>hello@salmanperfumes.com</li>
            <li>+91 98765 43210</li>
            <li>Mumbai, India</li>
          </ul>
        </div>
      </div>

      <div className="border-t border-paper/10">
        <div className="container-grid flex flex-col gap-3 py-6 text-xs text-paper/50 md:flex-row md:items-center md:justify-between">
          <p>© {new Date().getFullYear()} Salman Perfumes. All rights reserved.</p>
          <p>Prices in INR · Cruelty-free · Made to linger</p>
        </div>
      </div>
    </footer>
  );
}
