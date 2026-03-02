import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useWallet } from '@/hooks/useWallet';

export default function ConnectScreen() {
  const { connect } = useWallet();
  const router = useRouter();
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleConnect = async () => {
    setConnecting(true);
    setError(null);
    try {
      await connect();
      router.back();
    } catch (err: any) {
      setError(err.message || 'Failed to connect wallet');
    } finally {
      setConnecting(false);
    }
  };

  return (
    <View className="flex-1 bg-dark-950 items-center justify-center px-8">
      <Ionicons name="wallet-outline" size={80} color="#f9a825" />
      <Text className="text-white text-2xl font-bold mt-6">Connect Your Wallet</Text>
      <Text className="text-dark-300 text-center mt-3">
        Use Phantom, Solflare, or any Solana wallet.{'\n'}
        On Solana Seeker, your built-in wallet works automatically.
      </Text>

      {error && (
        <View className="bg-red-900/30 rounded-xl px-4 py-3 mt-4 w-full">
          <Text className="text-red-400 text-center">{error}</Text>
        </View>
      )}

      <TouchableOpacity
        className="bg-brand-500 rounded-2xl px-8 py-4 mt-8 w-full items-center"
        onPress={handleConnect}
        disabled={connecting}
      >
        {connecting ? (
          <ActivityIndicator color="#0a0e1a" />
        ) : (
          <Text className="text-dark-950 font-bold text-lg">Connect</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity className="mt-4" onPress={() => router.back()}>
        <Text className="text-dark-400">Cancel</Text>
      </TouchableOpacity>
    </View>
  );
}
