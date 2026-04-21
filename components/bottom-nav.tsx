'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAppStore } from '@/store/app-store';

export function BottomNav() {
  const { t } = useTranslation();
  const pathname = usePathname();
  const rawCartCount = useAppStore((s) => s.cartCount());
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  const cartCount = mounted ? rawCartCount : 0;

  const tabs = [
    { href: '/',        label: t('nav.browse'),  icon: HomeIcon   },
    { href: '/orders',  label: t('nav.orders'),  icon: ReceiptIcon },
    { href: '/driver',  label: t('nav.drive'),   icon: BikeIcon   },
    { href: '/profile', label: t('nav.profile'), icon: PersonIcon },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-dark-950 border-t border-dark-800 z-50">
      <div className="flex">
        {tabs.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || (href !== '/' && pathname.startsWith(href));
          return (
            <Link key={href} href={href} className="flex-1 flex flex-col items-center py-2 gap-0.5">
              <div className="relative">
                <Icon className={`w-6 h-6 ${active ? 'text-brand-500' : 'text-dark-300'}`} />
                {href === '/cart' && cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-brand-500 text-dark-950 text-xs font-bold rounded-full w-4 h-4 flex items-center justify-center">
                    {cartCount}
                  </span>
                )}
              </div>
              <span className={`text-xs ${active ? 'text-brand-500 font-medium' : 'text-dark-400'}`}>{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

function HomeIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
    </svg>
  );
}
function ReceiptIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
    </svg>
  );
}
function BikeIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m0 14v1M4.93 4.93l.707.707m12.728 12.728l.707.707M1 12h1m20 0h1M4.93 19.07l.707-.707m12.728-12.728l.707-.707M12 7a5 5 0 100 10A5 5 0 0012 7z" />
    </svg>
  );
}
function PersonIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  );
}
