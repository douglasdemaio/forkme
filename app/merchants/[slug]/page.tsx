'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { MenuItemCard } from '@/components/menu-item-card';
import { api } from '@/lib/api';
import { useAppStore } from '@/store/app-store';
import { resolveImageUrl } from '@/lib/constants';
import type { MerchantData, MenuItemData } from '@/lib/types';

export default function MerchantPage() {
  const { slug } = useParams<{ slug: string }>();
  const router = useRouter();
  const { t } = useTranslation();
  const { cart, addToCart, removeFromCart, cartMerchantId, cartCount } = useAppStore();

  const [merchant, setMerchant] = useState<MerchantData | null>(null);
  const [menu, setMenu] = useState<MenuItemData[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<string>('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const r = await api.getMerchant(slug);
        setMerchant(r);
        const m = await api.getMenu(r.id);
        const sorted = [...m].sort((a, b) => a.sortOrder - b.sortOrder);
        setMenu(sorted);
        if (sorted.length) setActiveCategory(sorted[0].category || '');
      } catch {
        router.push('/');
      } finally {
        setLoading(false);
      }
    })();
  }, [slug, router]);

  if (loading || !merchant) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="w-10 h-10 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const categories = [...new Set(menu.map((i) => i.category).filter(Boolean))];
  const getQty = (id: string) => cart.find((c) => c.id === id)?.quantity ?? 0;
  const count = cartCount();

  return (
    <div className="max-w-2xl mx-auto pb-32 md:pb-8">
      {/* Banner */}
      <div className="relative h-48 md:h-64 w-full">
        {merchant.banner ? (
          <Image src={resolveImageUrl(merchant.banner)!} alt={merchant.name} fill className="object-cover" unoptimized />
        ) : (
          <div className="h-full bg-gradient-to-br from-dark-800 to-dark-700 flex items-center justify-center">
            <span className="text-6xl">🍴</span>
          </div>
        )}
        <button onClick={() => router.back()}
          className="absolute top-4 left-4 w-9 h-9 bg-dark-950/80 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-dark-900 transition-colors">
          ←
        </button>
      </div>

      <div className="px-4 pt-4">
        {/* Merchant info */}
        <div className="flex items-start gap-4">
          {merchant.logo && (
            <div className="relative w-16 h-16 rounded-2xl overflow-hidden flex-shrink-0 -mt-8 ring-4 ring-dark-950">
              <Image src={resolveImageUrl(merchant.logo)!} alt="" fill className="object-cover" unoptimized />
            </div>
          )}
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-white">{merchant.name}</h1>
            {merchant.description && <p className="text-dark-300 text-sm mt-1">{merchant.description}</p>}
            <div className="flex gap-3 mt-2 text-sm text-dark-400">
              <span>{merchant.currency}</span>
              {merchant.deliveryFee > 0 && <span>+{merchant.deliveryFee.toFixed(2)} {t('merchant.deliveryFee')}</span>}
            </div>
          </div>
        </div>

        {/* Featured slot reserved for promoted item (follow-up spec) */}
        <div data-featured-slot aria-hidden="true" />

        {/* Category tabs */}
        {categories.length > 1 && (
          <div className="flex gap-2 mt-6 overflow-x-auto pb-1 no-scrollbar">
            {categories.map((cat) => (
              <button key={cat} onClick={() => setActiveCategory(cat)}
                className={`flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  activeCategory === cat ? 'bg-brand-500 text-dark-950' : 'bg-dark-900 text-dark-300 hover:text-white'
                }`}>
                {cat}
              </button>
            ))}
          </div>
        )}

        {/* Menu */}
        <div className="mt-6 space-y-3">
          {(activeCategory
            ? menu.filter((i) => i.category === activeCategory)
            : menu
          ).map((item) => (
            <MenuItemCard
              key={item.id}
              item={item}
              currency={merchant.currency}
              qty={getQty(item.id)}
              expanded={expandedId === item.id}
              onToggle={() =>
                setExpandedId((prev) => (prev === item.id ? null : item.id))
              }
              onAdd={() => addToCart(item, merchant.id)}
              onRemove={() => {
                const qty = getQty(item.id);
                if (qty > 1) {
                  useAppStore.getState().updateQty(item.id, qty - 1);
                } else {
                  removeFromCart(item.id);
                }
              }}
            />
          ))}
        </div>
      </div>

      {/* Cart CTA */}
      {count > 0 && cartMerchantId === merchant.id && (
        <div className="fixed bottom-16 md:bottom-4 left-0 right-0 px-4">
          <Link href="/cart"
            className="flex items-center justify-between bg-brand-500 text-dark-950 rounded-2xl px-6 py-4 shadow-xl hover:bg-brand-400 transition-colors">
            <span className="font-bold">{count} items in cart</span>
            <span className="font-bold">View cart →</span>
          </Link>
        </div>
      )}
    </div>
  );
}
