import { API_URL } from './constants';
import type { Order, Restaurant, FundingProgress } from './types';

class ApiClient {
  private token: string | null = null;

  setToken(token: string) {
    this.token = token;
  }

  private async fetch<T>(path: string, options?: RequestInit): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(this.token ? { Authorization: `Bearer ${this.token}` } : {}),
    };
    const res = await fetch(`${API_URL}${path}`, { ...options, headers });
    if (!res.ok) throw new Error(`API error: ${res.status}`);
    return res.json();
  }

  // Auth
  async getChallenge(walletAddress: string) {
    return this.fetch<{ nonce: string; message: string }>('/api/auth/nonce', {
      method: 'POST',
      body: JSON.stringify({ walletAddress }),
    });
  }

  async verify(walletAddress: string, signature: string, message: string) {
    return this.fetch<{ token: string }>('/api/auth/verify', {
      method: 'POST',
      body: JSON.stringify({ walletAddress, signature, message }),
    });
  }

  // Restaurants
  async getNearbyRestaurants(lat: number, lng: number) {
    return this.fetch<Restaurant[]>(
      `/api/customers/nearby-restaurants?lat=${lat}&lng=${lng}`
    );
  }

  // Orders
  async createOrder(data: {
    restaurantId: string;
    items: { menuItemId: string; quantity: number }[];
    tokenMint: string;
  }) {
    return this.fetch<Order>('/api/customers/orders', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getOrder(orderId: string) {
    return this.fetch<Order>(`/api/customers/orders/${orderId}`);
  }

  // Contributions
  async getFundingProgress(orderId: string) {
    return this.fetch<FundingProgress>(`/api/contributions/order/${orderId}`);
  }

  async getOrderByShareLink(shareLink: string) {
    return this.fetch<Order & { remaining: number; percentFunded: number }>(
      `/api/contributions/share/${shareLink}`
    );
  }

  async recordContribution(data: {
    orderId: string;
    walletAddress: string;
    amount: number;
    txSignature: string;
  }) {
    return this.fetch<{ contribution: any; funded: boolean }>(
      '/api/contributions',
      { method: 'POST', body: JSON.stringify(data) }
    );
  }

  async generateShareLink(orderId: string) {
    return this.fetch<{ shareLink: string }>(
      `/api/contributions/generate-link/${orderId}`,
      { method: 'POST' }
    );
  }

  // Driver
  async getAvailableOrders() {
    return this.fetch<Order[]>('/api/drivers/available-orders');
  }

  async acceptOrder(orderId: string) {
    return this.fetch<Order>(`/api/drivers/accept/${orderId}`, {
      method: 'POST',
    });
  }

  // Restaurant
  async getIncomingOrders() {
    return this.fetch<Order[]>('/api/restaurants/orders');
  }
}

export const api = new ApiClient();
