import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { AppWalletProvider } from '@/components/wallet-provider';
import { I18nProvider } from '@/components/i18n-provider';
import { Navbar } from '@/components/navbar';
import { BottomNav } from '@/components/bottom-nav';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'ForkMe — Decentralized Food Delivery',
  description: 'Order food and split the bill with friends on Solana',
  manifest: '/manifest.json',
  icons: { icon: '/logo.png', apple: '/logo.png' },
  appleWebApp: { capable: true, title: 'ForkMe', statusBarStyle: 'black-translucent' },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#FF6B35',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className={inter.className}>
        <AppWalletProvider>
          <I18nProvider>
            <Navbar />
            <main className="min-h-screen bg-dark-950">{children}</main>
            <BottomNav />
          </I18nProvider>
        </AppWalletProvider>
      </body>
    </html>
  );
}
