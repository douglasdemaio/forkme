export type UserRole = 'customer' | 'driver' | 'restaurant';

export type OrderStatus =
  | 'Created'
  | 'Funded'
  | 'Preparing'
  | 'ReadyForPickup'
  | 'PickedUp'
  | 'Delivered'
  | 'Settled'
  | 'Disputed'
  | 'Cancelled'
  | 'Refunded';

export interface OrderItem {
  menuItemId: string;
  name: string;
  quantity: number;
  price: number;
}

export interface Contribution {
  wallet: string;
  amount: number;
  txSignature?: string;
  timestamp: string;
}

export interface Order {
  id: string;
  onChainOrderId: string;
  restaurant: { name: string; walletAddress: string };
  items: OrderItem[];
  tokenMint: string;
  foodTotal: number;
  deliveryFee: number;
  depositAmount: number;
  escrowTarget: number;
  escrowFunded: number;
  status: OrderStatus;
  codeA?: string; // only visible to order creator
  codeB?: string; // only visible to order creator
  shareLink?: string;
  contributions: Contribution[];
  driverLocation?: { lat: number; lng: number };
  createdAt: string;
}

export interface Restaurant {
  id: string;
  name: string;
  walletAddress: string;
  distance?: number;
  rating?: number;
  menuItems: MenuItem[];
}

export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  imageCid: string;
  category: string;
  available: boolean;
}

export interface FundingProgress {
  escrowTarget: number;
  escrowFunded: number;
  remaining: number;
  percentFunded: number;
  contributorCount: number;
  contributions: Contribution[];
}
