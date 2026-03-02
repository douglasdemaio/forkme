import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface TrustBadgeProps {
  rating: number; // 1-5
  totalOrders: number;
  walletAddress: string;
}

export function TrustBadge({ rating, totalOrders, walletAddress }: TrustBadgeProps) {
  const tier =
    totalOrders >= 100 ? 'gold' : totalOrders >= 25 ? 'silver' : 'bronze';
  const tierColor = { gold: '#f9a825', silver: '#b0bec5', bronze: '#8d6e63' }[tier];

  return (
    <View className="flex-row items-center bg-dark-900 rounded-xl px-3 py-2">
      <Ionicons name="shield-checkmark" size={18} color={tierColor} />
      <View className="ml-2">
        <View className="flex-row items-center">
          {Array.from({ length: 5 }).map((_, i) => (
            <Ionicons
              key={i}
              name={i < Math.round(rating) ? 'star' : 'star-outline'}
              size={12}
              color="#f9a825"
            />
          ))}
          <Text className="text-dark-400 text-xs ml-1">({totalOrders})</Text>
        </View>
        <Text className="text-dark-500 text-xs font-mono">
          {walletAddress.slice(0, 4)}...{walletAddress.slice(-4)}
        </Text>
      </View>
    </View>
  );
}
