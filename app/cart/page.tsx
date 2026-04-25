'use client';
import { useState, useEffect } from 'react';
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
import type { RestaurantData } from '@/lib/types';

export default function CartPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const { connected, publicKey } = useWallet();
  const { authenticate, token } = useWalletAuth();
  const { createOrder } = useEscrow();
  const { cart, cartTotal, cartRestaurantId, updateQty, removeFromCart, clearCart } = useAppStore();

  const [street, setStreet] = useState('');
  const [city, setCity] = useState('');
  const [country, setCountry] = useState('');
  const [restaurant, setRestaurant] = useState<RestaurantData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!cartRestaurantId) return;
    api.getRestaurant(cartRestaurantId).then(setRestaurant).catch(() => {});
  }, [cartRestaurantId]);

  const currency = (restaurant?.currency === 'EURC' ? 'EURC' : 'USDC') as 'USDC' | 'EURC';
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
      let jwt = token;
      if (!jwt) jwt = await authenticate();
      if (!jwt) throw new Error('Authentication failed');

      const tokenMint = currency === 'EURC' ? EURC_MINT.toBase58() : USDC_MINT.toBase58();
      const orderPayload = {
        restaurantId: cartRestaurantId!,
        items: cart.map((i) => ({ menuItemId: i.id, quantity: i.quantity })),
        tokenMint,
        deliveryAddress: [street, city, country].filter(Boolean).join(', ') || undefined,
      };
      let order;
      try {
        order = await api.createOrder(orderPayload);
      } catch (e: any) {
        if (typeof e?.message === 'string' && e.message.startsWith('API 401')) {
          const fresh = await authenticate();
          if (!fresh) throw new Error('Authentication failed');
          order = await api.createOrder(orderPayload);
        } else {
          throw e;
        }
      }

      const rest = order.restaurant;
      if (!rest?.wallet) throw new Error('Restaurant wallet not found');

      const { signature, orderPda } = await createOrder({
        orderId: order.id,
        restaurantWallet: rest.wallet,
        foodAmount: order.foodTotal,
        deliveryAmount: order.deliveryFee,
        currency,
        codeAHash: order.codeAHash || '',
        codeBHash: order.codeBHash || '',
      });

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
                <Image src={item.image} alt={item.name} fill className="object-cover" unoptimized />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-white font-medium truncate">{item.name}</p>
              <p className="text-brand-500 text-sm">{(item.price * item.quantity).toFixed(2)} {currency}</p>
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

      {/* Delivery address */}
      <div className="space-y-2 mb-6">
        <input type="text" value={street} onChange={(e) => setStreet(e.target.value)}
          placeholder={t('cart.street')}
          className="w-full bg-dark-900 border border-dark-800 rounded-xl px-4 py-3 text-white placeholder:text-dark-500 focus:outline-none focus:border-brand-500 transition-colors" />
        <input type="text" value={city} onChange={(e) => setCity(e.target.value)}
          placeholder={t('cart.city')}
          className="w-full bg-dark-900 border border-dark-800 rounded-xl px-4 py-3 text-white placeholder:text-dark-500 focus:outline-none focus:border-brand-500 transition-colors" />
        <input type="text" value={country} onChange={(e) => setCountry(e.target.value)}
          placeholder={t('cart.country')}
          className="w-full bg-dark-900 border border-dark-800 rounded-xl px-4 py-3 text-white placeholder:text-dark-500 focus:outline-none focus:border-brand-500 transition-colors" />
      </div>

      {/* Payment currency — locked to restaurant preference */}
      <div className="flex items-center justify-between bg-dark-900 rounded-xl px-4 py-3 mb-6">
        <span className="text-dark-300 text-sm">{t('cart.currency')}</span>
        <span className="px-3 py-1 bg-brand-500/20 text-brand-400 rounded-full text-sm font-semibold">
          {currency}
        </span>
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
