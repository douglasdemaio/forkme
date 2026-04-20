'use client';
import { useEffect, useState } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { FundingProgress } from '@/components/funding-progress';
import { OrderStatusBadge } from '@/components/order-status-badge';
import { useEscrow } from '@/hooks/useEscrow';
import { useWalletAuth } from '@/hooks/useWalletAuth';
import { api } from '@/lib/api';
import type { OrderData } from '@/lib/types';

export default function ContributePage() {
  const { id } = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const shareLink = searchParams.get('link');
  const router = useRouter();
  const { t } = useTranslation();
  const { connected, publicKey } = useWallet();
  const { authenticate, token } = useWalletAuth();
  const { contributeToOrder } = useEscrow();

  const [order, setOrder] = useState<OrderData | null>(null);
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const o = shareLink
          ? await api.getByShareLink(shareLink)
          : await api.getOrder(id);
        setOrder(o);
      } catch { router.push('/'); }
      finally { setLoading(false); }
    })();
  }, [id, shareLink, router]);

  const handleContribute = async () => {
    if (!order || !connected || !amount) return;
    setSubmitting(true);
    setError(null);
    try {
      let jwt = token;
      if (!jwt) jwt = await authenticate();
      if (!jwt) throw new Error('Authentication failed');

      const remaining = order.escrowTarget - order.escrowFunded;
      const contrib = Math.min(parseFloat(amount), remaining);

      if (!order.onChainOrderId) throw new Error('Order not yet on-chain');

      const { signature } = await contributeToOrder({
        orderId: order.id,
        escrowPda: order.onChainOrderId,
        amount: contrib,
        currency: order.restaurant?.currency ?? 'USDC',
      });

      await api.recordContribution(order.id, {
        wallet: publicKey!.toBase58(),
        amount: contrib,
        txSignature: signature,
      });

      setSuccess(true);
      setTimeout(() => router.push(`/order/${order.id}`), 2000);
    } catch (e: any) {
      setError(e.message || t('common.error'));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || !order) {
    return <div className="flex justify-center items-center min-h-screen"><div className="w-10 h-10 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" /></div>;
  }

  const currency = order.restaurant?.currency ?? 'USDC';
  const remaining = Math.max(0, order.escrowTarget - order.escrowFunded);

  return (
    <div className="page">
      <div className="text-center mb-6">
        <span className="text-4xl">🤝</span>
        <h1 className="text-2xl font-bold text-white mt-3">Chip In</h1>
        <p className="text-dark-300 mt-1">
          {order.restaurant?.name && `Help fund an order from ${order.restaurant.name}`}
        </p>
      </div>

      <div className="bg-dark-900 rounded-2xl p-5 mb-4">
        <div className="flex justify-between items-center mb-4">
          <span className="text-dark-300 text-sm">Order #{order.id.slice(0, 8)}</span>
          <OrderStatusBadge status={order.status} label={t(`order.status.${order.status}` as any)} />
        </div>
        <FundingProgress funded={order.escrowFunded} target={order.escrowTarget} currency={currency} />
        <p className="text-dark-400 text-sm mt-3 text-center">
          {remaining.toFixed(2)} {currency} still needed
        </p>
      </div>

      {order.items.length > 0 && (
        <div className="bg-dark-900 rounded-2xl p-5 mb-4">
          <h3 className="text-white font-medium mb-3">Order items</h3>
          <div className="space-y-1">
            {order.items.map((item, i) => (
              <div key={i} className="flex justify-between text-sm">
                <span className="text-dark-300">{item.quantity}× {item.name}</span>
                <span className="text-white">{(item.price * item.quantity).toFixed(2)} {currency}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {success ? (
        <div className="bg-green-900/30 border border-green-800 rounded-2xl p-6 text-center">
          <span className="text-4xl">🎉</span>
          <p className="text-green-400 font-semibold mt-2">{t('common.success')}!</p>
          <p className="text-dark-300 text-sm mt-1">Redirecting to order…</p>
        </div>
      ) : order.status !== 'Created' && order.status !== 'Funded' ? (
        <div className="bg-dark-900 rounded-2xl p-6 text-center">
          <p className="text-dark-300">This order is no longer accepting contributions.</p>
        </div>
      ) : (
        <div className="space-y-4">
          <div>
            <label className="block text-dark-300 text-sm mb-2">{t('order.contributeAmount')} ({currency})</label>
            <input
              type="number"
              min="0.01"
              max={remaining}
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder={`Max ${remaining.toFixed(2)}`}
              className="w-full bg-dark-900 border border-dark-800 rounded-xl px-4 py-3 text-white placeholder:text-dark-500 focus:outline-none focus:border-brand-500 transition-colors"
            />
          </div>

          {error && <p className="text-red-400 text-sm">{error}</p>}

          {!connected ? (
            <WalletMultiButton style={{ width: '100%', borderRadius: '16px', justifyContent: 'center' }} />
          ) : (
            <button
              onClick={handleContribute}
              disabled={submitting || !amount || parseFloat(amount) <= 0}
              className="w-full py-4 bg-brand-500 text-dark-950 rounded-2xl font-bold hover:bg-brand-400 transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {submitting ? <><div className="w-5 h-5 border-2 border-dark-950 border-t-transparent rounded-full animate-spin" /> Sending…</> : `Contribute ${amount || '0'} ${currency}`}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
