import type { Metadata } from "next";
import { CheckoutForm } from "@/components/checkout/CheckoutForm";

export const metadata: Metadata = {
  title: "Checkout — Salman Perfumes",
};

export default function CheckoutPage() {
  return (
    <div className="pt-16 md:pt-20">
      <div className="container-grid border-b border-line py-10 md:py-14">
        <p className="eyebrow text-ink-soft">Checkout</p>
        <h1 className="mt-3 text-4xl font-black tracking-tight md:text-5xl">
          Almost there.
        </h1>
      </div>

      <div className="container-grid py-12 md:py-16">
        <CheckoutForm />
      </div>
    </div>
  );
}
