"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import Image from "next/image";
import Link from "next/link";
import Script from "next/script";
import { useRouter } from "next/navigation";
import { clsx } from "clsx";
import { useCart, cartSubtotal } from "@/lib/store/cart";
import { formatPrice } from "@/lib/format";
import { confirmPayment, placeCodOrder, startCheckout } from "@/lib/orders";
import {
  trackAddPaymentInfo,
  trackInitiateCheckout,
  trackPurchase,
} from "@/lib/meta-pixel";
import { useHasMounted } from "@/lib/use-has-mounted";
import { calculateShipping, type ShippingSettings } from "@/lib/shipping";
import { codAvailability, type CodSettings } from "@/lib/cod";
import type { CustomerDetails } from "@/lib/types";

const RAZORPAY_CHECKOUT_SRC = "https://checkout.razorpay.com/v1/checkout.js";

type PaymentChoice = "ONLINE" | "COD";

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
export function CheckoutForm({ settings }: { settings: ShippingSettings & CodSettings }) {
  const mounted = useHasMounted();
  const router = useRouter();
  const items = useCart((s) => s.items);
  const clear = useCart((s) => s.clear);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [gatewayReady, setGatewayReady] = useState(false);
  const [gatewayFailed, setGatewayFailed] = useState(false);
  const [choice, setChoice] = useState<PaymentChoice>("ONLINE");
  const [accountEmail, setAccountEmail] = useState<string | null>(null);
  const initiatedCheckout = useRef(false);
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
  // Items plus delivery: what the bag is worth before anyone picks how to pay.
  const orderValue = subtotal + shipping;

  // Whether COD is on the table for this bag. Recomputed as the bag changes, so
  // a customer who adds items past the cap loses the option rather than finding
  // out when the server refuses it.
  const cod = codAvailability(orderValue, settings);
  // A selection that has stopped being offered quietly reverts to online instead
  // of leaving a COD choice nobody can see.
  const method: PaymentChoice = choice === "COD" && cod.available ? "COD" : "ONLINE";
  const codFee = method === "COD" ? settings.codFee : 0;
  const total = orderValue + codFee;

  // Once per visit to this page, and only for a bag with something in it — the
  // empty-bag screen below is not a checkout. Waits on `mounted` because the
  // persisted bag cannot be read before then.
  useEffect(() => {
    if (!mounted || items.length === 0 || initiatedCheckout.current) return;
    initiatedCheckout.current = true;
    trackInitiateCheckout(items, orderValue);
  }, [mounted, items, orderValue]);

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

    // Cash on delivery skips all of that: one call places a finished order, so
    // there is no modal to keep `submitting` true behind. It stays true only
    // until the request settles, which is what stops a double-tap placing two.
    if (method === "COD") {
      trackAddPaymentInfo(items, total);
      try {
        const order = await placeCodOrder({ items, customer, subtotal });
        // The server's total, not the preview: it is the figure that includes
        // whatever COD fee was in force when the order was placed.
        trackPurchase(items, order.total, order.orderId);
        clear();
        router.push(
          `/checkout/success?order=${order.orderId}&eta=${encodeURIComponent(
            order.estimatedDelivery,
          )}&pay=cod&amount=${order.total}`,
        );
      } catch (err) {
        setError(err instanceof Error ? err.message : "Could not place your order.");
        setSubmitting(false);
      }
      return;
    }

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
          // Reported here, on the one path that means a verified payment,
          // rather than from the success page: that page is just a URL, and a
          // reload or a shared link would count the same order again. The
          // figure is the gateway's, in paise, not the preview above.
          trackPurchase(items, session.amount / 100, confirmation.orderId);
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

    // The modal is the payment step: the order is reserved and all that is left
    // is for them to pay. Razorpay reports nothing finer than success, failure
    // and dismissal, so this is as close to "payment info added" as the browser
    // can see. Retrying after a dismissal reserves a new order, and counts again.
    trackAddPaymentInfo(items, session.amount / 100);
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
        // Its own flag rather than `error`: an ad-blocker can stop this script,
        // and that must only warn someone who is trying to pay online — cash
        // on delivery does not need the gateway at all.
        onError={() => setGatewayFailed(true)}
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

        {/* Only shown when there is a real choice. With COD switched off, or the
            bag over its cap, "Pay online" would be a one-item radio group, so
            the old layout is kept — and a bag over the cap says why COD is
            missing rather than leaving them to wonder where it went. */}
        {cod.available ? (
          <fieldset className="mt-8">
            <legend className="eyebrow text-ink-soft">Payment</legend>
            <div className="mt-5 grid grid-cols-1 gap-3">
              <PaymentOption
                value="ONLINE"
                selected={method === "ONLINE"}
                onSelect={setChoice}
                title="Pay online"
                description="UPI, cards, netbanking & wallets, secured by Razorpay."
              />
              <PaymentOption
                value="COD"
                selected={method === "COD"}
                onSelect={setChoice}
                title="Cash on delivery"
                description={
                  settings.codFee > 0
                    ? `Pay in cash when your order arrives. A ${formatPrice(settings.codFee)} handling fee applies.`
                    : "Pay in cash when your order arrives."
                }
              />
            </div>
          </fieldset>
        ) : (
          cod.reason === "over-limit" && (
            <p className="mt-8 text-xs text-ink-soft">
              Cash on delivery is available on orders up to{" "}
              {formatPrice(settings.codMaxOrderValue)}.
            </p>
          )
        )}

        {error && <p className="mt-4 text-sm text-red-700">{error}</p>}
        {method === "ONLINE" && gatewayFailed && !error && (
          <p className="mt-4 text-sm text-red-700">
            The payment window could not load. Check your connection and try again.
          </p>
        )}

        <button
          type="submit"
          disabled={
            submitting ||
            !mounted ||
            (method === "ONLINE" && !gatewayReady) ||
            items.length === 0
          }
          className="mt-8 w-full bg-ink px-7 py-4 text-xs font-semibold uppercase tracking-[0.14em] text-paper transition-colors hover:bg-gold hover:text-ink disabled:opacity-40 sm:w-auto sm:px-14"
        >
          {method === "COD"
            ? submitting
              ? "Placing Order…"
              : `Place Order · ${formatPrice(total)}`
            : submitting
              ? "Opening Payment…"
              : `Pay ${formatPrice(total)}`}
        </button>
        <p className="mt-3 text-xs text-ink-soft">
          {method === "COD"
            ? `Pay ${formatPrice(total)} in cash to the delivery partner. They will call you before arriving.`
            : "Secure payment by Razorpay · UPI, cards, netbanking & wallets."}
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
          {codFee > 0 && (
            <div className="flex justify-between">
              <span className="text-ink-soft">Cash on delivery fee</span>
              <span>{formatPrice(codFee)}</span>
            </div>
          )}
          <div className="flex justify-between border-t border-line pt-2 text-base font-bold">
            <span>Total</span>
            <span>{formatPrice(total)}</span>
          </div>
        </div>
      </div>
    </form>
  );
}

function PaymentOption({
  value,
  selected,
  onSelect,
  title,
  description,
}: {
  value: PaymentChoice;
  selected: boolean;
  onSelect: (value: PaymentChoice) => void;
  title: string;
  description: string;
}) {
  return (
    <label
      className={clsx(
        "flex min-h-11 cursor-pointer items-start gap-3 border px-4 py-3.5 transition-colors",
        selected ? "border-ink" : "border-line hover:border-ink-soft",
      )}
    >
      <input
        type="radio"
        name="payment"
        value={value}
        checked={selected}
        onChange={() => onSelect(value)}
        className="mt-0.5 h-4 w-4 shrink-0 accent-[var(--color-ink)]"
      />
      <span>
        <span className="block text-sm font-semibold">{title}</span>
        <span className="mt-0.5 block text-xs text-ink-soft">{description}</span>
      </span>
    </label>
  );
}
