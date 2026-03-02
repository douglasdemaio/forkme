import { View, Text } from 'react-native';

interface FundingBarProps {
  funded: number;
  target: number;
}

export function FundingBar({ funded, target }: FundingBarProps) {
  const percent = target > 0 ? Math.min(100, (funded / target) * 100) : 0;
  const isFull = percent >= 100;

  return (
    <View>
      <View className="flex-row justify-between mb-1">
        <Text className="text-dark-400 text-sm">
          {(funded / 1_000_000).toFixed(2)} / {(target / 1_000_000).toFixed(2)} USDC
        </Text>
        <Text className={`text-sm font-semibold ${isFull ? 'text-green-400' : 'text-brand-500'}`}>
          {percent.toFixed(0)}%
        </Text>
      </View>
      <View className="bg-dark-800 rounded-full h-3 overflow-hidden">
        <View
          className={`h-full rounded-full ${isFull ? 'bg-green-500' : 'bg-brand-500'}`}
          style={{ width: `${percent}%` }}
        />
      </View>
      {isFull && (
        <Text className="text-green-400 text-sm mt-1 font-semibold">✓ Fully funded</Text>
      )}
    </View>
  );
}
