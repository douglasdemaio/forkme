import { create } from 'zustand';
import { PublicKey } from '@solana/web3.js';
import type { UserRole, Order } from '@/lib/types';

interface AppState {
  // Wallet
  walletAddress: string | null;
  publicKey: PublicKey | null;
  isConnected: boolean;
  setWallet: (address: string, pubkey: PublicKey) => void;
  clearWallet: () => void;

  // Role
  role: UserRole;
  setRole: (role: UserRole) => void;

  // Auth
  authToken: string | null;
  setAuthToken: (token: string) => void;

  // Active order tracking
  activeOrder: Order | null;
  setActiveOrder: (order: Order | null) => void;

  // Cart
  cart: { menuItemId: string; name: string; quantity: number; price: number }[];
  addToCart: (item: { menuItemId: string; name: string; price: number }) => void;
  removeFromCart: (menuItemId: string) => void;
  clearCart: () => void;
  cartTotal: () => number;
}

export const useAppStore = create<AppState>((set, get) => ({
  walletAddress: null,
  publicKey: null,
  isConnected: false,
  setWallet: (address, pubkey) =>
    set({ walletAddress: address, publicKey: pubkey, isConnected: true }),
  clearWallet: () =>
    set({ walletAddress: null, publicKey: null, isConnected: false, authToken: null }),

  role: 'customer',
  setRole: (role) => set({ role }),

  authToken: null,
  setAuthToken: (token) => set({ authToken: token }),

  activeOrder: null,
  setActiveOrder: (order) => set({ activeOrder: order }),

  cart: [],
  addToCart: (item) => {
    const cart = get().cart;
    const existing = cart.find((i) => i.menuItemId === item.menuItemId);
    if (existing) {
      set({
        cart: cart.map((i) =>
          i.menuItemId === item.menuItemId ? { ...i, quantity: i.quantity + 1 } : i
        ),
      });
    } else {
      set({ cart: [...cart, { ...item, quantity: 1 }] });
    }
  },
  removeFromCart: (menuItemId) =>
    set({ cart: get().cart.filter((i) => i.menuItemId !== menuItemId) }),
  clearCart: () => set({ cart: [] }),
  cartTotal: () => get().cart.reduce((sum, i) => sum + i.price * i.quantity, 0),
}));
