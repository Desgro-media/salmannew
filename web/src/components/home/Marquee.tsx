import { formatPrice } from "@/lib/format";
import { getStoreSettings } from "@/lib/store-settings";

const ITEMS = [
  "Eau de parfum concentration",
  "Cruelty-free",
  "Made to linger",
  "6 signature scents",
];

export async function Marquee() {
  // Quoted from the same row checkout charges from, so this cannot advertise a
  // threshold the till does not honour. A zero fee makes the "over ₹X" framing
  // false — everything ships free at that point — so the claim changes shape.
  const { shippingFee, freeShippingThreshold } = await getStoreSettings();
  const shippingClaim =
    shippingFee === 0
      ? "Free shipping on every order"
      : `Free shipping over ${formatPrice(freeShippingThreshold)}`;

  const line = [shippingClaim, ...ITEMS].join("   ✦   ");
  return (
    <div className="overflow-hidden border-y border-line bg-ink py-3.5 text-paper">
      <div className="flex w-max animate-marquee whitespace-nowrap">
        <span className="px-4 text-xs font-semibold uppercase tracking-[0.2em]">
          {line}
          {"   ✦   "}
        </span>
        <span className="px-4 text-xs font-semibold uppercase tracking-[0.2em]">
          {line}
          {"   ✦   "}
        </span>
      </div>
    </div>
  );
}
