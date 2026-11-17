import Link from "next/link";
import type { SetItem } from "@/lib/types";

// The gift-set counterpart of NotesPyramid: a set has no top/heart/base of its
// own, so the page lists what's in the box instead. An item linked to a product
// the shop also sells becomes a link to that product's page.
export function SetContents({ items, accent }: { items: SetItem[]; accent: string }) {
  if (items.length === 0) return null;

  return (
    <div
      className="rounded-[24px] p-5"
      style={{ background: `linear-gradient(180deg, ${accent}14, var(--color-paper-2))` }}
    >
      <p className="eyebrow text-ink-soft">What&apos;s inside</p>
      <ul className="mt-4 divide-y divide-ink/10">
        {items.map((item, i) => (
          <li key={`${item.name}-${i}`} className="flex items-baseline justify-between gap-4 py-3 first:pt-0 last:pb-0">
            {item.productSlug ? (
              <Link
                href={`/product/${item.productSlug}`}
                className="font-semibold underline-offset-4 hover:underline"
              >
                {item.name}
              </Link>
            ) : (
              <span className="font-semibold">{item.name}</span>
            )}
            <span className="shrink-0 rounded-full bg-paper px-3 py-1 text-xs text-ink-soft">
              {item.size}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
