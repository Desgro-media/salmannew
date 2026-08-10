"use client";

import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { useCart, cartSubtotal } from "@/lib/store/cart";
import { formatPrice } from "@/lib/format";
import { useHasMounted } from "@/lib/use-has-mounted";

export function CartDrawer() {
  const mounted = useHasMounted();
  const isOpen = useCart((s) => s.isOpen);
  const close = useCart((s) => s.close);
  const items = useCart((s) => s.items);
  const setQuantity = useCart((s) => s.setQuantity);
  const removeItem = useCart((s) => s.removeItem);

  const subtotal = mounted ? cartSubtotal(items) : 0;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            // A backdrop-blur here blurs the entire viewport while the overlay
            // fades in, which stalls the drawer's slide animation. A slightly
            // darker scrim reads the same and animates on the compositor.
            className="fixed inset-0 z-[60] bg-ink/50"
            onClick={close}
          />
          <motion.aside
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="fixed right-0 top-0 z-[70] flex h-full w-full max-w-md flex-col bg-paper shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-line px-6 py-5">
              <h2 className="eyebrow">
                Your Bag {mounted && items.length > 0 && `(${items.length})`}
              </h2>
              <button
                onClick={close}
                aria-label="Close cart"
                className="text-xl leading-none"
              >
                &times;
              </button>
            </div>

            {!mounted || items.length === 0 ? (
              <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
                <p className="text-ink-soft">Your bag is empty.</p>
                <Link
                  href="/shop"
                  onClick={close}
                  className="mt-2 inline-flex items-center justify-center border border-ink px-7 py-3.5 text-xs font-semibold uppercase tracking-[0.14em] transition-colors hover:bg-ink hover:text-paper"
                >
                  Browse the Collection
                </Link>
              </div>
            ) : (
              <>
                <ul data-lenis-prevent className="flex-1 overflow-y-auto px-6 divide-y divide-line">
                  {items.map((item) => (
                    <li key={item.sizeId} className="flex gap-4 py-5">
                      <div className="relative h-24 w-20 shrink-0 overflow-hidden bg-paper-2">
                        <Image
                          src={item.image}
                          alt={item.name}
                          fill
                          sizes="80px"
                          className="object-cover"
                        />
                      </div>
                      <div className="flex flex-1 flex-col justify-between">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="text-sm font-semibold">{item.name}</p>
                            <p className="text-xs text-ink-soft">{item.sizeLabel}</p>
                          </div>
                          <p className="text-sm font-semibold whitespace-nowrap">
                            {formatPrice(item.price * item.quantity)}
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="flex items-center border border-line">
                            <button
                              className="px-2.5 py-1 text-sm"
                              onClick={() =>
                                setQuantity(item.sizeId, item.quantity - 1)
                              }
                              aria-label="Decrease quantity"
                            >
                              −
                            </button>
                            <span className="min-w-[1.5rem] text-center text-sm">
                              {item.quantity}
                            </span>
                            <button
                              className="px-2.5 py-1 text-sm"
                              onClick={() =>
                                setQuantity(item.sizeId, item.quantity + 1)
                              }
                              aria-label="Increase quantity"
                            >
                              +
                            </button>
                          </div>
                          <button
                            className="text-xs text-ink-soft underline underline-offset-2 hover:text-ink"
                            onClick={() => removeItem(item.sizeId)}
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>

                <div className="border-t border-line px-6 py-6 space-y-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-ink-soft">Subtotal</span>
                    <span className="font-semibold">{formatPrice(subtotal)}</span>
                  </div>
                  <p className="text-xs text-ink-soft">
                    Shipping and taxes calculated at checkout.
                  </p>
                  <Link
                    href="/checkout"
                    onClick={close}
                    className="flex w-full items-center justify-center bg-ink px-7 py-4 text-xs font-semibold uppercase tracking-[0.14em] text-paper transition-colors hover:bg-gold hover:text-ink"
                  >
                    Checkout
                  </Link>
                </div>
              </>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
