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
import { Ionicons } from '@expo/vector-icons';
import { api } from '@/lib/api';
import { getTokenByMint } from '@/lib/constants';
import type { Order } from '@/lib/types';

export default function IncomingOrdersScreen() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    try {
      const data = await api.getIncomingOrders();
      setOrders(data);
    } catch {}
    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handlePrepare = async (order: Order) => {
    setActionLoading(order.id);
    try {
      const updated = await api.markPreparing(order.id);
      setOrders((prev) =>
        prev.map((o) => (o.id === order.id ? { ...o, status: updated.status } : o))
      );
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to update status');
    }
    setActionLoading(null);
  };

  const handleReady = async (order: Order) => {
    setActionLoading(order.id);
    try {
      const updated = await api.markReadyForPickup(order.id);
      setOrders((prev) =>
        prev.map((o) => (o.id === order.id ? { ...o, status: updated.status } : o))
      );
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to update status');
    }
    setActionLoading(null);
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
          const isActionLoading = actionLoading === item.id;

          return (
            <View className="bg-dark-900 rounded-2xl p-4 mb-3">
              <View className="flex-row justify-between items-center">
                <Text className="text-white font-semibold">
                  Order #{item.onChainOrderId?.toString().slice(-6)}
                </Text>
                <Text className="text-brand-500 font-medium">
                  {item.status}
                </Text>
              </View>

              <Text className="text-dark-400 mt-2">
                {item.items
                  ?.map((i) => `${i.quantity}× ${i.name}`)
                  .join(', ')}
              </Text>

              <View className="flex-row justify-between mt-2">
                <Text className="text-white font-bold">
                  {sign}
                  {item.foodTotal.toFixed(2)} {sym}
                </Text>
                <Text className="text-dark-500 text-sm">
                  {new Date(item.createdAt).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </Text>
              </View>

              {/* Code A for pickup verification */}
              {item.codeA &&
                (item.status === 'ReadyForPickup' ||
                  item.status === 'Preparing') && (
                  <View className="bg-dark-800 rounded-xl p-3 mt-3 items-center">
                    <Text className="text-dark-400 text-sm">
                      Pickup Code (show to driver)
                    </Text>
                    <Text className="text-white font-mono text-2xl font-bold tracking-widest mt-1">
                      {item.codeA}
                    </Text>
                  </View>
                )}

              {/* Action buttons */}
              {item.status === 'Funded' && (
                <TouchableOpacity
                  className={`rounded-xl py-3 items-center mt-3 ${
                    isActionLoading ? 'bg-dark-700' : 'bg-brand-500'
                  }`}
                  onPress={() => handlePrepare(item)}
                  disabled={isActionLoading}
                >
                  {isActionLoading ? (
                    <ActivityIndicator color="#0a0e1a" />
                  ) : (
                    <Text className="text-dark-950 font-bold">
                      Accept & Start Preparing
                    </Text>
                  )}
                </TouchableOpacity>
              )}
              {item.status === 'Preparing' && (
                <TouchableOpacity
                  className={`rounded-xl py-3 items-center mt-3 ${
                    isActionLoading ? 'bg-dark-700' : 'bg-green-600'
                  }`}
                  onPress={() => handleReady(item)}
                  disabled={isActionLoading}
                >
                  {isActionLoading ? (
                    <ActivityIndicator color="white" />
                  ) : (
                    <Text className="text-white font-bold">
                      Mark Ready for Pickup
                    </Text>
                  )}
                </TouchableOpacity>
              )}
            </View>
          );
        }}
        ListEmptyComponent={
          <View className="items-center mt-16">
            <Ionicons
              name="storefront-outline"
              size={48}
              color="#5c6bc0"
            />
            <Text className="text-dark-400 mt-4">
              No incoming orders
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
