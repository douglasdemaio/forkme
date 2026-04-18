import { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useAppStore } from '@/store/app-store';
import { useWallet } from '@/hooks/useWallet';
import LanguagePicker from '@/components/language-picker';

const ROLE_ICONS = {
  customer: 'person-outline' as const,
  driver: 'bicycle-outline' as const,
  restaurant: 'storefront-outline' as const,
};

export default function ProfileScreen() {
  const { walletAddress, role, setRole, isConnected } = useAppStore();
  const { disconnect } = useWallet();
  const router = useRouter();
  const { t } = useTranslation();
  const [showLangPicker, setShowLangPicker] = useState(false);

  const ROLES = [
    { key: 'customer' as const, label: t('roles.customer'), icon: ROLE_ICONS.customer },
    { key: 'driver' as const, label: t('roles.driver'), icon: ROLE_ICONS.driver },
    { key: 'restaurant' as const, label: t('roles.restaurant'), icon: ROLE_ICONS.restaurant },
  ];

  if (!isConnected) {
    return (
      <View className="flex-1 bg-dark-950 items-center justify-center px-6">
        <TouchableOpacity
          className="bg-brand-500 rounded-2xl px-8 py-4"
          onPress={() => router.push('/connect')}
        >
          <Text className="text-dark-950 font-bold text-lg">{t('common.connectWallet')}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-dark-950 px-4 pt-6">
      {/* Wallet */}
      <View className="bg-dark-900 rounded-2xl p-4">
        <Text className="text-dark-400 text-sm">{t('profile.connectedWallet')}</Text>
        <Text className="text-white font-mono mt-1" numberOfLines={1}>
          {walletAddress}
        </Text>
      </View>

      {/* Role selector */}
      <Text className="text-white text-lg font-semibold mt-6 mb-3">{t('profile.yourRole')}</Text>
      <View className="flex-row gap-3">
        {ROLES.map((r) => (
          <TouchableOpacity
            key={r.key}
            className={`flex-1 rounded-2xl p-4 items-center ${
              role === r.key ? 'bg-brand-500' : 'bg-dark-900'
            }`}
            onPress={() => setRole(r.key)}
          >
            <Ionicons
              name={r.icon}
              size={28}
              color={role === r.key ? '#0a0e1a' : '#9fa8da'}
            />
            <Text
              className={`mt-2 font-semibold ${
                role === r.key ? 'text-dark-950' : 'text-dark-300'
              }`}
            >
              {r.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Trust Badge placeholder */}
      <View className="bg-dark-900 rounded-2xl p-4 mt-6">
        <Text className="text-white font-semibold text-lg">{t('profile.reputation')}</Text>
        <View className="flex-row items-center mt-2">
          <Ionicons name="shield-checkmark" size={20} color="#66bb6a" />
          <Text className="text-dark-300 ml-2">{t('profile.reputationLoading')}</Text>
        </View>
      </View>

      {/* Language */}
      <TouchableOpacity
        className="bg-dark-900 rounded-2xl p-4 mt-6 flex-row items-center justify-between"
        onPress={() => setShowLangPicker(true)}
      >
        <View className="flex-row items-center">
          <Ionicons name="language" size={22} color="#9fa8da" />
          <Text className="text-white font-semibold ml-3">{t('profile.language')}</Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color="#9fa8da" />
      </TouchableOpacity>

      <LanguagePicker visible={showLangPicker} onClose={() => setShowLangPicker(false)} />

      {/* Disconnect */}
      <TouchableOpacity
        className="bg-dark-900 rounded-2xl p-4 mt-6 mb-8 items-center"
        onPress={disconnect}
      >
        <Text className="text-red-400 font-semibold">{t('common.disconnectWallet')}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}
