"use client";

import { useEffect, useState, type FormEvent } from "react";
import Image from "next/image";
import Link from "next/link";
import Script from "next/script";
import { useRouter } from "next/navigation";
import { useCart, cartSubtotal } from "@/lib/store/cart";
import { formatPrice } from "@/lib/format";
import { confirmPayment, startCheckout } from "@/lib/orders";
import { useHasMounted } from "@/lib/use-has-mounted";
import { calculateShipping, type ShippingSettings } from "@/lib/shipping";
import type { CustomerDetails } from "@/lib/types";

const RAZORPAY_CHECKOUT_SRC = "https://checkout.razorpay.com/v1/checkout.js";

const FIELDS: { name: keyof CustomerDetails; label: string; type?: string; span?: 1 | 2 }[] = [
  { name: "fullName", label: "Full name", span: 2 },
  { name: "email", label: "Email", type: "email" },
  { name: "phone", label: "Phone", type: "tel" },
  { name: "address", label: "Address", span: 2 },
  { name: "city", label: "City" },
  { name: "state", label: "State" },
  { name: "pincode", label: "Pincode" },
];

// Settings arrive as props from the server page rather than being read here:
// this is a Client Component, and importing the Prisma-backed accessor would
// pull the database client into the browser bundle. The figure shown is only a
// preview either way — /api/orders recomputes the charge server-side.
export function CheckoutForm({ settings }: { settings: ShippingSettings }) {
  const mounted = useHasMounted();
  const router = useRouter();
  const items = useCart((s) => s.items);
  const clear = useCart((s) => s.clear);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [gatewayReady, setGatewayReady] = useState(false);
  const [accountEmail, setAccountEmail] = useState<string | null>(null);
  const [customer, setCustomer] = useState<CustomerDetails>({
    fullName: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    pincode: "",
  });

  useEffect(() => {
    fetch("/api/account/me")
      .then((res) => res.json())
      .then((profile: CustomerDetails | null) => {
        if (!profile) return;
        setAccountEmail(profile.email);
        setCustomer(profile);
      })
      .catch(() => {});
  }, []);

  const subtotal = mounted ? cartSubtotal(items) : 0;
  const shipping = calculateShipping(subtotal, settings);
  const total = subtotal + shipping;

  /**
   * Checkout runs in three acts: reserve the order, let Razorpay collect the
   * money, then have our server verify what the modal claims happened.
   *
   * `submitting` deliberately stays true while the modal is open — the form
   * behind it must not accept a second submission, which would reserve a second
   * order and charge twice. Every path out of the modal (success, failure,
   * dismissal) is responsible for clearing it, or the customer is stranded with
   * a dead button.
   */
  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    if (!window.Razorpay) {
      setError("The payment window could not load. Check your connection and try again.");
      setSubmitting(false);
      return;
    }

    let session;
    try {
      session = await startCheckout({ items, customer, subtotal });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not start checkout.");
      setSubmitting(false);
      return;
    }

    const razorpay = new window.Razorpay({
      key: session.keyId,
      amount: session.amount,
      currency: session.currency,
      name: "Salman Perfumes",
      description: `Order ${session.orderId}`,
      order_id: session.razorpayOrderId,
      prefill: session.prefill,
      theme: { color: "#111111" },
      handler: async (response) => {
        try {
          const confirmation = await confirmPayment(response);
          // Only now — the bag is not emptied on a payment we have not verified.
          clear();
          router.push(
            `/checkout/success?order=${confirmation.orderId}&eta=${encodeURIComponent(
              confirmation.estimatedDelivery,
            )}`,
          );
        } catch {
          // The money may well have been taken; the webhook will settle the
          // order either way. What must not happen is telling them it failed
          // and inviting a second payment.
          setError(
            `Your payment went through but we could not confirm it here. ` +
              `Your order number is ${session.orderId} — please contact us before paying again.`,
          );
          setSubmitting(false);
        }
      },
      modal: {
        // Closing the modal is a change of mind, not an error. The PENDING
        // order stays behind as a record; the cart is untouched so they can
        // pick up where they left off.
        ondismiss: () => setSubmitting(false),
      },
    });

    razorpay.on("payment.failed", (response) => {
      setError(
        response.error.description ??
          "Your payment did not go through. No money was taken — please try again.",
      );
      setSubmitting(false);
    });

    razorpay.open();
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
      {/* onReady rather than onLoad: it fires on re-mount too, so navigating
          away and back to checkout does not leave the button disabled against
          an already-loaded script. */}
      <Script
        src={RAZORPAY_CHECKOUT_SRC}
        onReady={() => setGatewayReady(true)}
        onError={() =>
          setError("The payment window could not load. Check your connection and try again.")
        }
      />

      <div className="md:col-span-7">
        <p className="text-xs text-ink-soft">
          {accountEmail ? (
            <>Checking out as {accountEmail}.</>
          ) : (
            <>
              Have an account?{" "}
              <Link
                href="/account/login?redirect=/checkout"
                className="text-ink underline underline-offset-2 hover:text-gold-ink"
              >
                Log in
              </Link>{" "}
              for faster checkout.
            </>
          )}
        </p>
        <p className="eyebrow mt-4 text-ink-soft">Shipping Details</p>
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
          disabled={submitting || !mounted || !gatewayReady || items.length === 0}
          className="mt-8 w-full bg-ink px-7 py-4 text-xs font-semibold uppercase tracking-[0.14em] text-paper transition-colors hover:bg-gold hover:text-ink disabled:opacity-40 sm:w-auto sm:px-14"
        >
          {submitting ? "Opening Payment…" : `Pay ${formatPrice(total)}`}
        </button>
        <p className="mt-3 text-xs text-ink-soft">
          Secure payment by Razorpay · UPI, cards, netbanking &amp; wallets.
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
