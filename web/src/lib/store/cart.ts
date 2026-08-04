"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { CartLine } from "@/lib/types";

interface CartState {
  items: CartLine[];
  isOpen: boolean;
  open: () => void;
  close: () => void;
  toggle: () => void;
  addItem: (line: Omit<CartLine, "quantity">, quantity?: number) => void;
  removeItem: (sizeId: string) => void;
  setQuantity: (sizeId: string, quantity: number) => void;
  clear: () => void;
}

export const useCart = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,
      open: () => set({ isOpen: true }),
      close: () => set({ isOpen: false }),
      toggle: () => set((s) => ({ isOpen: !s.isOpen })),
      addItem: (line, quantity = 1) => {
        const existing = get().items.find((i) => i.sizeId === line.sizeId);
        if (existing) {
          set({
            items: get().items.map((i) =>
              i.sizeId === line.sizeId
                ? { ...i, quantity: i.quantity + quantity }
                : i,
            ),
          });
        } else {
          set({ items: [...get().items, { ...line, quantity }] });
        }
        set({ isOpen: true });
      },
      removeItem: (sizeId) =>
        set({ items: get().items.filter((i) => i.sizeId !== sizeId) }),
      setQuantity: (sizeId, quantity) => {
        if (quantity <= 0) {
          get().removeItem(sizeId);
          return;
        }
        set({
          items: get().items.map((i) =>
            i.sizeId === sizeId ? { ...i, quantity } : i,
          ),
        });
      },
      clear: () => set({ items: [] }),
    }),
    { name: "salman-perfumes-cart" },
  ),
);

export function cartSubtotal(items: CartLine[]): number {
  return items.reduce((sum, i) => sum + i.price * i.quantity, 0);
}

export function cartCount(items: CartLine[]): number {
  return items.reduce((sum, i) => sum + i.quantity, 0);
}
