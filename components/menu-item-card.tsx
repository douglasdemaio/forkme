'use client';
import Image from 'next/image';
import { useTranslation } from 'react-i18next';
import type { MenuItemData } from '@/lib/types';
import { resolveImageUrl } from '@/lib/constants';

interface Props {
  item: MenuItemData;
  currency: string;
  qty: number;
  onAdd: () => void;
  onRemove: () => void;
}

export function MenuItemCard({ item, currency, qty, onAdd, onRemove }: Props) {
  const { t } = useTranslation();

  return (
    <div className={`flex gap-4 bg-dark-900 rounded-2xl p-4 ${!item.available ? 'opacity-50' : ''}`}>
      {item.image && (
        <div className="relative w-20 h-20 rounded-xl overflow-hidden flex-shrink-0">
          <Image src={resolveImageUrl(item.image)!} alt={item.name} fill className="object-cover" unoptimized />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <h4 className="text-white font-medium">{item.name}</h4>
        {item.description && <p className="text-dark-300 text-sm mt-0.5 line-clamp-2">{item.description}</p>}
        {item.category && <span className="text-xs text-dark-400 mt-1 block">{item.category}</span>}
        <div className="flex items-center justify-between mt-3">
          <span className="text-brand-500 font-semibold">{item.price.toFixed(2)} {currency}</span>
          {!item.available ? (
            <span className="text-dark-400 text-xs">{t('restaurant.unavailable')}</span>
          ) : qty > 0 ? (
            <div className="flex items-center gap-2">
              <button onClick={onRemove}
                className="w-8 h-8 rounded-full bg-dark-800 text-white flex items-center justify-center hover:bg-dark-700 transition-colors text-lg font-bold">
                −
              </button>
              <span className="text-white font-medium w-5 text-center">{qty}</span>
              <button onClick={onAdd}
                className="w-8 h-8 rounded-full bg-brand-500 text-dark-950 flex items-center justify-center hover:bg-brand-400 transition-colors text-lg font-bold">
                +
              </button>
            </div>
          ) : (
            <button onClick={onAdd}
              className="px-4 py-1.5 bg-brand-500 text-dark-950 rounded-full text-sm font-semibold hover:bg-brand-400 transition-colors">
              {t('restaurant.addToCart')}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
