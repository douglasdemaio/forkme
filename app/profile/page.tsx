'use client';
import { useTranslation } from 'react-i18next';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { useWalletAuth } from '@/hooks/useWalletAuth';
import { useAppStore } from '@/store/app-store';
import { SUPPORTED_LOCALES } from '@/lib/i18n';
import i18n from '@/lib/i18n';

export default function ProfilePage() {
  const { t } = useTranslation();
  const { connected } = useWallet();
  const { wallet, logout } = useWalletAuth();
  const { role, setRole } = useAppStore();

  const switchLanguage = (code: string) => {
    i18n.changeLanguage(code);
    localStorage.setItem('forkme-lang', code);
  };

  return (
    <div className="page">
      <h1 className="text-2xl font-bold text-white mb-6">{t('profile.title')}</h1>

      {/* Wallet */}
      <div className="bg-dark-900 rounded-2xl p-5 mb-4">
        <p className="text-dark-300 text-sm mb-3">{t('profile.wallet')}</p>
        {connected && wallet ? (
          <div>
            <p className="text-white font-mono text-sm break-all">{wallet}</p>
            <button onClick={logout}
              className="mt-4 w-full py-2.5 bg-red-900/30 border border-red-800 text-red-400 rounded-xl text-sm font-medium hover:bg-red-900/50 transition-colors">
              {t('profile.disconnect')}
            </button>
          </div>
        ) : (
          <WalletMultiButton style={{ width: '100%', borderRadius: '12px', justifyContent: 'center' }} />
        )}
      </div>

      {/* Role */}
      <div className="bg-dark-900 rounded-2xl p-5 mb-4">
        <p className="text-dark-300 text-sm mb-3">{t('profile.role')}</p>
        <div className="grid grid-cols-2 gap-2">
          <button onClick={() => setRole('customer')}
            className={`py-3 rounded-xl text-sm font-medium transition-colors ${
              role === 'customer' ? 'bg-brand-500 text-dark-950' : 'bg-dark-800 text-dark-300 hover:text-white'
            }`}>
            🛒 {t('profile.roleCustomer')}
          </button>
          <button onClick={() => setRole('driver')}
            className={`py-3 rounded-xl text-sm font-medium transition-colors ${
              role === 'driver' ? 'bg-brand-500 text-dark-950' : 'bg-dark-800 text-dark-300 hover:text-white'
            }`}>
            🚴 {t('profile.roleDriver')}
          </button>
        </div>
        {role === 'driver' && (
          <p className="text-dark-400 text-xs mt-3 text-center">Driver tab shows available deliveries. Use bottom nav to switch views.</p>
        )}
      </div>

      {/* Language */}
      <div className="bg-dark-900 rounded-2xl p-5 mb-4">
        <p className="text-dark-300 text-sm mb-3">{t('profile.language')}</p>
        <div className="grid grid-cols-2 gap-2">
          {SUPPORTED_LOCALES.map((loc) => (
            <button key={loc.code} onClick={() => switchLanguage(loc.code)}
              className={`py-2 rounded-xl text-sm transition-colors ${
                i18n.language === loc.code ? 'bg-brand-500/20 text-brand-400 border border-brand-500/30' : 'bg-dark-800 text-dark-300 hover:text-white'
              }`}>
              {loc.name}
            </button>
          ))}
        </div>
      </div>

      {/* Info */}
      <div className="bg-dark-900/50 rounded-2xl p-4 text-center">
        <p className="text-dark-400 text-xs">ForkMe · Decentralized food delivery on Solana</p>
        <p className="text-dark-500 text-xs mt-1">v0.2.0 · Devnet</p>
      </div>
    </div>
  );
}
