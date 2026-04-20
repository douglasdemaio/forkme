'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { OrderStatusBadge } from '@/components/order-status-badge';
import { useWalletAuth } from '@/hooks/useWalletAuth';
import { api } from '@/lib/api';
import type { OrderData } from '@/lib/types';

export default function OrdersPage() {
  const { t } = useTranslation();
  const { connected } = useWallet();
  const { authenticate, token } = useWalletAuth();
  const [orders, setOrders] = useState<OrderData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!connected) return;
    (async () => {
      setLoading(true);
      try {
        if (!token) await authenticate();
        const data = await api.getMyOrders();
        setOrders(data.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
      } catch (e: any) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    })();
  }, [connected, token]);

  if (!connected) {
    return (
      <div className="page flex flex-col items-center justify-center min-h-[60vh] text-center">
        <span className="text-5xl mb-4">📋</span>
        <h1 className="text-xl font-bold text-white mb-2">{t('profile.myOrders')}</h1>
        <p className="text-dark-300 mb-6">Connect your wallet to see your orders</p>
        <WalletMultiButton />
      </div>
    );
  }

  return (
    <div className="page">
      <h1 className="text-2xl font-bold text-white mb-6">{t('profile.myOrders')}</h1>

      {loading ? (
        <div className="flex justify-center py-16"><div className="w-10 h-10 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" /></div>
      ) : error ? (
        <p className="text-red-400 text-center">{error}</p>
      ) : orders.length === 0 ? (
        <div className="text-center py-16">
          <span className="text-5xl">🍽️</span>
          <p className="text-dark-400 mt-4">No orders yet</p>
          <Link href="/" className="inline-block mt-6 px-6 py-3 bg-brand-500 text-dark-950 rounded-2xl font-semibold">Browse restaurants</Link>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => (
            <Link key={order.id} href={`/order/${order.id}`}
              className="block bg-dark-900 rounded-2xl p-4 hover:ring-1 hover:ring-brand-500/40 transition-all">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <p className="text-white font-medium">{order.restaurant?.name ?? 'Order'}</p>
                  <p className="text-dark-400 text-xs mt-0.5">#{order.id.slice(0, 8)} · {new Date(order.createdAt).toLocaleDateString()}</p>
                </div>
                <OrderStatusBadge status={order.status} label={t(`order.status.${order.status}` as any)} />
              </div>
              <div className="flex justify-between text-sm mt-2">
                <span className="text-dark-300">{order.items.length} items</span>
                <span className="text-brand-500 font-medium">{order.escrowTarget.toFixed(2)} {order.restaurant?.currency ?? 'USDC'}</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
