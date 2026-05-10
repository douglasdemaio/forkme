'use client';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { CartItem, MenuItemData, UserRole } from '@/lib/types';

interface AppState {
  role: UserRole;
  setRole: (r: UserRole) => void;

  // Cart
  cart: CartItem[];
  cartMerchantId: string | null;
  addToCart: (item: MenuItemData, merchantId: string) => void;
  removeFromCart: (id: string) => void;
  updateQty: (id: string, qty: number) => void;
  clearCart: () => void;
  cartTotal: () => number;
  cartCount: () => number;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      role: 'customer',
      setRole: (role) => set({ role }),

      cart: [],
      cartMerchantId: null,

      addToCart: (item, merchantId) => {
        const state = get();
        // Clear cart if switching merchants
        const cart = state.cartMerchantId && state.cartMerchantId !== merchantId ? [] : state.cart;
        const existing = cart.find((i) => i.id === item.id);
        set({
          cartMerchantId: merchantId,
          cart: existing
            ? cart.map((i) => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i)
            : [...cart, { ...item, quantity: 1 }],
        });
      },

      removeFromCart: (id) => {
        const cart = get().cart.filter((i) => i.id !== id);
        set({ cart, cartMerchantId: cart.length === 0 ? null : get().cartMerchantId });
      },

      updateQty: (id, qty) => {
        if (qty <= 0) { get().removeFromCart(id); return; }
        set({ cart: get().cart.map((i) => i.id === id ? { ...i, quantity: qty } : i) });
      },

      clearCart: () => set({ cart: [], cartMerchantId: null }),

      cartTotal: () => get().cart.reduce((s, i) => s + i.price * i.quantity, 0),
      cartCount: () => get().cart.reduce((s, i) => s + i.quantity, 0),
    }),
    { name: 'forkme-store', partialize: (s) => ({ role: s.role, cart: s.cart, cartMerchantId: s.cartMerchantId }) }
  )
);
