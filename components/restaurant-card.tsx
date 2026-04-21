import Link from 'next/link';
import Image from 'next/image';
import type { RestaurantData } from '@/lib/types';

export function RestaurantCard({ r }: { r: RestaurantData }) {
  const accentColor = r.colorPrimary ?? undefined;
  const address = [r.addressStreet, r.addressCity, r.addressCountry].filter(Boolean).join(', ');

  return (
    <Link href={`/restaurants/${r.slug}`}
      className="block bg-dark-900 rounded-2xl overflow-hidden hover:ring-1 hover:ring-brand-500/40 transition-all">
      {r.banner ? (
        <div className="relative h-32 w-full">
          <Image src={r.banner} alt={r.name} fill className="object-cover" unoptimized />
        </div>
      ) : (
        <div
          className="h-32 w-full bg-gradient-to-br from-dark-800 to-dark-700 flex items-center justify-center"
          style={accentColor ? { background: `linear-gradient(135deg, ${accentColor}44, ${accentColor}11)` } : undefined}>
          <span className="text-4xl">🍴</span>
        </div>
      )}
      <div className="p-4">
        <div className="flex items-start gap-3">
          {r.logo ? (
            <div className="relative w-10 h-10 rounded-full overflow-hidden flex-shrink-0 -mt-7 ring-2 ring-dark-900">
              <Image src={r.logo} alt="" fill className="object-cover" unoptimized />
            </div>
          ) : (
            <div
              className="w-10 h-10 rounded-full flex-shrink-0 -mt-7 ring-2 ring-dark-900 flex items-center justify-center text-lg font-bold text-white"
              style={{ backgroundColor: accentColor ?? '#1e1e38' }}>
              {r.name.charAt(0).toUpperCase()}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h3 className="text-white font-semibold truncate">{r.name}</h3>
            {r.description && <p className="text-dark-300 text-sm mt-0.5 line-clamp-2">{r.description}</p>}
            {address && <p className="text-dark-500 text-xs mt-1 truncate">📍 {address}</p>}
          </div>
        </div>
        <div className="flex items-center gap-3 mt-3 text-sm">
          <span className="text-dark-400">{r.currency}</span>
          {r.deliveryFee > 0 && (
            <span className="text-dark-400">+{r.deliveryFee.toFixed(2)} delivery</span>
          )}
          {r.menuItems && (
            <span className="text-dark-500 ml-auto">{r.menuItems.length} items</span>
          )}
        </div>
      </div>
    </Link>
  );
}
