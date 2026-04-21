'use client';
import Link from 'next/link';
import Image from 'next/image';
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
    { href: '/',        label: t('nav.browse'),   icon: <LogoIcon />,   isLogo: true },
    { href: '/orders',  label: t('nav.orders'),   icon: <ReceiptIcon /> },
    { href: '/driver',  label: t('nav.drive'),    icon: <TruckIcon />   },
    { href: '/profile', label: t('nav.profile'),  icon: <PersonIcon />  },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-dark-950/95 backdrop-blur-md border-t border-dark-800 z-50 pb-safe">
      <div className="flex items-stretch">
        {tabs.map(({ href, label, icon, isLogo }) => {
          const active = pathname === href || (href !== '/' && pathname.startsWith(href));
          return (
            <Link key={href} href={href} className="flex-1 flex flex-col items-center pt-2 pb-3 gap-0.5 relative">
              {active && (
                <span className="absolute top-0 left-1/2 -translate-x-1/2 h-0.5 w-8 rounded-full bg-brand-500" />
              )}
              <div className="relative">
                {isLogo ? (
                  <Image
                    src="/logo.png"
                    alt="ForkMe"
                    width={26}
                    height={26}
                    className={`rounded-lg transition-all ${active ? 'ring-2 ring-brand-500/60 scale-110' : 'opacity-70'}`}
                  />
                ) : (
                  <div className={`w-6 h-6 transition-colors ${active ? 'text-brand-500' : 'text-dark-400'}`}>
                    {icon}
                  </div>
                )}
                {href === '/cart' && cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-brand-500 text-white text-xs font-bold rounded-full w-4 h-4 flex items-center justify-center leading-none">
                    {cartCount}
                  </span>
                )}
              </div>
              <span className={`text-xs font-medium transition-colors ${active ? 'text-brand-500' : 'text-dark-400'}`}>
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

function LogoIcon() {
  return <Image src="/logo.png" alt="" width={24} height={24} className="rounded-lg" />;
}

function ReceiptIcon() {
  return (
    <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
    </svg>
  );
}

function TruckIcon() {
  return (
    <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17a2 2 0 11-4 0 2 2 0 014 0zm10 0a2 2 0 11-4 0 2 2 0 014 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10h10zm0 0h2l3-5h-5v5z" />
    </svg>
  );
}

function PersonIcon() {
  return (
    <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  );
}
