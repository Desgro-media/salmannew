"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { clsx } from "clsx";
import { AnimatePresence, motion } from "framer-motion";
import { useCart, cartCount } from "@/lib/store/cart";
import { useWishlist } from "@/lib/store/wishlist";
import { useHasMounted } from "@/lib/use-has-mounted";

const NAV_LINKS = [
  { href: "/shop", label: "Shop" },
  { href: "/shop?filter=Best+Sellers", label: "Best Sellers" },
  { href: "/shop?filter=Signature+Collection", label: "Signature Collections" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];

export function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const items = useCart((s) => s.items);
  const toggleCart = useCart((s) => s.toggle);
  const wishlistSlugs = useWishlist((s) => s.slugs);
  const mounted = useHasMounted();
  const count = mounted ? cartCount(items) : 0;
  const wishlistCount = mounted ? wishlistSlugs.length : 0;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={clsx(
        "fixed inset-x-0 top-0 z-50 transition-colors duration-500",
        scrolled || mobileOpen
          ? "bg-paper/95 backdrop-blur border-b border-line"
          : "bg-transparent border-b border-transparent",
      )}
    >
      <div className="container-grid flex h-16 items-center justify-between md:h-20">
        <Link
          href="/"
          onClick={() => setMobileOpen(false)}
          className="flex items-center gap-2.5 shrink-0"
          aria-label="Salman Perfumes — home"
        >
          <span className="relative inline-block aspect-[1406/2628] h-7 shrink-0 md:h-8">
            <Image
              src="/logo/mark-gold-transparent.png"
              alt=""
              fill
              sizes="24px"
              className="object-contain"
              priority
            />
          </span>
          <span className="font-semibold tracking-[0.18em] text-sm md:text-base leading-none">
            SALMAN
            <span className="block text-[9px] md:text-[10px] tracking-[0.32em] text-ink-soft font-medium mt-0.5">
              PERFUMES
            </span>
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-10 eyebrow">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="relative py-1 hover:text-gold-ink transition-colors after:absolute after:left-0 after:-bottom-0.5 after:h-px after:w-0 after:bg-ink after:transition-all hover:after:w-full"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-4 md:gap-6">
          <Link
            href="/wishlist"
            onClick={() => setMobileOpen(false)}
            className="relative flex items-center gap-2 eyebrow"
            aria-label="Open wishlist"
          >
            <HeartIcon />
            <span className="hidden sm:inline">Saved</span>
            <AnimatePresence>
              {wishlistCount > 0 && (
                <motion.span
                  key={wishlistCount}
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0, opacity: 0 }}
                  className="absolute -top-2 -right-3 flex h-4 w-4 items-center justify-center rounded-full bg-ink text-[10px] font-semibold text-paper"
                >
                  {wishlistCount}
                </motion.span>
              )}
            </AnimatePresence>
          </Link>

          <button
            onClick={toggleCart}
            className="relative flex items-center gap-2 eyebrow"
            aria-label="Open cart"
          >
            <BagIcon />
            <span className="hidden sm:inline">Bag</span>
            <AnimatePresence>
              {count > 0 && (
                <motion.span
                  key={count}
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0, opacity: 0 }}
                  className="absolute -top-2 -right-3 flex h-4 w-4 items-center justify-center rounded-full bg-ink text-[10px] font-semibold text-paper"
                >
                  {count}
                </motion.span>
              )}
            </AnimatePresence>
          </button>

          <button
            className="md:hidden flex flex-col gap-1.5 p-1"
            onClick={() => setMobileOpen((v) => !v)}
            aria-label="Toggle menu"
          >
            <span
              className={clsx(
                "block h-px w-5 bg-ink transition-transform duration-300",
                mobileOpen && "translate-y-[3.5px] rotate-45",
              )}
            />
            <span
              className={clsx(
                "block h-px w-5 bg-ink transition-transform duration-300",
                mobileOpen && "-translate-y-[3.5px] -rotate-45",
              )}
            />
          </button>
        </div>
      </div>

      <AnimatePresence>
        {mobileOpen && (
          <motion.nav
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="md:hidden overflow-hidden border-t border-line bg-paper"
          >
            <ul className="container-grid flex flex-col py-4">
              {NAV_LINKS.map((link) => (
                <li key={link.href} className="border-b border-line/70 last:border-0">
                  <Link
                    href={link.href}
                    onClick={() => setMobileOpen(false)}
                    className="block py-4 text-lg font-medium"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  );
}

function HeartIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 20s-7-4.35-9.5-8.8C.6 7.9 2 4.5 5.3 4c2-.3 3.7.7 4.7 2.4C11 4.7 12.7 3.7 14.7 4c3.3.5 4.7 3.9 2.8 7.2C19 15.65 12 20 12 20Z"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function BagIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M6 8h12l-1 12.5a1 1 0 0 1-1 .9H8a1 1 0 0 1-1-.9L6 8Z"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
      <path
        d="M9 8V6a3 3 0 0 1 6 0v2"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
    </svg>
  );
}
