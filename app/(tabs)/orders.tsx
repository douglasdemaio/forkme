import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useEffect, useState, useCallback } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useAppStore } from '@/store/app-store';
import { api } from '@/lib/api';
import { getTokenByMint } from '@/lib/constants';
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
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { isConnected } = useAppStore();
  const router = useRouter();

  const load = useCallback(
    async (isRefresh = false) => {
      if (!isConnected) {
        setLoading(false);
        return;
      }
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      try {
        const data = await api.getMyOrders();
        setOrders(data);
      } catch {}
      setLoading(false);
      setRefreshing(false);
    },
    [isConnected]
  );

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return (
      <View className="flex-1 bg-dark-950 items-center justify-center">
        <ActivityIndicator size="large" color="#f9a825" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-dark-950">
      <FlatList
        data={orders}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => load(true)}
            tintColor="#f9a825"
          />
        }
        renderItem={({ item }) => {
          const token = getTokenByMint(item.tokenMint);
          const sym = token?.symbol ?? 'USDC';
          const sign = token?.currencySign ?? '$';

          return (
            <TouchableOpacity
              className="bg-dark-900 rounded-2xl p-4 mb-3"
              onPress={() =>
                router.push({
                  pathname: '/order/[id]',
                  params: { id: item.id },
                })
              }
            >
              <View className="flex-row justify-between items-center">
                <Text className="text-white font-semibold text-lg">
                  {item.restaurant?.name || 'Order'}
                </Text>
                <View
                  className="px-3 py-1 rounded-full"
                  style={{
                    backgroundColor:
                      (STATUS_COLORS[item.status] || '#5c6bc0') + '22',
                  }}
                >
                  <Text
                    style={{
                      color: STATUS_COLORS[item.status] || '#5c6bc0',
                    }}
                    className="text-sm font-medium"
                  >
                    {item.status}
                  </Text>
                </View>
              </View>
              <Text className="text-dark-400 mt-2">
                {sign}
                {(item.foodTotal + item.deliveryFee).toFixed(2)} {sym} •{' '}
                {item.contributions?.length || 0} contributor(s)
              </Text>
              {item.status === 'Created' && (
                <View className="mt-2 bg-dark-800 rounded-full h-2 overflow-hidden">
                  <View
                    className="bg-brand-500 h-full rounded-full"
                    style={{
                      width: `${Math.min(
                        100,
                        (item.escrowFunded / item.escrowTarget) * 100
                      )}%`,
                    }}
                  />
                </View>
              )}
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={
          <View className="items-center mt-16">
            <Ionicons name="receipt-outline" size={48} color="#5c6bc0" />
            <Text className="text-dark-400 mt-4 text-center">
              {isConnected
                ? 'No orders yet'
                : 'Connect your wallet to see orders'}
            </Text>
          </View>
        }
      />
    </View>
  );
}
