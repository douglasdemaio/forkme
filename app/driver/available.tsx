import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { api } from '@/lib/api';
import { getTokenByMint } from '@/lib/constants';
import type { Order } from '@/lib/types';

export default function AvailableOrdersScreen() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [accepting, setAccepting] = useState<string | null>(null);
  const router = useRouter();

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    try {
      const data = await api.getAvailableOrders();
      setOrders(data);
    } catch {}
    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleAccept = async (order: Order) => {
    setAccepting(order.id);
    try {
      await api.acceptDelivery(order.id);
      setOrders((prev) => prev.filter((o) => o.id !== order.id));
      router.push({
        pathname: '/driver/delivery',
        params: { orderId: order.id },
      });
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to accept delivery');
    }
    setAccepting(null);
  };

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
          const sign = token?.currencySign ?? '$';
          const sym = token?.symbol ?? 'USDC';
          const isAccepting = accepting === item.id;

          return (
            <View className="bg-dark-900 rounded-2xl p-4 mb-3">
              <Text className="text-white font-semibold text-lg">
                {item.restaurant?.name}
              </Text>
              <View className="flex-row justify-between mt-2">
                <Text className="text-dark-400">
                  {item.items?.length} item(s)
                </Text>
                <Text className="text-brand-500 font-bold">
                  {sign}
                  {item.deliveryFee.toFixed(2)} {sym} delivery
                </Text>
              </View>
              <Text className="text-dark-500 text-sm mt-1">
                Food total: {sign}
                {item.foodTotal.toFixed(2)} {sym}
              </Text>
              <TouchableOpacity
                className={`rounded-xl py-3 items-center mt-3 ${
                  isAccepting ? 'bg-dark-700' : 'bg-brand-500'
                }`}
                onPress={() => handleAccept(item)}
                disabled={isAccepting}
              >
                {isAccepting ? (
                  <ActivityIndicator color="#0a0e1a" />
                ) : (
                  <Text className="text-dark-950 font-bold">
                    Accept Delivery
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          );
        }}
        ListEmptyComponent={
          <View className="items-center mt-16">
            <Ionicons
              name="bicycle-outline"
              size={48}
              color="#5c6bc0"
            />
            <Text className="text-dark-400 mt-4">
              No deliveries available
            </Text>
            <Text className="text-dark-500 text-sm mt-1">
              Pull down to refresh
            </Text>
          </View>
        }
      />
    </View>
  );
}
