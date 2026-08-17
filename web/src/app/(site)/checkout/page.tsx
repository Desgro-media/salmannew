import type { Metadata } from "next";
import { CheckoutForm } from "@/components/checkout/CheckoutForm";
import { getStoreSettings } from "@/lib/store-settings";

export const metadata: Metadata = {
  title: "Checkout — Salman Perfumes",
};

// The delivery charge is admin-configurable, so this page has to be rendered
// per request rather than prerendered against whatever the rate was at build.
export const dynamic = "force-dynamic";

export default async function CheckoutPage() {
  const settings = await getStoreSettings();

  return (
    <div className="pt-16 md:pt-20">
      <div className="container-grid border-b border-line py-10 md:py-14">
        <p className="eyebrow text-ink-soft">Checkout</p>
        <h1 className="mt-3 text-4xl font-black tracking-tight md:text-5xl">
          Almost there.
        </h1>
      </div>

      <div className="container-grid py-12 md:py-16">
        <CheckoutForm settings={settings} />
      </div>
    </div>
  );
}
