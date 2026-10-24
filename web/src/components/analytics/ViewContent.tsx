"use client";

import { useEffect, useRef } from "react";
import { trackViewContent } from "@/lib/meta-pixel";

// The product page is a Server Component, so it cannot report a view itself.
// Takes plain values rather than the product, so a refresh that hands the page
// a fresh copy of the same product does not count as another view.
export function ViewContent({
  sku,
  name,
  price,
}: {
  sku: string;
  name: string;
  price: number;
}) {
  const reported = useRef<string | null>(null);

  useEffect(() => {
    // In dev, Strict Mode runs this effect twice for a single mount.
    if (reported.current === sku) return;
    reported.current = sku;
    trackViewContent({ sku, name, price });
  }, [sku, name, price]);

  return null;
}
