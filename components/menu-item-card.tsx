'use client';
import Image from 'next/image';
import { useTranslation } from 'react-i18next';
import type { MenuItemData } from '@/lib/types';
import { resolveImageUrl } from '@/lib/constants';

interface Props {
  item: MenuItemData;
  currency: string;
  qty: number;
  expanded: boolean;
  onToggle: () => void;
  onAdd: () => void;
  onRemove: () => void;
}

export function MenuItemCard({ item, currency, qty, expanded, onToggle, onAdd, onRemove }: Props) {
  const { t } = useTranslation();

  const stop = (e: React.MouseEvent | React.KeyboardEvent) => e.stopPropagation();

  const handleRowKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onToggle();
    }
  };

  return (
    <article className={`bg-dark-900 rounded-2xl overflow-hidden ${!item.available ? 'opacity-50' : ''}`}>
      <div
        role="button"
        tabIndex={0}
        aria-expanded={expanded}
        onClick={onToggle}
        onKeyDown={handleRowKeyDown}
        className="flex items-center gap-3 p-3 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40"
      >
        <div className="relative w-14 h-14 rounded-lg overflow-hidden flex-shrink-0 bg-dark-800">
          {item.image && (
            <Image
              src={resolveImageUrl(item.image)!}
              alt={item.name}
              fill
              className="object-cover"
              unoptimized
            />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <h4 className="text-white font-medium truncate">{item.name}</h4>
          {item.description && (
            <p className="text-dark-300 text-sm truncate">{item.description}</p>
          )}
        </div>

        <span className="text-brand-500 font-semibold whitespace-nowrap text-sm">
          {item.price.toFixed(2)} {currency}
        </span>

        {item.available && qty > 0 ? (
          <div className="flex items-center gap-1.5 flex-shrink-0" onClick={stop} onKeyDown={stop}>
            <button
              type="button"
              onClick={onRemove}
              aria-label={t('merchant.removeItem', { defaultValue: 'Remove' })}
              className="w-7 h-7 rounded-full bg-dark-800 text-white flex items-center justify-center hover:bg-dark-700 transition-colors text-base font-bold leading-none"
            >
              −
            </button>
            <span className="text-white font-medium w-5 text-center text-sm">{qty}</span>
            <button
              type="button"
              onClick={onAdd}
              aria-label={t('merchant.addItem', { defaultValue: 'Add' })}
              className="w-7 h-7 rounded-full bg-brand-500 text-dark-950 flex items-center justify-center hover:bg-brand-400 transition-colors text-base font-bold leading-none"
            >
              +
            </button>
          </div>
        ) : item.available ? (
          <button
            type="button"
            onClick={(e) => {
              stop(e);
              onAdd();
            }}
            aria-label={t('merchant.addToCart')}
            className="w-8 h-8 rounded-full bg-brand-500 text-dark-950 flex items-center justify-center text-lg font-bold leading-none hover:bg-brand-400 transition-colors flex-shrink-0"
          >
            +
          </button>
        ) : null}

        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`text-dark-400 transition-transform flex-shrink-0 ${expanded ? 'rotate-180' : ''}`}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </div>

      <div
        className={`grid transition-[grid-template-rows] duration-200 ease-out ${
          expanded ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
        }`}
      >
        <div className="overflow-hidden">
          <div className="px-3 pb-4 border-t border-dark-800">
            <div className="relative aspect-[16/9] max-h-60 mt-3 rounded-lg overflow-hidden bg-dark-800">
              {item.image ? (
                <Image
                  src={resolveImageUrl(item.image)!}
                  alt={item.name}
                  fill
                  className="object-cover"
                  unoptimized
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <span className="text-5xl">🍽️</span>
                </div>
              )}
            </div>

            {item.category && (
              <span className="inline-block mt-3 px-2.5 py-1 bg-brand-900/40 text-brand-300 text-xs font-semibold rounded-full">
                {item.category}
              </span>
            )}

            {item.description && (
              <p className="mt-2 text-sm text-dark-300 leading-relaxed">{item.description}</p>
            )}

            <div className="mt-4">
              {!item.available ? (
                <div className="text-dark-400 text-sm text-center py-2">
                  {t('merchant.unavailable')}
                </div>
              ) : qty > 0 ? (
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={onRemove}
                      className="w-9 h-9 rounded-full bg-dark-800 text-white flex items-center justify-center hover:bg-dark-700 transition-colors text-lg font-bold leading-none"
                    >
                      −
                    </button>
                    <span className="text-white font-semibold w-6 text-center">{qty}</span>
                    <button
                      type="button"
                      onClick={onAdd}
                      className="w-9 h-9 rounded-full bg-brand-500 text-dark-950 flex items-center justify-center hover:bg-brand-400 transition-colors text-lg font-bold leading-none"
                    >
                      +
                    </button>
                  </div>
                  <span className="text-brand-500 font-semibold">
                    {(item.price * qty).toFixed(2)} {currency}
                  </span>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={onAdd}
                  className="w-full py-2.5 px-4 bg-brand-500 text-dark-950 rounded-full text-sm font-semibold hover:bg-brand-400 transition-colors"
                >
                  {t('merchant.addToCart')} · {item.price.toFixed(2)} {currency}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}
