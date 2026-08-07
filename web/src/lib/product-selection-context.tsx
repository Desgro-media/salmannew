"use client";

import { createContext, useContext, useState, type ReactNode } from "react";

const ProductSelectionContext = createContext<{
  activeIndex: number;
  setActiveIndex: (index: number) => void;
} | null>(null);

export function ProductSelectionProvider({ children }: { children: ReactNode }) {
  const [activeIndex, setActiveIndex] = useState(0);
  return (
    <ProductSelectionContext.Provider value={{ activeIndex, setActiveIndex }}>
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
