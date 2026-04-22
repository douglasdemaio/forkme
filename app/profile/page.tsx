'use client';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { useWalletAuth } from '@/hooks/useWalletAuth';
import { useAppStore } from '@/store/app-store';
import { SUPPORTED_LOCALES } from '@/lib/i18n';
import { VEHICLE_TYPES } from '@/lib/constants';
import { api } from '@/lib/api';
import i18n from '@/lib/i18n';

export default function ProfilePage() {
  const { t } = useTranslation();
  const { connected } = useWallet();
  const { wallet, logout, token, authenticate } = useWalletAuth();
  const { role, setRole } = useAppStore();

  const [vehicleType, setVehicleType] = useState<string | null>(null);
  const [savingVehicle, setSavingVehicle] = useState(false);
  const [vehicleSaved, setVehicleSaved] = useState(false);
  const [preferEco, setPreferEco] = useState(false);
  const [savingEco, setSavingEco] = useState(false);
  const [ecoSaved, setEcoSaved] = useState(false);

  useEffect(() => {
    if (!connected || !wallet) return;
    if (role === 'driver') {
      api.getDriverProfile(wallet).then((p) => setVehicleType(p.vehicleType ?? null)).catch(() => {});
    } else {
      api.getCustomerProfile().then((p) => setPreferEco(p.preferEco)).catch(() => {});
    }
  }, [connected, wallet, role]);

  const saveVehicle = async (type: string) => {
    if (!wallet) return;
    setVehicleType(type);
    setSavingVehicle(true);
    setVehicleSaved(false);
    try {
      if (!token) await authenticate();
      await api.updateDriverVehicle(wallet, type);
      setVehicleSaved(true);
      setTimeout(() => setVehicleSaved(false), 2000);
    } catch {} finally { setSavingVehicle(false); }
  };

  const saveEco = async (value: boolean) => {
    setPreferEco(value);
    setSavingEco(true);
    setEcoSaved(false);
    try {
      if (!token) await authenticate();
      await api.updateCustomerProfile({ preferEco: value });
      setEcoSaved(true);
      setTimeout(() => setEcoSaved(false), 2000);
    } catch {} finally { setSavingEco(false); }
  };

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

      {/* Driver: vehicle type */}
      {connected && role === 'driver' && (
        <div className="bg-dark-900 rounded-2xl p-5 mb-4">
          <div className="flex items-center justify-between mb-1">
            <p className="text-dark-300 text-sm">{t('driver.vehicleType')}</p>
            {vehicleSaved && <span className="text-green-400 text-xs">{t('driver.vehicleSaved')} ✓</span>}
            {savingVehicle && <span className="text-dark-400 text-xs">Saving…</span>}
          </div>
          <p className="text-dark-500 text-xs mb-3">{t('driver.vehicleTypeHint')}</p>
          <div className="grid grid-cols-3 gap-2">
            {VEHICLE_TYPES.map((v) => (
              <button
                key={v.value}
                onClick={() => saveVehicle(v.value)}
                disabled={savingVehicle}
                className={`py-3 px-2 rounded-xl text-xs font-medium transition-colors flex flex-col items-center gap-1 ${
                  vehicleType === v.value
                    ? v.eco
                      ? 'bg-green-800/40 border border-green-600/50 text-green-300'
                      : 'bg-brand-500/20 border border-brand-500/40 text-brand-300'
                    : 'bg-dark-800 text-dark-300 hover:text-white'
                }`}>
                <span className="text-xl leading-none">{v.emoji}</span>
                <span>{v.label}</span>
                {v.eco && <span className="text-green-500 text-[10px] leading-none">eco</span>}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Customer: eco preference */}
      {connected && role === 'customer' && (
        <div className="bg-dark-900 rounded-2xl p-5 mb-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-dark-300 text-sm">{t('profile.ecoDelivery')}</p>
              <p className="text-dark-500 text-xs mt-0.5">{t('profile.ecoDeliveryDesc')}</p>
            </div>
            <div className="flex items-center gap-2 ml-4 flex-shrink-0">
              {ecoSaved && <span className="text-green-400 text-xs">✓</span>}
              {savingEco && <span className="text-dark-400 text-xs">…</span>}
              <button
                onClick={() => saveEco(!preferEco)}
                disabled={savingEco}
                className={`relative w-12 h-6 rounded-full transition-colors ${preferEco ? 'bg-green-600' : 'bg-dark-700'}`}>
                <span className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${preferEco ? 'translate-x-7' : 'translate-x-1'}`} />
              </button>
            </div>
          </div>
          {preferEco && (
            <p className="text-green-400 text-xs mt-3">🌿 You prefer eco-friendly delivery</p>
          )}
        </div>
      )}

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
