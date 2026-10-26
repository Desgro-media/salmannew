"use client";

import { createContext, useContext, useState, type ReactNode } from "react";

const ProductSelectionContext = createContext<{
  activeIndex: number;
  setActiveIndex: (index: number) => void;
  extraIndex: number | null;
  setExtraIndex: (index: number) => void;
} | null>(null);

export function ProductSelectionProvider({ children }: { children: ReactNode }) {
  const [activeIndex, setActive] = useState(0);
  // A photo past the last size (the lifestyle scene, the notes sheet) has no
  // size of its own, so showing one must not move activeIndex — that would
  // swap the price and SKU underneath a photo that has nothing to do with them.
  // Choosing a size clears it, which snaps the gallery back to that size's bottle.
  const [extraIndex, setExtraIndex] = useState<number | null>(null);

  function setActiveIndex(index: number) {
    setActive(index);
    setExtraIndex(null);
  }

  return (
    <ProductSelectionContext.Provider
      value={{ activeIndex, setActiveIndex, extraIndex, setExtraIndex }}
    >
      {children}
    </ProductSelectionContext.Provider>
  );
}

export function useProductSelection() {
  const ctx = useContext(ProductSelectionContext);
  if (!ctx) {
    throw new Error("useProductSelection must be used within a ProductSelectionProvider");
  }
  return ctx;
}
