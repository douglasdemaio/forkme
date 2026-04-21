'use client';
import { useEffect, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { useWalletAuth } from '@/hooks/useWalletAuth';
import { api } from '@/lib/api';
import type { OrderData, DriverProfile } from '@/lib/types';

type AvailableOrder = OrderData & { myBidStatus: string | null };

export default function DriverPage() {
  const { t } = useTranslation();
  const { connected, publicKey } = useWallet();
  const { authenticate, token } = useWalletAuth();
  const [orders, setOrders] = useState<AvailableOrder[]>([]);
  const [profile, setProfile] = useState<DriverProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [bidding, setBidding] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!connected) return;
    setLoading(true);
    setError(null);
    try {
      if (!token) await authenticate();
      const [data, prof] = await Promise.all([
        api.getAvailableOrders(),
        publicKey ? api.getDriverProfile(publicKey.toBase58()).catch(() => null) : Promise.resolve(null),
      ]);
      setOrders(data);
      setProfile(prof);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [connected, token, publicKey, authenticate]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (!connected) return;
    const iv = setInterval(load, 30000);
    return () => clearInterval(iv);
  }, [connected, token, load]);

  const handleBid = async (orderId: string) => {
    setBidding(orderId);
    setMessage(null);
    setError(null);
    try {
      const { autoAssigned } = await api.placeBid(orderId);
      setMessage(autoAssigned ? t('driver.bidAutoAssigned') : t('driver.bidPlaced'));
      await load();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBidding(null);
    }
  };

  if (!connected) {
    return (
      <div className="page flex flex-col items-center justify-center min-h-[60vh] text-center">
        <span className="text-5xl mb-4">🚴</span>
        <h1 className="text-xl font-bold text-white mb-2">{t('driver.title')}</h1>
        <p className="text-dark-300 mb-6">{t('driver.connectPrompt')}</p>
        <WalletMultiButton />
      </div>
    );
  }

  return (
    <div className="page">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold text-white">{t('driver.title')}</h1>
        <button onClick={load} className="text-dark-400 hover:text-white transition-colors text-sm">↻</button>
      </div>

      {/* Driver reputation card */}
      {profile && (
        <div className="bg-dark-900 rounded-2xl p-4 mb-5">
          <div className="flex items-center justify-between">
            <span className="text-dark-300 text-sm">{t('driver.yourReputation')}</span>
            {profile.isNewcomer ? (
              <span className="text-xs px-2 py-0.5 bg-yellow-800/40 text-yellow-400 rounded-full">
                {t('driver.newcomer')}
              </span>
            ) : (
              <span className="text-xs px-2 py-0.5 bg-green-800/40 text-green-400 rounded-full">
                {t('driver.established')}
              </span>
            )}
          </div>
          <div className="flex gap-6 mt-3">
            <div>
              <p className="text-white font-bold text-xl">{profile.completedDeliveries}</p>
              <p className="text-dark-400 text-xs">{t('driver.deliveries')}</p>
            </div>
            <div>
              <p className="text-white font-bold text-xl">
                {profile.ratingCount > 0 ? profile.avgRating.toFixed(1) : '—'}
              </p>
              <p className="text-dark-400 text-xs">{t('driver.avgRating')}</p>
            </div>
          </div>
          {profile.isNewcomer && (
            <p className="text-dark-400 text-xs mt-3">
              {t('driver.newcomerHint')}
            </p>
          )}
        </div>
      )}

      {message && (
        <div className="bg-green-900/30 border border-green-800 rounded-xl px-4 py-3 mb-4 text-green-400 text-sm">
          {message}
        </div>
      )}
      {error && (
        <div className="bg-red-900/30 border border-red-800 rounded-xl px-4 py-3 mb-4 text-red-400 text-sm">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-10 h-10 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : orders.length === 0 ? (
        <div className="text-center py-16">
          <span className="text-5xl">📭</span>
          <p className="text-dark-400 mt-4">{t('driver.noOrders')}</p>
          <p className="text-dark-500 text-sm mt-2">{t('driver.autoRefresh')}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => {
            const alreadyBid = order.myBidStatus === 'Pending';
            const currency = order.restaurant?.currency ?? 'USDC';
            return (
              <div key={order.id} className="bg-dark-900 rounded-2xl p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-white font-semibold">{order.restaurant?.name ?? 'Restaurant'}</p>
                    <p className="text-dark-400 text-xs mt-0.5">#{order.id.slice(0, 8)}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-brand-500 font-bold">{order.deliveryFee.toFixed(2)}</span>
                    <p className="text-dark-400 text-xs mt-0.5">{currency} fee</p>
                  </div>
                </div>
                {order.deliveryAddress && (
                  <p className="text-dark-300 text-sm mt-2 truncate">📍 {order.deliveryAddress}</p>
                )}
                <div className="flex items-center justify-between mt-3 gap-3">
                  <span className="text-dark-400 text-sm">
                    {order.items.length} {t('driver.items')} · {order.escrowFunded.toFixed(2)} {currency}
                  </span>
                  {alreadyBid ? (
                    <span className="px-3 py-1 bg-dark-700 text-dark-300 rounded-full text-xs">
                      {t('driver.bidPending')}
                    </span>
                  ) : (
                    <button
                      onClick={() => handleBid(order.id)}
                      disabled={bidding === order.id}
                      className="px-4 py-1.5 bg-brand-500 text-dark-950 rounded-full text-xs font-bold hover:bg-brand-400 transition-colors disabled:opacity-60"
                    >
                      {bidding === order.id ? '…' : t('driver.bid')}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
