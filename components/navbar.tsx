'use client';
import Link from 'next/link';
import Image from 'next/image';
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
    { href: '/',        label: t('nav.browse')  },
    { href: '/orders',  label: t('nav.orders')  },
    { href: '/driver',  label: t('nav.drive')   },
    { href: '/profile', label: t('nav.profile') },
  ];

  return (
    <nav className="hidden md:flex items-center justify-between px-6 py-3 bg-dark-950/90 backdrop-blur-md border-b border-dark-800 sticky top-0 z-50">
      <Link href="/" className="flex items-center gap-2.5 group">
        <Image
          src="/logo.png"
          alt="ForkMe"
          width={34}
          height={34}
          className="rounded-xl ring-1 ring-brand-500/40 group-hover:ring-brand-500/70 transition-all"
        />
        <div className="flex flex-col">
          <span className="text-white font-bold text-lg tracking-tight group-hover:text-brand-500 transition-colors leading-tight">
            {t('appName')}
          </span>
          <span className="text-xs text-dark-400 leading-tight">{t('tagline')}</span>
        </div>
      </Link>

      <div className="flex items-center gap-6">
        {links.map((l) => {
          const active = pathname === l.href;
          return (
            <Link
              key={l.href}
              href={l.href}
              className={`text-sm font-medium transition-colors ${
                active ? 'text-brand-500' : 'text-dark-300 hover:text-white'
              }`}
            >
              {l.label}
            </Link>
          );
        })}

        <Link href="/cart" className="relative text-dark-300 hover:text-white transition-colors">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          {count > 0 && (
            <span className="absolute -top-2 -right-2 bg-brand-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center leading-none">
              {count}
            </span>
          )}
        </Link>

        <WalletMultiButton style={{ fontSize: '14px', height: '36px', borderRadius: '12px' }} />
      </div>
    </nav>
  );
}
