'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { useAppStore } from '@/store/app-store';
import { useEscrow } from '@/hooks/useEscrow';
import { useWalletAuth } from '@/hooks/useWalletAuth';
import { api } from '@/lib/api';
import { USDC_MINT, EURC_MINT } from '@/lib/constants';

export default function CartPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const { connected, publicKey } = useWallet();
  const { authenticate, token } = useWalletAuth();
  const { createOrder } = useEscrow();
  const { cart, cartTotal, cartRestaurantId, updateQty, removeFromCart, clearCart } = useAppStore();

  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [currency, setCurrency] = useState<'USDC' | 'EURC'>('USDC');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const total = cartTotal();

  if (cart.length === 0) {
    return (
      <div className="page flex flex-col items-center justify-center min-h-[60vh] text-center">
        <span className="text-6xl mb-4">🛒</span>
        <p className="text-dark-300 text-lg">{t('cart.empty')}</p>
        <Link href="/" className="mt-6 px-6 py-3 bg-brand-500 text-dark-950 rounded-2xl font-semibold hover:bg-brand-400 transition-colors">
          Browse restaurants
        </Link>
      </div>
    );
  }

  const handleCheckout = async () => {
    if (!connected) return;
    setLoading(true);
    setError(null);
    try {
      // Ensure authenticated
      let jwt = token;
      if (!jwt) jwt = await authenticate();
      if (!jwt) throw new Error('Authentication failed');

      // Create order in forkit-site
      const tokenMint = currency === 'EURC' ? EURC_MINT.toBase58() : USDC_MINT.toBase58();
      const order = await api.createOrder({
        restaurantId: cartRestaurantId!,
        items: cart.map((i) => ({ menuItemId: i.id, quantity: i.quantity })),
        tokenMint,
        deliveryAddress: deliveryAddress || undefined,
      });

      // Fund escrow on-chain
      const restaurant = order.restaurant;
      if (!restaurant?.wallet) throw new Error('Restaurant wallet not found');

      const { signature } = await createOrder({
        orderId: order.id,
        restaurantWallet: restaurant.wallet,
        amount: order.escrowTarget,
        currency,
      });

      // Record contribution
      await api.recordContribution(order.id, {
        wallet: publicKey!.toBase58(),
        amount: order.escrowTarget,
        txSignature: signature,
      });

      clearCart();
      router.push(`/order/${order.id}`);
    } catch (e: any) {
      setError(e.message || t('common.error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => router.back()} className="text-dark-300 hover:text-white transition-colors">←</button>
        <h1 className="text-2xl font-bold text-white">{t('cart.title')}</h1>
      </div>

      {/* Items */}
      <div className="space-y-3 mb-6">
        {cart.map((item) => (
          <div key={item.id} className="flex items-center gap-3 bg-dark-900 rounded-2xl p-3">
            {item.image && (
              <div className="relative w-14 h-14 rounded-xl overflow-hidden flex-shrink-0">
                <Image src={item.image} alt={item.name} fill className="object-cover" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-white font-medium truncate">{item.name}</p>
              <p className="text-brand-500 text-sm">{(item.price * item.quantity).toFixed(2)}</p>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => updateQty(item.id, item.quantity - 1)}
                className="w-7 h-7 rounded-full bg-dark-800 text-white flex items-center justify-center hover:bg-dark-700 transition-colors">
                −
              </button>
              <span className="text-white w-5 text-center text-sm">{item.quantity}</span>
              <button onClick={() => updateQty(item.id, item.quantity + 1)}
                className="w-7 h-7 rounded-full bg-brand-500 text-dark-950 flex items-center justify-center hover:bg-brand-400 transition-colors">
                +
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Options */}
      <div className="space-y-4 mb-6">
        <div>
          <label className="block text-dark-300 text-sm mb-2">{t('cart.deliveryAddress')}</label>
          <input
            type="text"
            value={deliveryAddress}
            onChange={(e) => setDeliveryAddress(e.target.value)}
            placeholder="123 Main St..."
            className="w-full bg-dark-900 border border-dark-800 rounded-xl px-4 py-3 text-white placeholder:text-dark-500 focus:outline-none focus:border-brand-500 transition-colors"
          />
        </div>

        <div>
          <label className="block text-dark-300 text-sm mb-2">{t('cart.currency')}</label>
          <div className="flex gap-2">
            {(['USDC', 'EURC'] as const).map((c) => (
              <button key={c} onClick={() => setCurrency(c)}
                className={`flex-1 py-2 rounded-xl text-sm font-medium transition-colors ${
                  currency === c ? 'bg-brand-500 text-dark-950' : 'bg-dark-900 text-dark-300 hover:text-white'
                }`}>
                {c}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Summary */}
      <div className="bg-dark-900 rounded-2xl p-4 mb-6">
        <div className="flex justify-between text-dark-300 text-sm mb-2">
          <span>Subtotal</span>
          <span className="text-white">{total.toFixed(2)} {currency}</span>
        </div>
        <div className="border-t border-dark-800 pt-2 flex justify-between font-semibold">
          <span className="text-white">{t('cart.total')}</span>
          <span className="text-brand-500">{total.toFixed(2)} {currency}</span>
        </div>
      </div>

      {error && (
        <div className="bg-red-900/30 border border-red-800 rounded-xl px-4 py-3 mb-4">
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}

      {!connected ? (
        <div className="text-center">
          <p className="text-dark-300 text-sm mb-4">{t('cart.connectFirst')}</p>
          <WalletMultiButton style={{ width: '100%', borderRadius: '16px', justifyContent: 'center' }} />
        </div>
      ) : (
        <button
          onClick={handleCheckout}
          disabled={loading}
          className="w-full py-4 bg-brand-500 text-dark-950 rounded-2xl font-bold text-lg hover:bg-brand-400 transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {loading ? (
            <><div className="w-5 h-5 border-2 border-dark-950 border-t-transparent rounded-full animate-spin" /> Processing...</>
          ) : (
            t('cart.checkout')
          )}
        </button>
      )}
    </div>
  );
}
