'use client';
import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { useWallet } from '@solana/wallet-adapter-react';
import { OrderStatusBadge } from '@/components/order-status-badge';
import { FundingProgress } from '@/components/funding-progress';
import { QRDisplay } from '@/components/qr-display';
import { useEscrow } from '@/hooks/useEscrow';
import { api } from '@/lib/api';
import type { OrderData, DriverProfile } from '@/lib/types';

function tokenLabel(mint: string | null) {
  if (!mint) return 'USDC';
  if (mint.startsWith('CXk2')) return 'PYUSD';
  if (mint.startsWith('Hzwq')) return 'EURC';
  return 'USDC';
}

export default function OrderPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { t } = useTranslation();
  const { publicKey } = useWallet();
  const { confirmDelivery } = useEscrow();
  const [order, setOrder] = useState<OrderData | null>(null);
  const [driverProfile, setDriverProfile] = useState<DriverProfile | null>(null);
  const [ratingDismissed, setRatingDismissed] = useState(false);
  const [selectedRating, setSelectedRating] = useState(0);
  const [submittingRating, setSubmittingRating] = useState(false);
  const [ratingDone, setRatingDone] = useState(false);
  const [loading, setLoading] = useState(true);
  const [shareLink, setShareLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [showShareQR, setShowShareQR] = useState(true);
  const [showInvoice, setShowInvoice] = useState(false);
  const [confirmingDelivery, setConfirmingDelivery] = useState(false);
  const [confirmError, setConfirmError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const o = await api.getOrder(id);
      setOrder(o);
      if (o.shareLink) setShareLink(o.shareLink);
      if (o.status === 'Settled' && o.driverWallet) {
        api.getDriverProfile(o.driverWallet).then((p) => {
          if (p.isNewcomer) setDriverProfile(p);
        }).catch(() => {});
      }
    } catch {
      router.push('/orders');
    } finally {
      setLoading(false);
    }
  }, [id, router]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    const active = ['Created', 'Funded', 'Preparing', 'ReadyForPickup', 'PickedUp'];
    if (!order || !active.includes(order.status)) return;
    const interval = setInterval(load, 10000);
    return () => clearInterval(interval);
  }, [order, load]);

  // Auto-generate the share link when the order has outstanding balance to
  // collect, so the QR is ready immediately after a split checkout.
  useEffect(() => {
    if (!order || shareLink) return;
    const shareable = ['Created', 'Funded'].includes(order.status);
    const hasGap = order.escrowFunded < order.escrowTarget;
    if (!shareable || !hasGap) return;
    api.generateShareLink(id).then(({ shareLink: sl }) => setShareLink(sl)).catch(() => {});
  }, [order, shareLink, id]);

  // The DB stores `shareLink` as a full URL like
  // `http://localhost:3000/order/<token>`. We want only the trailing token
  // in the contribute URL — embedding the whole URL produces unencoded
  // slashes that break the downstream `/api/orders/share/<token>` route.
  const shareUrl = (() => {
    if (!shareLink || typeof window === 'undefined') return null;
    const token = shareLink.split('/').filter(Boolean).pop() ?? shareLink;
    return `${window.location.origin}/order/${id}/contribute?link=${encodeURIComponent(token)}`;
  })();

  const handleConfirmDelivery = async () => {
    if (!order || !order.codeB) return;
    if (!order.driverWallet) {
      setConfirmError('No driver assigned yet');
      return;
    }
    const restaurantWallet = order.restaurant?.wallet;
    if (!restaurantWallet) {
      setConfirmError('Restaurant wallet missing');
      return;
    }
    setConfirmingDelivery(true);
    setConfirmError(null);
    try {
      const currency = ((): 'USDC' | 'PYUSD' | 'EURC' => {
        const c = order.restaurant?.currency?.toUpperCase();
        if (c === 'PYUSD') return 'PYUSD';
        if (c === 'EURC')  return 'EURC';
        return 'USDC';
      })();
      const { signature } = await confirmDelivery({
        orderId: order.id,
        restaurantWallet,
        driverWallet: order.driverWallet,
        codeB: order.codeB,
        currency,
      });
      // Persist the on-chain signature and flip DB to Settled (idempotent —
      // safe even if a driver scan already moved DB ahead of chain).
      await api.verifyDelivery(order.id, order.codeB, signature);
      await load();
    } catch (e: any) {
      setConfirmError(e.message || 'Failed to confirm delivery');
    } finally {
      setConfirmingDelivery(false);
    }
  };

  const handleShare = async () => {
    try {
      let url = shareUrl;
      if (!url) {
        const { shareLink: sl } = await api.generateShareLink(id);
        setShareLink(sl);
        const token = sl.split('/').filter(Boolean).pop() ?? sl;
        url = `${window.location.origin}/order/${id}/contribute?link=${encodeURIComponent(token)}`;
      }
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

  const currency = order.restaurant?.currency ?? tokenLabel(order.tokenMint);
  const statusLabel = t(`order.status.${order.status}` as any);
  const formattedDate = new Date(order.createdAt).toLocaleString();

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

      {/* Pickup codes */}
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

      {/* Delivery confirmation — customer signs confirm_delivery on-chain to release escrow.
          Shown for any non-terminal order so the on-chain action is always reachable;
          if the chain isn't yet in PickedUp the program will reject and show the reason. */}
      {!['Settled', 'Cancelled', 'Refunded'].includes(order.status) && order.codeB && (
        <div className="bg-dark-900 rounded-2xl p-5 mb-4">
          <h3 className="text-white font-semibold mb-1">Confirm Delivery</h3>
          <p className="text-dark-300 text-sm mb-4">
            When your food arrives, tap below to release {order.escrowTarget.toFixed(2)} {currency} from escrow to the restaurant and driver. (Chain expects status PickedUp — current: {order.status}.)
          </p>
          <button
            onClick={handleConfirmDelivery}
            disabled={confirmingDelivery || !publicKey}
            className="w-full py-4 bg-brand-500 text-dark-950 rounded-2xl font-bold hover:bg-brand-400 transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {confirmingDelivery ? (
              <><div className="w-5 h-5 border-2 border-dark-950 border-t-transparent rounded-full animate-spin" /> Confirming…</>
            ) : (
              <>I received my order</>
            )}
          </button>
          {confirmError && (
            <p className="text-red-400 text-sm mt-3">{confirmError}</p>
          )}
          <details className="mt-4">
            <summary className="text-dark-400 text-xs cursor-pointer hover:text-dark-300">Show code for driver to scan</summary>
            <div className="mt-3">
              <QRDisplay value={order.codeB} label="Delivery confirmation code" />
            </div>
          </details>
        </div>
      )}

      {/* Invoice */}
      <div className="bg-dark-900 rounded-2xl mb-4 overflow-hidden">
        <button
          onClick={() => setShowInvoice(!showInvoice)}
          className="w-full flex items-center justify-between px-5 py-4 text-white hover:bg-dark-800 transition-colors"
        >
          <span className="font-semibold">🧾 {t('order.invoiceTitle')}</span>
          <span className="text-dark-400 text-sm">{showInvoice ? '▲' : '▼'}</span>
        </button>
        {showInvoice && (
          <div className="px-5 pb-5 border-t border-dark-800">
            <div className="space-y-2 mt-4 text-sm">
              <div className="flex justify-between">
                <span className="text-dark-400">Invoice #</span>
                <span className="text-white font-mono">{order.id.slice(0, 8).toUpperCase()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-dark-400">{t('order.invoiceDate')}</span>
                <span className="text-white">{formattedDate}</span>
              </div>
              {order.restaurant && (
                <div className="flex justify-between">
                  <span className="text-dark-400">Restaurant</span>
                  <span className="text-white">{order.restaurant.name}</span>
                </div>
              )}
              {order.deliveryAddress && (
                <div className="flex justify-between">
                  <span className="text-dark-400">Delivery to</span>
                  <span className="text-white text-right max-w-[60%]">{order.deliveryAddress}</span>
                </div>
              )}
            </div>
            <div className="border-t border-dark-800 mt-4 pt-4 space-y-2 text-sm">
              {order.items.map((item, i) => (
                <div key={i} className="flex justify-between">
                  <span className="text-dark-300">{item.quantity}× {item.name}</span>
                  <span className="text-white">{(item.price * item.quantity).toFixed(2)} {currency}</span>
                </div>
              ))}
            </div>
            <div className="border-t border-dark-800 mt-4 pt-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-dark-400">{t('order.invoiceSubtotal')}</span>
                <span className="text-white">{order.foodTotal.toFixed(2)} {currency}</span>
              </div>
              {order.deliveryFee > 0 && (
                <div className="flex justify-between">
                  <span className="text-dark-400">{t('order.invoiceDeliveryFee')}</span>
                  <span className="text-white">{order.deliveryFee.toFixed(2)} {currency}</span>
                </div>
              )}
              <div className="flex justify-between font-semibold">
                <span className="text-white">{t('order.invoiceTotal')}</span>
                <span className="text-brand-500">{order.escrowTarget.toFixed(2)} {currency}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-dark-400">{t('order.invoicePaidWith')}</span>
                <span className="text-white">{currency} (Solana)</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Soft rating prompt for newcomer drivers */}
      {order.status === 'Settled' && driverProfile?.isNewcomer && !ratingDismissed && !ratingDone && (
        <div className="bg-dark-900 rounded-2xl p-5 mb-4 border border-brand-500/30">
          <div className="flex items-start justify-between mb-3">
            <div>
              <p className="text-white font-semibold">{t('order.rateDriver')}</p>
              <p className="text-dark-400 text-sm mt-1">{t('order.rateDriverDesc')}</p>
            </div>
            <button onClick={() => setRatingDismissed(true)} className="text-dark-500 hover:text-dark-300 text-xl leading-none ml-3">×</button>
          </div>
          <div className="flex gap-2 mb-4">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                onClick={() => setSelectedRating(star)}
                className={`text-2xl transition-transform hover:scale-110 ${star <= selectedRating ? 'text-yellow-400' : 'text-dark-600'}`}
              >
                ★
              </button>
            ))}
          </div>
          <button
            disabled={selectedRating === 0 || submittingRating}
            onClick={async () => {
              if (!selectedRating) return;
              setSubmittingRating(true);
              try {
                await api.rateDriver(id, selectedRating);
                setRatingDone(true);
              } catch {} finally {
                setSubmittingRating(false);
              }
            }}
            className="w-full py-3 bg-brand-500 text-dark-950 rounded-xl font-semibold disabled:opacity-40 hover:bg-brand-400 transition-colors"
          >
            {submittingRating ? '…' : t('order.submitRating')}
          </button>
        </div>
      )}
      {order.status === 'Settled' && ratingDone && (
        <div className="bg-green-900/20 border border-green-800/50 rounded-2xl p-4 mb-4 text-center">
          <span className="text-2xl">🙏</span>
          <p className="text-green-400 text-sm mt-1">{t('order.ratingThanks')}</p>
        </div>
      )}

      {/* Split bill — share link + QR for friends to chip in on the remaining balance */}
      {['Created', 'Funded'].includes(order.status) && order.escrowFunded < order.escrowTarget && (
        <div className="bg-dark-900 rounded-2xl p-5 mb-4">
          <h3 className="text-white font-semibold mb-1">Split with friends</h3>
          <p className="text-dark-400 text-sm mb-4">
            Remaining {(order.escrowTarget - order.escrowFunded).toFixed(2)} {currency} — share this link or QR for friends to contribute.
          </p>
          {shareUrl && showShareQR && (
            <div className="mb-4">
              <QRDisplay value={shareUrl} label="Scan to chip in" />
            </div>
          )}
          <div className="flex gap-2">
            <button onClick={handleShare}
              className="flex-1 py-3 bg-dark-800 border border-dark-700 text-white rounded-xl font-medium hover:bg-dark-700 transition-colors flex items-center justify-center gap-2">
              {copied ? (
                <><span className="text-green-400">✓</span> {t('common.copied')}</>
              ) : (
                <><span>🔗</span> {t('order.copyLink')}</>
              )}
            </button>
            {shareUrl && (
              <button onClick={() => setShowShareQR(!showShareQR)}
                className="px-4 py-3 bg-dark-800 border border-dark-700 text-white rounded-xl font-medium hover:bg-dark-700 transition-colors">
                {showShareQR ? 'Hide QR' : 'Show QR'}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
