import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAppStore } from '@/store/app-store';
import { useWallet } from '@/hooks/useWallet';

const ROLES = [
  { key: 'customer' as const, label: 'Customer', icon: 'person-outline' as const },
  { key: 'driver' as const, label: 'Driver', icon: 'bicycle-outline' as const },
  { key: 'restaurant' as const, label: 'Restaurant', icon: 'storefront-outline' as const },
];

export default function ProfileScreen() {
  const { walletAddress, role, setRole, isConnected } = useAppStore();
  const { disconnect } = useWallet();
  const router = useRouter();

  if (!isConnected) {
    return (
      <View className="flex-1 bg-dark-950 items-center justify-center px-6">
        <TouchableOpacity
          className="bg-brand-500 rounded-2xl px-8 py-4"
          onPress={() => router.push('/connect')}
        >
          <Text className="text-dark-950 font-bold text-lg">Connect Wallet</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-dark-950 px-4 pt-6">
      {/* Wallet */}
      <View className="bg-dark-900 rounded-2xl p-4">
        <Text className="text-dark-400 text-sm">Connected Wallet</Text>
        <Text className="text-white font-mono mt-1" numberOfLines={1}>
          {walletAddress}
        </Text>
      </View>

      {/* Role selector */}
      <Text className="text-white text-lg font-semibold mt-6 mb-3">Your Role</Text>
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
        <Text className="text-white font-semibold text-lg">Reputation</Text>
        <View className="flex-row items-center mt-2">
          <Ionicons name="shield-checkmark" size={20} color="#66bb6a" />
          <Text className="text-dark-300 ml-2">On-chain reputation loading...</Text>
        </View>
      </View>

      {/* Disconnect */}
      <TouchableOpacity
        className="bg-dark-900 rounded-2xl p-4 mt-6 mb-8 items-center"
        onPress={disconnect}
      >
        <Text className="text-red-400 font-semibold">Disconnect Wallet</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}
