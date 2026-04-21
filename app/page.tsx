'use client';
import { useEffect, useState, useCallback } from 'react';
import Image from 'next/image';
import { useTranslation } from 'react-i18next';
import { RestaurantCard } from '@/components/restaurant-card';
import { api } from '@/lib/api';
import type { RestaurantData } from '@/lib/types';

export default function HomePage() {
  const { t } = useTranslation();
  const [restaurants, setRestaurants] = useState<RestaurantData[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [query, setQuery] = useState('');
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getRestaurants({ limit: 50, search: query || undefined });
      setRestaurants(data);
    } catch (e) {
      setError(t('common.error'));
    } finally {
      setLoading(false);
    }
  }, [query, t]);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="page">
      {/* Hero */}
      <div className="text-center mb-8 pt-2">
        <div className="flex justify-center mb-4">
          <div className="relative">
            <div className="absolute inset-0 rounded-3xl bg-brand-500/30 blur-xl scale-110" />
            <Image
              src="/logo.png"
              alt="ForkMe"
              width={80}
              height={80}
              className="relative rounded-3xl shadow-2xl"
            />
          </div>
        </div>
        <h1 className="text-3xl font-bold text-white tracking-tight">{t('home.title')}</h1>
        <p className="text-dark-300 mt-2 text-sm">{t('home.subtitle')}</p>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          type="text"
          placeholder={t('home.search')}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && setQuery(search)}
          className="w-full bg-dark-900 border border-dark-800 rounded-2xl pl-12 pr-4 py-3 text-white placeholder:text-dark-400 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500/30 transition-all"
        />
        {search && (
          <button
            onClick={() => { setSearch(''); setQuery(''); }}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-dark-400 hover:text-white"
          >
            ✕
          </button>
        )}
      </div>

      {/* Results */}
      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-10 h-10 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : error ? (
        <div className="text-center py-12">
          <p className="text-red-400 mb-4">{error}</p>
          <button onClick={load} className="px-4 py-2 bg-brand-500 text-white rounded-xl font-medium">{t('common.retry')}</button>
        </div>
      ) : restaurants.length === 0 ? (
        <div className="text-center py-16">
          <span className="text-5xl">🍽️</span>
          <p className="text-dark-400 mt-4">{t('home.noResults')}</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {restaurants.map((r) => <RestaurantCard key={r.id} r={r} />)}
        </div>
      )}
    </div>
  );
}
