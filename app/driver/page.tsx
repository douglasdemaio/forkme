'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { useWalletAuth } from '@/hooks/useWalletAuth';
import { api } from '@/lib/api';
import type { OrderData } from '@/lib/types';

export default function DriverPage() {
  const { t } = useTranslation();
  const { connected } = useWallet();
  const { authenticate, token } = useWalletAuth();
  const [orders, setOrders] = useState<OrderData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    if (!connected) return;
    setLoading(true);
    setError(null);
    try {
      if (!token) await authenticate();
      const data = await api.getAvailableOrders();
      setOrders(data);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [connected, token]);

  // Refresh every 30s
  useEffect(() => {
    if (!connected) return;
    const iv = setInterval(load, 30000);
    return () => clearInterval(iv);
  }, [connected, token]);

  if (!connected) {
    return (
      <div className="page flex flex-col items-center justify-center min-h-[60vh] text-center">
        <span className="text-5xl mb-4">🚴</span>
        <h1 className="text-xl font-bold text-white mb-2">{t('driver.title')}</h1>
        <p className="text-dark-300 mb-6">Connect your wallet to see available deliveries</p>
        <WalletMultiButton />
      </div>
    );
  }

  return (
    <div className="page">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-white">{t('driver.title')}</h1>
        <button onClick={load} className="text-dark-400 hover:text-white transition-colors text-sm">↻ Refresh</button>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><div className="w-10 h-10 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" /></div>
      ) : error ? (
        <div className="text-center py-12">
          <p className="text-red-400 mb-4">{error}</p>
          <button onClick={load} className="px-4 py-2 bg-brand-500 text-dark-950 rounded-xl font-medium">{t('common.retry')}</button>
        </div>
      ) : orders.length === 0 ? (
        <div className="text-center py-16">
          <span className="text-5xl">📭</span>
          <p className="text-dark-400 mt-4">{t('driver.noOrders')}</p>
          <p className="text-dark-500 text-sm mt-2">Auto-refreshes every 30 seconds</p>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => (
            <Link key={order.id} href={`/driver/delivery/${order.id}`}
              className="block bg-dark-900 rounded-2xl p-4 hover:ring-1 hover:ring-brand-500/40 transition-all">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-white font-semibold">{order.restaurant?.name ?? 'Restaurant'}</p>
                  <p className="text-dark-400 text-xs mt-0.5">#{order.id.slice(0, 8)}</p>
                </div>
                <div className="text-right">
                  <span className="text-brand-500 font-bold">{order.deliveryFee.toFixed(2)}</span>
                  <p className="text-dark-400 text-xs mt-0.5">{order.restaurant?.currency ?? 'USDC'} fee</p>
                </div>
              </div>
              {order.deliveryAddress && (
                <p className="text-dark-300 text-sm mt-2 truncate">📍 {order.deliveryAddress}</p>
              )}
              <div className="flex items-center justify-between mt-3">
                <span className="text-dark-400 text-sm">{order.items.length} items · {order.escrowFunded.toFixed(2)} {order.restaurant?.currency ?? 'USDC'} funded</span>
                <span className="px-3 py-1 bg-brand-500/20 text-brand-500 rounded-full text-xs font-medium">Accept →</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
