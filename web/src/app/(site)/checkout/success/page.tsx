import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ButtonLink } from "@/components/ui/Button";
import { formatPrice } from "@/lib/format";

export const metadata: Metadata = {
  title: "Order Confirmed — Salman Perfumes",
};

export default async function CheckoutSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ order?: string; eta?: string; pay?: string; amount?: string }>;
}) {
  const { order, eta, pay, amount } = await searchParams;
  // Display-only, like the rest of this page: it is a URL, so anyone can type
  // `?pay=cod`, and all that earns them is a different paragraph. Nothing on the
  // order itself is read from here.
  const isCod = pay === "cod";
  const amountDue = Number(amount);

  return (
    <div className="flex min-h-[80svh] flex-col items-center justify-center px-6 pt-16 text-center md:pt-20">
      <span className="relative inline-block aspect-[1406/2628] h-12">
        <Image
          src="/logo/mark-gold-transparent.png"
          alt=""
          fill
          sizes="35px"
          className="object-contain"
        />
      </span>
      <p className="eyebrow mt-8 text-ink-soft">Order Confirmed</p>
      <h1 className="mt-3 max-w-lg text-4xl font-black tracking-tight md:text-5xl">
        Thank you — it&rsquo;s on its way.
      </h1>

      {order && (
        <p className="mt-6 text-sm text-ink-soft">
          Order <span className="font-semibold text-ink">{order}</span>
          {eta && (
            <>
              {" "}
              · Estimated delivery <span className="text-ink">{eta}</span>
            </>
          )}
        </p>
      )}

      {isCod ? (
        <p className="mt-3 max-w-sm text-sm text-ink-soft">
          You chose cash on delivery
          {Number.isFinite(amountDue) && amountDue > 0 && (
            <>
              {" "}
              — please keep <span className="font-semibold text-ink">{formatPrice(amountDue)}</span>{" "}
              ready
            </>
          )}
          . Our delivery partner will call you before they arrive.
        </p>
      ) : (
        <p className="mt-3 max-w-sm text-sm text-ink-soft">
          A confirmation email is on its way. This is a demo checkout, so no
          payment was captured and no email was actually sent.
        </p>
      )}

      <div className="mt-10 flex flex-wrap items-center justify-center gap-5">
        <ButtonLink href={order ? `/track?order=${encodeURIComponent(order)}` : "/track"}>
          Track Your Order
        </ButtonLink>
        <Link
          href="/shop"
          className="text-xs font-semibold uppercase tracking-[0.14em] underline underline-offset-4 hover:text-gold-ink"
        >
          Continue Shopping
        </Link>
      </div>
    </div>
  );
}
