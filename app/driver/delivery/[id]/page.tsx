'use client';
import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { QRScanner } from '@/components/qr-scanner';
import { OrderStatusBadge } from '@/components/order-status-badge';
import { useWalletAuth } from '@/hooks/useWalletAuth';
import { api } from '@/lib/api';
import type { OrderData } from '@/lib/types';

export default function DeliveryPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { t } = useTranslation();
  const { authenticate, token } = useWalletAuth();
  const [order, setOrder] = useState<OrderData | null>(null);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState<'pickup' | 'delivery' | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const o = await api.getOrder(id);
      setOrder(o);
    } catch { router.push('/driver'); }
    finally { setLoading(false); }
  }, [id, router]);

  useEffect(() => { load(); }, [load]);

  const ensureAuth = async () => {
    if (!token) await authenticate();
  };

  const handleAccept = async () => {
    setActionLoading(true);
    setError(null);
    try {
      await ensureAuth();
      await api.updateStatus(id, 'PickedUp');
      await load();
      setMessage('Order accepted! Go pick it up.');
    } catch (e: any) { setError(e.message); }
    finally { setActionLoading(false); }
  };

  const handleScanResult = async (code: string) => {
    setScanning(null);
    setActionLoading(true);
    setError(null);
    try {
      await ensureAuth();
      if (scanning === 'pickup') {
        const { valid } = await api.verifyPickup(id, code);
        if (!valid) throw new Error('Invalid pickup code');
        setMessage('Pickup verified! Deliver to customer.');
      } else {
        const { valid } = await api.verifyDelivery(id, code);
        if (!valid) throw new Error('Invalid delivery code');
        setMessage('🎉 Delivery confirmed! Payment released.');
        setTimeout(() => router.push('/driver'), 3000);
      }
      await load();
    } catch (e: any) { setError(e.message); }
    finally { setActionLoading(false); }
  };

  if (loading || !order) {
    return <div className="flex justify-center items-center min-h-screen"><div className="w-10 h-10 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" /></div>;
  }

  const currency = order.restaurant?.currency ?? 'USDC';

  return (
    <div className="page">
      {scanning && (
        <QRScanner onScan={handleScanResult} onClose={() => setScanning(null)} />
      )}

      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => router.push('/driver')} className="text-dark-300 hover:text-white transition-colors">←</button>
        <div>
          <h1 className="text-xl font-bold text-white">Delivery #{order.id.slice(0, 8)}</h1>
          {order.restaurant && <p className="text-dark-400 text-sm">{order.restaurant.name}</p>}
        </div>
      </div>

      {/* Status */}
      <div className="bg-dark-900 rounded-2xl p-5 mb-4">
        <div className="flex items-center justify-between">
          <span className="text-dark-300 text-sm">Status</span>
          <OrderStatusBadge status={order.status} label={t(`order.status.${order.status}` as any)} />
        </div>
      </div>

      {/* Earnings */}
      <div className="bg-dark-900 rounded-2xl p-5 mb-4">
        <div className="flex justify-between items-center">
          <span className="text-dark-300">{t('driver.earning')}</span>
          <span className="text-brand-500 font-bold text-xl">{order.deliveryFee.toFixed(2)} {currency}</span>
        </div>
        {order.deliveryAddress && (
          <div className="mt-3 pt-3 border-t border-dark-800">
            <p className="text-dark-400 text-sm">Deliver to:</p>
            <p className="text-white mt-1">{order.deliveryAddress}</p>
          </div>
        )}
      </div>

      {/* Order items */}
      <div className="bg-dark-900 rounded-2xl p-5 mb-4">
        <h3 className="text-white font-medium mb-3">Items to deliver</h3>
        <div className="space-y-1">
          {order.items.map((item, i) => (
            <div key={i} className="flex justify-between text-sm">
              <span className="text-dark-300">{item.quantity}× {item.name}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Messages */}
      {message && <div className="bg-green-900/30 border border-green-800 rounded-xl px-4 py-3 mb-4 text-green-400 text-sm">{message}</div>}
      {error && <div className="bg-red-900/30 border border-red-800 rounded-xl px-4 py-3 mb-4 text-red-400 text-sm">{error}</div>}

      {/* Actions */}
      <div className="space-y-3">
        {order.status === 'DriverAssigned' && (
          <div className="bg-dark-900 rounded-2xl p-5">
            <div className="text-center mb-4">
              <span className="text-3xl">👍</span>
              <p className="text-white font-semibold mt-2">{t('driver.assignedWaiting')}</p>
              <p className="text-dark-400 text-sm mt-1">{t('driver.assignedWaitingDesc')}</p>
            </div>
            {order.codeA && (
              <div className="bg-dark-800 rounded-xl px-4 py-3 flex items-center justify-between mt-3">
                <span className="text-dark-300 text-sm">{t('driver.pickupCodeLabel')}</span>
                <span className="text-white font-mono font-bold text-lg tracking-widest">{order.codeA}</span>
              </div>
            )}
          </div>
        )}

        {order.status === 'ReadyForPickup' && (
          <button onClick={handleAccept} disabled={actionLoading}
            className="w-full py-4 bg-brand-500 text-dark-950 rounded-2xl font-bold hover:bg-brand-400 transition-colors disabled:opacity-60 flex items-center justify-center gap-2">
            {actionLoading ? <><div className="w-5 h-5 border-2 border-dark-950 border-t-transparent rounded-full animate-spin" /> Accepting…</> : t('driver.accept')}
          </button>
        )}

        {order.status === 'PickedUp' && !order.codeAHash && (
          <button onClick={() => setScanning('pickup')}
            className="w-full py-4 bg-dark-900 border border-dark-700 text-white rounded-2xl font-medium hover:bg-dark-800 transition-colors flex items-center justify-center gap-2">
            <span>📷</span> {t('driver.scanPickup')}
          </button>
        )}

        {order.status === 'PickedUp' && order.driverWallet && (
          <button onClick={() => setScanning('delivery')}
            className="w-full py-4 bg-brand-500 text-dark-950 rounded-2xl font-bold hover:bg-brand-400 transition-colors flex items-center justify-center gap-2">
            <span>📷</span> {t('driver.scanDelivery')}
          </button>
        )}

        {['Delivered', 'Settled'].includes(order.status) && (
          <div className="text-center py-4">
            <span className="text-4xl">🎉</span>
            <p className="text-green-400 font-semibold mt-2">Delivery complete!</p>
          </div>
        )}
      </div>
    </div>
  );
}
