import { API_BASE_URL } from './constants';
import type {
  AuthNonce,
  AuthSession,
  Contribution,
  FundingProgress,
  MenuItem,
  Order,
  Restaurant,
  UploadResult,
} from './types';
import type { RestaurantTemplate } from './constants';

// ─────────────────────────────────────────────────────────────────────
// Field mappers: forkit-site DB field names → forkme type field names
// ─────────────────────────────────────────────────────────────────────

function mapRestaurant(r: any): Restaurant {
  return {
    ...r,
    walletAddress: r.walletAddress ?? r.wallet,
    logoUrl: r.logoUrl ?? r.logo,
    bannerUrl: r.bannerUrl ?? r.banner,
    menuItems: (r.menuItems ?? []).map((m: any) => ({
      ...m,
      imageUrl: m.imageUrl ?? m.image ?? '',
    })),
  };
}

// ─────────────────────────────────────────────────────────────────────
// API client that talks to forkit-site (Next.js App Router API routes)
// ─────────────────────────────────────────────────────────────────────

class ApiClient {
  private token: string | null = null;

  setToken(token: string) {
    this.token = token;
  }

  clearToken() {
    this.token = null;
  }

  // ── generic fetch wrapper ───────────────────────────────────────
  private async request<T>(
    path: string,
    options?: RequestInit & { skipJson?: boolean }
  ): Promise<T> {
    const headers: Record<string, string> = {
      ...(this.token ? { Authorization: `Bearer ${this.token}` } : {}),
    };
    // Only set Content-Type for JSON bodies (not FormData/uploads)
    if (!(options?.body instanceof FormData)) {
      headers['Content-Type'] = 'application/json';
    }

    const res = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers: { ...headers, ...(options?.headers as Record<string, string>) },
    });

    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(`API ${res.status}: ${text || res.statusText}`);
    }

    if (options?.skipJson) return undefined as unknown as T;
    return res.json();
  }

  // ═══════════════════════════════════════════════════════════════
  //  AUTH  —  /api/auth/*
  // ═══════════════════════════════════════════════════════════════

  /** Request a sign-in nonce for the given wallet */
  async getNonce(walletAddress: string): Promise<AuthNonce> {
    return this.request('/api/auth/nonce', {
      method: 'POST',
      body: JSON.stringify({ wallet: walletAddress }),
    });
  }

  /** Verify a signed nonce and receive a JWT + user object */
  async verify(
    walletAddress: string,
    signature: string,
    nonce: string
  ): Promise<AuthSession> {
    return this.request('/api/auth/verify', {
      method: 'POST',
      body: JSON.stringify({ wallet: walletAddress, signature, nonce }),
    });
  }

  // ═══════════════════════════════════════════════════════════════
  //  RESTAURANTS  —  /api/restaurants/*
  // ═══════════════════════════════════════════════════════════════

  /** List / search restaurants (public) */
  async getRestaurants(params?: {
    lat?: number;
    lng?: number;
    q?: string;
    limit?: number;
  }): Promise<Restaurant[]> {
    const qs = new URLSearchParams();
    if (params?.lat != null) qs.set('lat', String(params.lat));
    if (params?.lng != null) qs.set('lng', String(params.lng));
    if (params?.q) qs.set('search', params.q);
    if (params?.limit) qs.set('limit', String(params.limit));
    const query = qs.toString();
    const result = await this.request<Restaurant[] | { restaurants: any[]; pagination?: any }>(
      `/api/restaurants${query ? `?${query}` : ''}`
    );
    const list: any[] = Array.isArray(result) ? result : (result as any).restaurants ?? [];
    return list.map(mapRestaurant);
  }

  /** Get a single restaurant by ID (public) */
  async getRestaurant(id: string): Promise<Restaurant> {
    const data = await this.request<any>(`/api/restaurants/${id}`);
    return mapRestaurant(data);
  }

  /** Create a new restaurant (owner) */
  async createRestaurant(data: {
    name: string;
    description: string;
    template: RestaurantTemplate;
    walletAddress: string;
    address?: string;
    lat?: number;
    lng?: number;
  }): Promise<Restaurant> {
    return this.request('/api/restaurants', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  /** Update restaurant profile (owner) */
  async updateRestaurant(
    id: string,
    data: Partial<{
      name: string;
      description: string;
      template: RestaurantTemplate;
      logoUrl: string;
      bannerUrl: string;
      address: string;
      lat: number;
      lng: number;
    }>
  ): Promise<Restaurant> {
    const { logoUrl, bannerUrl, ...rest } = data;
    const body: Record<string, unknown> = { ...rest };
    if (logoUrl !== undefined) body.logo = logoUrl;
    if (bannerUrl !== undefined) body.banner = bannerUrl;
    const result = await this.request<any>(`/api/restaurants/${id}`, {
      method: 'PUT',
      body: JSON.stringify(body),
    });
    return mapRestaurant(result);
  }

  // ── Menu ────────────────────────────────────────────────────────

  /** Get a restaurant's menu items (public) */
  async getMenu(restaurantId: string): Promise<MenuItem[]> {
    return this.request(`/api/restaurants/${restaurantId}/menu`);
  }

  /** Add a menu item (owner) */
  async addMenuItem(
    restaurantId: string,
    item: Omit<MenuItem, 'id'>
  ): Promise<MenuItem> {
    return this.request(`/api/restaurants/${restaurantId}/menu`, {
      method: 'POST',
      body: JSON.stringify(item),
    });
  }

  /** Update a menu item (owner) */
  async updateMenuItem(
    restaurantId: string,
    itemId: string,
    data: Partial<MenuItem>
  ): Promise<MenuItem> {
    return this.request(`/api/restaurants/${restaurantId}/menu/${itemId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  /** Delete a menu item (owner) */
  async deleteMenuItem(
    restaurantId: string,
    itemId: string
  ): Promise<void> {
    return this.request(`/api/restaurants/${restaurantId}/menu/${itemId}`, {
      method: 'DELETE',
      skipJson: true,
    });
  }

  // ═══════════════════════════════════════════════════════════════
  //  ORDERS  —  /api/orders/*
  // ═══════════════════════════════════════════════════════════════

  /** Create a new order (customer) */
  async createOrder(data: {
    restaurantId: string;
    items: { menuItemId: string; quantity: number }[];
    tokenMint: string;
    deliveryAddress?: string;
  }): Promise<Order> {
    return this.request('/api/orders', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  /** Get the current user's orders */
  async getMyOrders(): Promise<Order[]> {
    const result = await this.request<Order[] | { orders: Order[] }>('/api/orders');
    return Array.isArray(result) ? result : (result as any).orders ?? [];
  }

  /** Get a single order by ID */
  async getOrder(orderId: string): Promise<Order> {
    return this.request(`/api/orders/${orderId}`);
  }

  /** Get funding progress for an order */
  async getFundingProgress(orderId: string): Promise<FundingProgress> {
    return this.request(`/api/orders/${orderId}/funding`);
  }

  /** Record an on-chain contribution */
  async recordContribution(
    orderId: string,
    data: {
      wallet: string;
      amount: number;
      txSignature: string;
    }
  ): Promise<{ contribution: Contribution; funded: boolean }> {
    return this.request(`/api/orders/${orderId}/contribute`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  /** Generate a shareable contribution link */
  async generateShareLink(orderId: string): Promise<{ shareLink: string }> {
    return this.request(`/api/orders/${orderId}/share`, {
      method: 'POST',
    });
  }

  /** Resolve a share link to an order */
  async getOrderByShareLink(
    shareLink: string
  ): Promise<Order & { remaining: number; percentFunded: number }> {
    return this.request(`/api/orders/share/${shareLink}`);
  }

  /** Get order receipt (after settlement) */
  async getReceipt(orderId: string) {
    return this.request(`/api/orders/${orderId}/receipt`);
  }

  // ── Restaurant-side order management ────────────────────────────

  /** Get incoming orders for the authenticated restaurant owner */
  async getIncomingOrders(): Promise<Order[]> {
    const result = await this.request<Order[] | { orders: Order[] }>('/api/orders?role=restaurant');
    return Array.isArray(result) ? result : (result as any).orders ?? [];
  }

  /** Mark an order as preparing (restaurant) */
  async markPreparing(orderId: string): Promise<Order> {
    return this.request(`/api/orders/${orderId}/status`, {
      method: 'POST',
      body: JSON.stringify({ status: 'Preparing' }),
    });
  }

  /** Mark an order as ready for pickup (restaurant) */
  async markReadyForPickup(orderId: string): Promise<Order> {
    return this.request(`/api/orders/${orderId}/status`, {
      method: 'POST',
      body: JSON.stringify({ status: 'ReadyForPickup' }),
    });
  }

  // ── Driver-side ─────────────────────────────────────────────────

  /** Get funded orders available for delivery */
  async getAvailableOrders(): Promise<Order[]> {
    return this.request('/api/orders?role=driver&status=ReadyForPickup');
  }

  /** Accept a delivery */
  async acceptDelivery(orderId: string): Promise<Order> {
    return this.request(`/api/orders/${orderId}/status`, {
      method: 'POST',
      body: JSON.stringify({ status: 'PickedUp' }),
    });
  }

  /** Verify pickup with Code A */
  async verifyPickup(
    orderId: string,
    codeA: string
  ): Promise<{ valid: boolean }> {
    return this.request(`/api/orders/${orderId}/verify-pickup`, {
      method: 'POST',
      body: JSON.stringify({ code: codeA }),
    });
  }

  /** Confirm delivery with Code B (triggers settlement) */
  async confirmDelivery(
    orderId: string,
    codeB: string
  ): Promise<{ valid: boolean; settleTxSignature?: string }> {
    return this.request(`/api/orders/${orderId}/verify-delivery`, {
      method: 'POST',
      body: JSON.stringify({ code: codeB }),
    });
  }

  // ═══════════════════════════════════════════════════════════════
  //  UPLOAD  —  /api/upload
  // ═══════════════════════════════════════════════════════════════

  /** Upload an image (menu item, logo, banner). Returns the hosted URL. */
  async uploadImage(uri: string, filename?: string): Promise<UploadResult> {
    const formData = new FormData();
    const name = filename || uri.split('/').pop() || 'image.jpg';
    const type = name.endsWith('.png') ? 'image/png' : 'image/jpeg';

    formData.append('file', {
      uri,
      name,
      type,
    } as any);

    return this.request('/api/upload', {
      method: 'POST',
      body: formData,
    });
  }
}

export const api = new ApiClient();
