import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface CartItem {
  productId: string;
  slug: string;
  name: string;
  price: number;
  image: string;
  size?: string;
  color?: string;
  qty: number;
}

interface CartState {
  items: CartItem[];
  add: (item: Omit<CartItem, "qty">, qty?: number) => void;
  remove: (productId: string, size?: string) => void;
  setQty: (productId: string, qty: number, size?: string) => void;
  clear: () => void;
  count: () => number;
  subtotal: () => number;
}

const keyOf = (id: string, size?: string) => `${id}::${size ?? ""}`;

export const useCart = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      add: (item, qty = 1) =>
        set((s) => {
          const existing = s.items.find((i) => keyOf(i.productId, i.size) === keyOf(item.productId, item.size));
          if (existing) {
            return {
              items: s.items.map((i) =>
                i === existing ? { ...i, qty: i.qty + qty } : i,
              ),
            };
          }
          return { items: [...s.items, { ...item, qty }] };
        }),
      remove: (productId, size) =>
        set((s) => ({ items: s.items.filter((i) => keyOf(i.productId, i.size) !== keyOf(productId, size)) })),
      setQty: (productId, qty, size) =>
        set((s) => ({
          items: s.items
            .map((i) => (keyOf(i.productId, i.size) === keyOf(productId, size) ? { ...i, qty } : i))
            .filter((i) => i.qty > 0),
        })),
      clear: () => set({ items: [] }),
      count: () => get().items.reduce((n, i) => n + i.qty, 0),
      subtotal: () => get().items.reduce((s, i) => s + i.price * i.qty, 0),
    }),
    { name: "hc-cart" },
  ),
);
