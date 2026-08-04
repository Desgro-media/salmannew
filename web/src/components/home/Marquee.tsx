const ITEMS = [
  "Free shipping over ₹2,999",
  "Eau de parfum concentration",
  "Cruelty-free",
  "Made to linger",
  "6 signature scents",
];

export function Marquee() {
  const line = ITEMS.join("   ✦   ");
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
