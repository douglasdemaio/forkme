import { View, Text, FlatList, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useAppStore } from '@/store/app-store';
import type { Order } from '@/lib/types';

const STATUS_COLORS: Record<string, string> = {
  Created: '#9fa8da',
  Funded: '#66bb6a',
  Preparing: '#ffa726',
  ReadyForPickup: '#42a5f5',
  PickedUp: '#ab47bc',
  Delivered: '#26a69a',
  Settled: '#66bb6a',
  Cancelled: '#ef5350',
  Refunded: '#ef5350',
  Disputed: '#ff7043',
};

export default function OrdersScreen() {
  const [orders, setOrders] = useState<Order[]>([]);
  const router = useRouter();

  return (
    <View className="flex-1 bg-dark-950">
      <FlatList
        data={orders}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16 }}
        renderItem={({ item }) => (
          <TouchableOpacity
            className="bg-dark-900 rounded-2xl p-4 mb-3"
            onPress={() => router.push({ pathname: '/order/[id]', params: { id: item.id } })}
          >
            <View className="flex-row justify-between items-center">
              <Text className="text-white font-semibold text-lg">
                {item.restaurant?.name || 'Order'}
              </Text>
              <View
                className="px-3 py-1 rounded-full"
                style={{ backgroundColor: STATUS_COLORS[item.status] + '22' }}
              >
                <Text style={{ color: STATUS_COLORS[item.status] }} className="text-sm font-medium">
                  {item.status}
                </Text>
              </View>
            </View>
            <Text className="text-dark-400 mt-2">
              {item.foodTotal + item.deliveryFee} USDC •{' '}
              {item.contributions?.length || 0} contributor(s)
            </Text>
            {item.status === 'Created' && (
              <View className="mt-2 bg-dark-800 rounded-full h-2 overflow-hidden">
                <View
                  className="bg-brand-500 h-full rounded-full"
                  style={{
                    width: `${Math.min(100, (item.escrowFunded / item.escrowTarget) * 100)}%`,
                  }}
                />
              </View>
            )}
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View className="items-center mt-16">
            <Ionicons name="receipt-outline" size={48} color="#5c6bc0" />
            <Text className="text-dark-400 mt-4 text-center">No orders yet</Text>
          </View>
        }
      />
    </View>
  );
}
