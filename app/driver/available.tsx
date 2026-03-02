import { View, Text, FlatList, TouchableOpacity } from 'react-native';
import { useEffect, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { api } from '@/lib/api';
import type { Order } from '@/lib/types';

export default function AvailableOrdersScreen() {
  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => {
    api.getAvailableOrders().then(setOrders).catch(() => {});
  }, []);

  return (
    <View className="flex-1 bg-dark-950">
      <FlatList
        data={orders}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16 }}
        renderItem={({ item }) => (
          <View className="bg-dark-900 rounded-2xl p-4 mb-3">
            <Text className="text-white font-semibold text-lg">{item.restaurant?.name}</Text>
            <View className="flex-row justify-between mt-2">
              <Text className="text-dark-400">{item.items?.length} items</Text>
              <Text className="text-brand-500 font-bold">{item.deliveryFee} USDC delivery</Text>
            </View>
            <TouchableOpacity
              className="bg-brand-500 rounded-xl py-3 items-center mt-3"
              onPress={async () => {
                try {
                  await api.acceptOrder(item.id);
                  setOrders((prev) => prev.filter((o) => o.id !== item.id));
                } catch {}
              }}
            >
              <Text className="text-dark-950 font-bold">Accept Delivery</Text>
            </TouchableOpacity>
          </View>
        )}
        ListEmptyComponent={
          <View className="items-center mt-16">
            <Ionicons name="bicycle-outline" size={48} color="#5c6bc0" />
            <Text className="text-dark-400 mt-4">No deliveries available</Text>
          </View>
        }
      />
    </View>
  );
}
