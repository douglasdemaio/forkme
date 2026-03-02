import { View, Text, FlatList, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useAppStore } from '@/store/app-store';
import type { MenuItem } from '@/lib/types';

export default function MenuScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { cart, addToCart, cartTotal } = useAppStore();
  const router = useRouter();
  const [items, setItems] = useState<MenuItem[]>([]);

  // TODO: fetch menu items from API
  useEffect(() => {}, [id]);

  return (
    <View className="flex-1 bg-dark-950">
      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16 }}
        renderItem={({ item }) => (
          <View className="bg-dark-900 rounded-2xl p-4 mb-3 flex-row justify-between items-center">
            <View className="flex-1 mr-4">
              <Text className="text-white font-semibold">{item.name}</Text>
              <Text className="text-dark-400 text-sm mt-1" numberOfLines={2}>
                {item.description}
              </Text>
              <Text className="text-brand-500 font-bold mt-2">{item.price} USDC</Text>
            </View>
            <TouchableOpacity
              className="bg-brand-500 w-10 h-10 rounded-full items-center justify-center"
              onPress={() => addToCart({ menuItemId: item.id, name: item.name, price: item.price })}
            >
              <Ionicons name="add" size={24} color="#0a0e1a" />
            </TouchableOpacity>
          </View>
        )}
        ListEmptyComponent={
          <Text className="text-dark-400 text-center mt-8">Menu loading...</Text>
        }
      />

      {/* Cart bar */}
      {cart.length > 0 && (
        <View className="bg-dark-900 border-t border-dark-800 px-4 py-4">
          <TouchableOpacity
            className="bg-brand-500 rounded-2xl py-4 items-center flex-row justify-center"
            onPress={() => {
              // TODO: create order flow
            }}
          >
            <Ionicons name="cart" size={20} color="#0a0e1a" />
            <Text className="text-dark-950 font-bold text-lg ml-2">
              Order • {cartTotal().toFixed(2)} USDC
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}
