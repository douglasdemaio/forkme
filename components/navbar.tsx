'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { useAppStore } from '@/store/app-store';
import { useTranslation } from 'react-i18next';

export function Navbar() {
  const { t } = useTranslation();
  const pathname = usePathname();
  const { cartCount } = useAppStore();
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  const count = mounted ? cartCount() : 0;

  const links = [
    { href: '/',         label: t('nav.browse') },
    { href: '/orders',   label: t('nav.orders') },
    { href: '/driver',   label: t('nav.drive')  },
    { href: '/profile',  label: t('nav.profile') },
  ];

  return (
    <nav className="hidden md:flex items-center justify-between px-6 py-3 bg-dark-950 border-b border-dark-800 sticky top-0 z-50">
      <Link href="/" className="text-brand-500 font-bold text-xl tracking-tight">
        🍴 {t('appName')}
      </Link>

      <div className="flex items-center gap-6">
        {links.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className={`text-sm transition-colors ${
              pathname === l.href ? 'text-brand-500 font-medium' : 'text-dark-200 hover:text-white'
            }`}
          >
            {l.label}
          </Link>
        ))}

        <Link href="/cart" className="relative text-dark-200 hover:text-white transition-colors">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          {count > 0 && (
            <span className="absolute -top-2 -right-2 bg-brand-500 text-dark-950 text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
              {count}
            </span>
          )}
        </Link>

        <WalletMultiButton style={{ fontSize: '14px', height: '36px', borderRadius: '12px' }} />
      </div>
    </nav>
  );
}
