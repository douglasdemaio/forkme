import type { RestaurantTemplate } from './constants';

// ── Roles ───────────────────────────────────────────────────────────
export type UserRole = 'customer' | 'driver' | 'restaurant';
export type DeliveryService = 'human' | 'ai';

// ── Order statuses (mirror forkit-site schema) ──────────────────────
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

export interface StatusEvent {
  status: OrderStatus;
  timestamp: string;
  txSignature?: string;
  deliveryService?: DeliveryService;
  note?: string;
}

// ── Menu ────────────────────────────────────────────────────────────
export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  imageUrl: string; // URL returned by /api/upload or forkit-site CDN
  category: string;
  available: boolean;
}

// ── Restaurant ──────────────────────────────────────────────────────
export interface Restaurant {
  id: string;
  name: string;
  slug: string;
  description: string;
  walletAddress: string;
  template: RestaurantTemplate;
  logoUrl?: string;
  bannerUrl?: string;
  address?: string;
  lat?: number;
  lng?: number;
  distance?: number;
  rating?: number;
  totalOrders?: number;
  menuItems: MenuItem[];
  createdAt: string;
  updatedAt: string;
}

// ── Order items ─────────────────────────────────────────────────────
export interface OrderItem {
  menuItemId: string;
  name: string;
  quantity: number;
  price: number;
}

// ── Contributions ───────────────────────────────────────────────────
export interface Contribution {
  id: string;
  wallet: string;
  amount: number;
  txSignature?: string;
  timestamp: string;
}

// ── Order ───────────────────────────────────────────────────────────
export interface Order {
  id: string;
  onChainOrderId: string;
  restaurantId: string;
  restaurant: Pick<Restaurant, 'id' | 'name' | 'walletAddress'>;
  customer: { wallet: string };
  items: OrderItem[];
  tokenMint: string;
  foodTotal: number;
  deliveryFee: number;
  escrowTarget: number;
  escrowFunded: number;
  status: OrderStatus;
  codeA?: string;
  codeB?: string;
  shareLink?: string;
  contributions: Contribution[];
  driverWallet?: string;
  driverLocation?: { lat: number; lng: number };
  deliveryService?: DeliveryService;
  requestedDeliveryTime?: string; // ISO timestamp or null for ASAP
  requestedPickupTime?: string;   // ISO timestamp or null for ASAP
  createdAt: string;
  updatedAt: string;
  settledAt?: string;
  settleTxSignature?: string;
}

// ── Funding progress ────────────────────────────────────────────────
export interface FundingProgress {
  escrowTarget: number;
  escrowFunded: number;
  remaining: number;
  percentFunded: number;
  contributorCount: number;
  contributions: Contribution[];
}

// ── Payment receipt ─────────────────────────────────────────────────
export interface OrderReceipt {
  orderId: string;
  onChainOrderId: string;
  restaurantName: string;
  items: OrderItem[];
  tokenMint: string;
  tokenSymbol: string;
  currencySign: string;
  foodTotal: number;
  deliveryFee: number;
  protocolFee: number;
  totalCharged: number;
  reimbursement: number;
  netPaid: number;
  status: OrderStatus;
  createdAt: string;
  settledAt?: string;
  settleTxSignature?: string;
  deliveryService?: DeliveryService;
}

// ── Funds released event ────────────────────────────────────────────
export interface FundsReleasedPayload {
  orderId: string;
  txSignature: string;
  totalReleased: number;
  restaurantReceived: number;
  driverReceived: number;
  depositRefunded: number;
  tokenSymbol: string;
}

// ── Upload response ─────────────────────────────────────────────────
export interface UploadResult {
  url: string;
  key: string;
}

// ── Auth ────────────────────────────────────────────────────────────
export interface AuthNonce {
  nonce: string;
}

export interface AuthSession {
  token: string;
  user: {
    id: string;
    wallet: string;
    role: UserRole;
    restaurantId?: string;
  };
}
