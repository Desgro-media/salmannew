import type { Metadata } from "next";
import Image from "next/image";
import { ButtonLink } from "@/components/ui/Button";

export const metadata: Metadata = {
  title: "Order Confirmed — Salman Perfumes",
};

export default async function CheckoutSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ order?: string; eta?: string }>;
}) {
  const { order, eta } = await searchParams;

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

      <p className="mt-3 max-w-sm text-sm text-ink-soft">
        A confirmation email is on its way. This is a demo checkout, so no
        payment was captured and no email was actually sent.
      </p>

      <div className="mt-10">
        <ButtonLink href="/shop">Continue Shopping</ButtonLink>
      </div>
    </div>
  );
}
