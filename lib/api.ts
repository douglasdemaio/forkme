import { API_BASE_URL } from './constants';
import type { MenuItemData, OrderData, MerchantData, DriverProfile, DriverBid, CustomerProfile } from './types';

class ApiClient {
  private token: string | null = null;

  setToken(t: string) { this.token = t; }
  clearToken()        { this.token = null; }

  private async req<T>(path: string, opts?: RequestInit & { skipJson?: boolean }): Promise<T> {
    const headers: Record<string, string> = {};
    if (this.token) headers['Authorization'] = `Bearer ${this.token}`;
    if (!(opts?.body instanceof FormData)) headers['Content-Type'] = 'application/json';

    const res = await fetch(`${API_BASE_URL}${path}`, {
      ...opts,
      headers: { ...headers, ...(opts?.headers as Record<string, string> | undefined) },
    });

    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(`API ${res.status}: ${text || res.statusText}`);
    }
    if (opts?.skipJson) return undefined as unknown as T;
    return res.json();
  }

  // ── Auth ──────────────────────────────────────────────────────────
  getNonce(wallet: string)             { return this.req<{ nonce: string }>('/api/auth/nonce', { method: 'POST', body: JSON.stringify({ wallet }) }); }
  verify(wallet: string, nonce: string, signature: string) {
    return this.req<{ token: string; wallet: string }>('/api/auth/verify', {
      method: 'POST', body: JSON.stringify({ wallet, nonce, signature }),
    });
  }

  // ── Merchants ───────────────────────────────────────────────────
  async getMerchants(params?: { page?: number; limit?: number; search?: string }): Promise<MerchantData[]> {
    const qs = new URLSearchParams();
    if (params?.page)   qs.set('page',   String(params.page));
    if (params?.limit)  qs.set('limit',  String(params.limit));
    if (params?.search) qs.set('search', params.search);
    const raw = await this.req<MerchantData[] | { merchants: MerchantData[] }>(
      `/api/merchants${qs.toString() ? `?${qs}` : ''}`
    );
    return Array.isArray(raw) ? raw : raw.merchants ?? [];
  }

  getMerchant(id: string)     { return this.req<MerchantData>(`/api/merchants/${id}`); }
  getMenu(merchantId: string) { return this.req<MenuItemData[]>(`/api/merchants/${merchantId}/menu`); }

  // ── Orders ────────────────────────────────────────────────────────
  createOrder(data: { merchantId: string; items: { menuItemId: string; quantity: number }[]; tokenMint: string; deliveryAddress?: string }) {
    return this.req<OrderData>('/api/orders', { method: 'POST', body: JSON.stringify(data) });
  }

  async getMyOrders(): Promise<OrderData[]> {
    const raw = await this.req<OrderData[] | { orders: OrderData[] }>('/api/orders');
    return Array.isArray(raw) ? raw : raw.orders ?? [];
  }

  getOrder(id: string) { return this.req<OrderData>(`/api/orders/${id}`); }

  async getAvailableOrders(): Promise<(OrderData & { myBidStatus: string | null })[]> {
    const raw = await this.req<{ orders: (OrderData & { myBidStatus: string | null })[] }>('/api/orders/available');
    return raw.orders ?? [];
  }

  placeBid(orderId: string, offerAmount: number) {
    return this.req<{ bid: DriverBid }>(`/api/orders/${orderId}/bids`, {
      method: 'POST',
      body: JSON.stringify({ offerAmount }),
    });
  }

  getDriverProfile(wallet: string) {
    return this.req<DriverProfile>(`/api/drivers/${wallet}`);
  }

  updateDriverVehicle(wallet: string, vehicleType: string) {
    return this.req<DriverProfile>(`/api/drivers/${wallet}`, {
      method: 'PATCH', body: JSON.stringify({ vehicleType }),
    });
  }

  getCustomerProfile() {
    return this.req<CustomerProfile>('/api/profile/customer');
  }

  updateCustomerProfile(data: { preferEco: boolean }) {
    return this.req<CustomerProfile>('/api/profile/customer', {
      method: 'PATCH', body: JSON.stringify(data),
    });
  }

  rateDriver(orderId: string, rating: number, comment?: string) {
    return this.req(`/api/orders/${orderId}/rate-driver`, { method: 'POST', body: JSON.stringify({ rating, comment }) });
  }

  recordContribution(orderId: string, data: { wallet: string; amount: number; txSignature: string }) {
    return this.req(`/api/orders/${orderId}/contribute`, { method: 'POST', body: JSON.stringify(data) });
  }

  updateStatus(orderId: string, status: string) {
    return this.req<OrderData>(`/api/orders/${orderId}/status`, { method: 'POST', body: JSON.stringify({ status }) });
  }

  verifyPickup(orderId: string, code: string) {
    return this.req<{ valid: boolean }>(`/api/orders/${orderId}/verify-pickup`, { method: 'POST', body: JSON.stringify({ code }) });
  }

  verifyDelivery(orderId: string, code: string, txSignature?: string) {
    return this.req<{ valid: boolean; settleTxSignature?: string }>(`/api/orders/${orderId}/verify-delivery`, {
      method: 'POST',
      body: JSON.stringify(txSignature ? { code, txSignature } : { code }),
    });
  }

  getFunding(orderId: string) {
    return this.req<{ escrowTarget: number; escrowFunded: number; percentFunded: number; contributions: { wallet: string; amount: number }[] }>(`/api/orders/${orderId}/funding`);
  }

  generateShareLink(orderId: string) { return this.req<{ shareLink: string }>(`/api/orders/${orderId}/share`, { method: 'POST' }); }

  getByShareLink(shareLink: string) {
    // Accept both bare tokens (e.g. "ebba39f2") and full URLs
    // (e.g. "http://localhost:3000/order/ebba39f2") for backwards compatibility
    // with share links generated before the path-segment fix.
    const token = shareLink.split('/').filter(Boolean).pop() ?? shareLink;
    return this.req<OrderData & { remaining: number; percentFunded: number }>(
      `/api/orders/share/${encodeURIComponent(token)}`
    );
  }
}

export const api = new ApiClient();
