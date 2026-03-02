import { View, Text, FlatList, TouchableOpacity } from 'react-native';
import { useEffect, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { api } from '@/lib/api';
import type { Order } from '@/lib/types';

export default function IncomingOrdersScreen() {
  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => {
    api.getIncomingOrders().then(setOrders).catch(() => {});
  }, []);

  return (
    <View className="flex-1 bg-dark-950">
      <FlatList
        data={orders}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16 }}
        renderItem={({ item }) => (
          <View className="bg-dark-900 rounded-2xl p-4 mb-3">
            <View className="flex-row justify-between items-center">
              <Text className="text-white font-semibold">
                Order #{item.onChainOrderId?.toString().slice(-6)}
              </Text>
              <Text className="text-brand-500 font-medium">{item.status}</Text>
            </View>
            <Text className="text-dark-400 mt-2">
              {item.items?.map((i) => `${i.quantity}× ${i.name}`).join(', ')}
            </Text>
            <Text className="text-white mt-2 font-bold">{item.foodTotal} USDC</Text>

            {item.status === 'Funded' && (
              <TouchableOpacity
                className="bg-brand-500 rounded-xl py-3 items-center mt-3"
                onPress={() => {
                  // TODO: call accept + mark preparing on-chain
                }}
              >
                <Text className="text-dark-950 font-bold">Accept & Start Preparing</Text>
              </TouchableOpacity>
            )}
            {item.status === 'Preparing' && (
              <TouchableOpacity
                className="bg-green-600 rounded-xl py-3 items-center mt-3"
                onPress={() => {
                  // TODO: call mark_ready_for_pickup on-chain
                }}
              >
                <Text className="text-white font-bold">Mark Ready for Pickup</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
        ListEmptyComponent={
          <View className="items-center mt-16">
            <Ionicons name="storefront-outline" size={48} color="#5c6bc0" />
            <Text className="text-dark-400 mt-4">No incoming orders</Text>
          </View>
        }
      />
    </View>
  );
}
