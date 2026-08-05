"use client";

import { useState, type FormEvent } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCart, cartSubtotal } from "@/lib/store/cart";
import { formatPrice } from "@/lib/format";
import { placeOrder } from "@/lib/orders";
import { useHasMounted } from "@/lib/use-has-mounted";
import { calculateShipping } from "@/lib/shipping";
import type { CustomerDetails } from "@/lib/types";

const FIELDS: { name: keyof CustomerDetails; label: string; type?: string; span?: 1 | 2 }[] = [
  { name: "fullName", label: "Full name", span: 2 },
  { name: "email", label: "Email", type: "email" },
  { name: "phone", label: "Phone", type: "tel" },
  { name: "address", label: "Address", span: 2 },
  { name: "city", label: "City" },
  { name: "state", label: "State" },
  { name: "pincode", label: "Pincode" },
];

export function CheckoutForm() {
  const mounted = useHasMounted();
  const router = useRouter();
  const items = useCart((s) => s.items);
  const clear = useCart((s) => s.clear);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [customer, setCustomer] = useState<CustomerDetails>({
    fullName: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    pincode: "",
  });

  const subtotal = mounted ? cartSubtotal(items) : 0;
  const shipping = calculateShipping(subtotal);
  const total = subtotal + shipping;

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const confirmation = await placeOrder({ items, customer, subtotal });
      clear();
      router.push(
        `/checkout/success?order=${confirmation.orderId}&eta=${encodeURIComponent(
          confirmation.estimatedDelivery,
        )}`,
      );
    } catch {
      setError("Something went wrong placing your order. Please try again.");
      setSubmitting(false);
    }
  }

  if (mounted && items.length === 0) {
    return (
      <div className="py-24 text-center">
        <p className="text-ink-soft">Your bag is empty.</p>
        <Link
          href="/shop"
          className="mt-6 inline-flex items-center justify-center border border-ink px-7 py-3.5 text-xs font-semibold uppercase tracking-[0.14em] transition-colors hover:bg-ink hover:text-paper"
        >
          Browse the Collection
        </Link>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="grid grid-cols-1 gap-12 md:grid-cols-12"
    >
      <div className="md:col-span-7">
        <p className="eyebrow text-ink-soft">Shipping Details</p>
        <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2">
          {FIELDS.map((field) => (
            <label
              key={field.name}
              className={field.span === 2 ? "sm:col-span-2" : undefined}
            >
              <span className="text-xs font-medium text-ink-soft">
                {field.label}
              </span>
              <input
                required
                type={field.type ?? "text"}
                value={customer[field.name]}
                onChange={(e) =>
                  setCustomer((c) => ({ ...c, [field.name]: e.target.value }))
                }
                className="mt-1.5 w-full border border-line bg-transparent px-3.5 py-2.5 text-sm outline-none transition-colors focus:border-ink"
              />
            </label>
          ))}
        </div>

        {error && <p className="mt-4 text-sm text-red-700">{error}</p>}

        <button
          type="submit"
          disabled={submitting || !mounted || items.length === 0}
          className="mt-8 w-full bg-ink px-7 py-4 text-xs font-semibold uppercase tracking-[0.14em] text-paper transition-colors hover:bg-gold hover:text-ink disabled:opacity-40 sm:w-auto sm:px-14"
        >
          {submitting ? "Placing Order…" : `Place Order · ${formatPrice(total)}`}
        </button>
        <p className="mt-3 text-xs text-ink-soft">
          Demo checkout — no payment is captured.
        </p>
      </div>

      <div className="md:col-span-4 md:col-start-9">
        <p className="eyebrow text-ink-soft">Order Summary</p>
        <ul className="mt-5 divide-y divide-line border-y border-line">
          {items.map((item) => (
            <li key={item.sizeId} className="flex gap-4 py-4">
              <div className="relative h-20 w-16 shrink-0 overflow-hidden bg-paper-2">
                <Image
                  src={item.image}
                  alt={item.name}
                  fill
                  sizes="64px"
                  className="object-cover"
                />
                <span className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-ink text-[10px] font-semibold text-paper">
                  {item.quantity}
                </span>
              </div>
              <div className="flex flex-1 flex-col justify-center">
                <p className="text-sm font-semibold">{item.name}</p>
                <p className="text-xs text-ink-soft">{item.sizeLabel}</p>
              </div>
              <p className="self-center text-sm font-semibold">
                {formatPrice(item.price * item.quantity)}
              </p>
            </li>
          ))}
        </ul>

        <div className="mt-5 space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-ink-soft">Subtotal</span>
            <span>{formatPrice(subtotal)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-ink-soft">Shipping</span>
            <span>{shipping === 0 ? "Free" : formatPrice(shipping)}</span>
          </div>
          <div className="flex justify-between border-t border-line pt-2 text-base font-bold">
            <span>Total</span>
            <span>{formatPrice(total)}</span>
          </div>
        </div>
      </div>
    </form>
  );
}
