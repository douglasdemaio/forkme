'use client';
import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { OrderStatusBadge } from '@/components/order-status-badge';
import { FundingProgress } from '@/components/funding-progress';
import { QRDisplay } from '@/components/qr-display';
import { api } from '@/lib/api';
import type { OrderData } from '@/lib/types';

export default function OrderPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { t } = useTranslation();
  const [order, setOrder] = useState<OrderData | null>(null);
  const [loading, setLoading] = useState(true);
  const [shareLink, setShareLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [showQR, setShowQR] = useState(false);

  const load = useCallback(async () => {
    try {
      const o = await api.getOrder(id);
      setOrder(o);
      if (o.shareLink) setShareLink(o.shareLink);
    } catch {
      router.push('/orders');
    } finally {
      setLoading(false);
    }
  }, [id, router]);

  useEffect(() => { load(); }, [load]);

  // Poll for status updates
  useEffect(() => {
    const active = ['Created', 'Funded', 'Preparing', 'ReadyForPickup', 'PickedUp'];
    if (!order || !active.includes(order.status)) return;
    const interval = setInterval(load, 10000);
    return () => clearInterval(interval);
  }, [order, load]);

  const handleShare = async () => {
    try {
      let link = shareLink;
      if (!link) {
        const { shareLink: sl } = await api.generateShareLink(id);
        setShareLink(sl);
        link = sl;
      }
      const url = `${window.location.origin}/order/${id}/contribute?link=${link}`;
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="w-10 h-10 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!order) return null;

  const currency = order.restaurant?.currency ?? 'USDC';
  const statusLabel = t(`order.status.${order.status}` as any);

  return (
    <div className="page">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => router.back()} className="text-dark-300 hover:text-white transition-colors">←</button>
        <div>
          <h1 className="text-xl font-bold text-white">Order #{order.id.slice(0, 8)}</h1>
          {order.restaurant && <p className="text-dark-400 text-sm">{order.restaurant.name}</p>}
        </div>
      </div>

      {/* Status */}
      <div className="bg-dark-900 rounded-2xl p-5 mb-4">
        <div className="flex items-center justify-between mb-4">
          <span className="text-dark-300 text-sm">Status</span>
          <OrderStatusBadge status={order.status} label={statusLabel} />
        </div>
        <FundingProgress funded={order.escrowFunded} target={order.escrowTarget} currency={currency} />
      </div>

      {/* Items */}
      <div className="bg-dark-900 rounded-2xl p-5 mb-4">
        <h3 className="text-white font-semibold mb-3">{t('order.items')}</h3>
        <div className="space-y-2">
          {order.items.map((item, i) => (
            <div key={i} className="flex justify-between text-sm">
              <span className="text-dark-300">{item.quantity}× {item.name}</span>
              <span className="text-white">{(item.price * item.quantity).toFixed(2)} {currency}</span>
            </div>
          ))}
          <div className="border-t border-dark-800 pt-2 flex justify-between font-medium">
            <span className="text-dark-300">Total</span>
            <span className="text-brand-500">{order.escrowTarget.toFixed(2)} {currency}</span>
          </div>
        </div>
      </div>

      {/* Contributions */}
      {order.contributions?.length > 0 && (
        <div className="bg-dark-900 rounded-2xl p-5 mb-4">
          <h3 className="text-white font-semibold mb-3">{t('order.contributions')}</h3>
          <div className="space-y-2">
            {order.contributions.map((c, i) => (
              <div key={i} className="flex justify-between text-sm">
                <span className="text-dark-400 font-mono">{c.wallet.slice(0, 8)}…{c.wallet.slice(-4)}</span>
                <span className="text-white">{c.amount.toFixed(2)} {currency}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Pickup codes (show when order is funded/preparing/ready) */}
      {['Funded', 'Preparing', 'ReadyForPickup'].includes(order.status) && order.codeA && (
        <div className="bg-dark-900 rounded-2xl p-5 mb-4">
          <h3 className="text-white font-semibold mb-3">Your Pickup Code</h3>
          <p className="text-dark-300 text-sm mb-3">Show this code to verify your order was picked up</p>
          <button onClick={() => setShowQR(!showQR)}
            className="w-full py-2 bg-dark-800 text-white rounded-xl text-sm hover:bg-dark-700 transition-colors mb-3">
            {showQR ? 'Hide QR Code' : 'Show QR Code (Code A)'}
          </button>
          {showQR && <QRDisplay value={order.codeA} label="Pickup verification code" />}
        </div>
      )}

      {/* Delivery code */}
      {order.status === 'PickedUp' && order.codeB && (
        <div className="bg-dark-900 rounded-2xl p-5 mb-4">
          <h3 className="text-white font-semibold mb-3">Your Delivery Code</h3>
          <p className="text-dark-300 text-sm mb-3">Show this to the driver when your food arrives</p>
          <QRDisplay value={order.codeB} label="Delivery confirmation code" />
        </div>
      )}

      {/* Split bill */}
      {['Created', 'Funded'].includes(order.status) && (
        <button onClick={handleShare}
          className="w-full py-4 bg-dark-900 border border-dark-700 text-white rounded-2xl font-medium hover:bg-dark-800 transition-colors flex items-center justify-center gap-2">
          {copied ? (
            <><span className="text-green-400">✓</span> {t('common.copied')}</>
          ) : (
            <><span>🔗</span> {t('order.copyLink')}</>
          )}
        </button>
      )}
    </div>
  );
}
