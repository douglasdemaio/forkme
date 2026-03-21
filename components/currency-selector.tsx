import { View, Text, TouchableOpacity } from 'react-native';
import { SUPPORTED_TOKENS, type StablecoinToken } from '@/lib/constants';
import { Ionicons } from '@expo/vector-icons';

interface Props {
  selected: StablecoinToken | null;
  onSelect: (token: StablecoinToken) => void;
}

export function CurrencySelector({ selected, onSelect }: Props) {
  return (
    <View>
      <Text className="text-white font-semibold mb-3">Pay with</Text>
      <View className="flex-row gap-3">
        {SUPPORTED_TOKENS.map((token) => {
          const isSelected = selected?.mint === token.mint;
          return (
            <TouchableOpacity
              key={token.mint}
              onPress={() => onSelect(token)}
              className={`flex-1 rounded-2xl p-4 border-2 ${
                isSelected ? 'border-brand-500 bg-dark-800' : 'border-dark-700 bg-dark-900'
              }`}
            >
              <View className="flex-row items-center justify-between">
                <View className="w-10 h-10 rounded-full items-center justify-center bg-dark-700">
                  <Text className="text-white font-bold text-lg">{token.currencySign}</Text>
                </View>
                {isSelected && (
                  <Ionicons name="checkmark-circle" size={20} color="#f9a825" />
                )}
              </View>
              <Text className="text-white font-bold mt-2">{token.symbol}</Text>
              <Text className="text-dark-400 text-xs">{token.name}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}
