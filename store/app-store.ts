import { create } from 'zustand';
import { PublicKey } from '@solana/web3.js';
import type { UserRole, Order, Restaurant } from '@/lib/types';

interface CartItem {
  menuItemId: string;
  name: string;
  quantity: number;
  price: number;
}

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

  // Restaurant management (for owners)
  myRestaurant: Restaurant | null;
  setMyRestaurant: (restaurant: Restaurant | null) => void;

  // Active order tracking
  activeOrder: Order | null;
  setActiveOrder: (order: Order | null) => void;

  // Current restaurant being viewed (customer)
  currentRestaurantId: string | null;
  setCurrentRestaurantId: (id: string | null) => void;

  // Cart
  cart: CartItem[];
  addToCart: (item: { menuItemId: string; name: string; price: number }) => void;
  removeFromCart: (menuItemId: string) => void;
  updateCartQuantity: (menuItemId: string, quantity: number) => void;
  clearCart: () => void;
  cartTotal: () => number;
  cartItemCount: () => number;
}

export const useAppStore = create<AppState>((set, get) => ({
  // Wallet
  walletAddress: null,
  publicKey: null,
  isConnected: false,
  setWallet: (address, pubkey) =>
    set({ walletAddress: address, publicKey: pubkey, isConnected: true }),
  clearWallet: () =>
    set({
      walletAddress: null,
      publicKey: null,
      isConnected: false,
      authToken: null,
      myRestaurant: null,
    }),

  // Role
  role: 'customer',
  setRole: (role) => set({ role }),

  // Auth
  authToken: null,
  setAuthToken: (token) => set({ authToken: token }),

  // Restaurant management
  myRestaurant: null,
  setMyRestaurant: (restaurant) => set({ myRestaurant: restaurant }),

  // Active order
  activeOrder: null,
  setActiveOrder: (order) => set({ activeOrder: order }),

  // Current restaurant
  currentRestaurantId: null,
  setCurrentRestaurantId: (id) => set({ currentRestaurantId: id }),

  // Cart
  cart: [],
  addToCart: (item) => {
    const cart = get().cart;
    const existing = cart.find((i) => i.menuItemId === item.menuItemId);
    if (existing) {
      set({
        cart: cart.map((i) =>
          i.menuItemId === item.menuItemId
            ? { ...i, quantity: i.quantity + 1 }
            : i
        ),
      });
    } else {
      set({ cart: [...cart, { ...item, quantity: 1 }] });
    }
  },
  removeFromCart: (menuItemId) =>
    set({ cart: get().cart.filter((i) => i.menuItemId !== menuItemId) }),
  updateCartQuantity: (menuItemId, quantity) => {
    if (quantity <= 0) {
      set({ cart: get().cart.filter((i) => i.menuItemId !== menuItemId) });
    } else {
      set({
        cart: get().cart.map((i) =>
          i.menuItemId === menuItemId ? { ...i, quantity } : i
        ),
      });
    }
  },
  clearCart: () => set({ cart: [] }),
  cartTotal: () =>
    get().cart.reduce((sum, i) => sum + i.price * i.quantity, 0),
  cartItemCount: () =>
    get().cart.reduce((sum, i) => sum + i.quantity, 0),
}));
