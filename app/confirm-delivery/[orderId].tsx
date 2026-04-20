import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { api } from '@/lib/api';
import { useAppStore } from '@/store/app-store';
import type { Order } from '@/lib/types';

// Reached when customer scans the driver's delivery QR.
// Deep link: forkme://confirm-delivery/[orderId]
export default function ConfirmDeliveryScreen() {
  const { orderId } = useLocalSearchParams<{ orderId: string }>();
  const router = useRouter();
  const { walletAddress } = useAppStore();

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [confirming, setConfirming] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!orderId) return;
    api
      .getOrder(orderId)
      .then(setOrder)
      .catch(() => Alert.alert('Error', 'Could not load order.'))
      .finally(() => setLoading(false));
  }, [orderId]);

  const isMyOrder =
    !!walletAddress && !!order && order.customerWallet === walletAddress;

  const handleConfirm = async () => {
    if (!order?.codeB || !orderId) return;
    setConfirming(true);
    try {
      const result = await api.confirmDelivery(orderId, order.codeB);
      if (result.valid) {
        setDone(true);
      } else {
        Alert.alert('Failed', 'Delivery code did not match. Contact support.');
      }
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Confirmation failed.');
    } finally {
      setConfirming(false);
    }
  };

  if (loading) {
    return (
      <View className="flex-1 bg-dark-950 items-center justify-center">
        <ActivityIndicator size="large" color="#f9a825" />
      </View>
    );
  }

  if (!order) {
    return (
      <View className="flex-1 bg-dark-950 items-center justify-center px-8">
        <Ionicons name="alert-circle-outline" size={48} color="#ef4444" />
        <Text className="text-white text-lg font-bold mt-4">Order not found</Text>
        <TouchableOpacity className="mt-6" onPress={() => router.back()}>
          <Text className="text-brand-500">Go back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!isMyOrder) {
    return (
      <View className="flex-1 bg-dark-950 items-center justify-center px-8">
        <Ionicons name="lock-closed-outline" size={48} color="#f9a825" />
        <Text className="text-white text-lg font-bold mt-4 text-center">
          This delivery belongs to a different account
        </Text>
        <TouchableOpacity className="mt-6" onPress={() => router.back()}>
          <Text className="text-brand-500">Go back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (done || order.status === 'Delivered' || order.status === 'Settled') {
    return (
      <View className="flex-1 bg-dark-950 items-center justify-center px-8">
        <View className="w-24 h-24 rounded-full bg-green-900/40 border-3 border-green-500 items-center justify-center mb-6">
          <Ionicons name="checkmark-circle" size={64} color="#4ade80" />
        </View>
        <Text className="text-white text-2xl font-bold text-center">Delivery Confirmed!</Text>
        <Text className="text-gray-400 text-sm mt-2 text-center">
          Your order from {order.restaurant?.name} has been delivered.
          Funds are being released.
        </Text>
        <TouchableOpacity
          className="mt-8 bg-brand-500 rounded-2xl py-3 px-8"
          onPress={() => router.replace(`/order/${orderId}`)}
        >
          <Text className="text-dark-950 font-bold">View Order</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-dark-950 px-6 pt-16">
      <Text className="text-gray-400 text-sm mb-1">Delivery confirmation</Text>
      <Text className="text-white text-2xl font-bold mb-1">
        {order.restaurant?.name}
      </Text>
      <Text className="text-gray-400 text-sm mb-8">
        {order.items?.map((i) => `${i.quantity}× ${i.name}`).join(', ')}
      </Text>

      <View className="bg-dark-900 rounded-2xl p-5 mb-6">
        <View className="flex-row items-center gap-3 mb-3">
          <Ionicons name="bicycle-outline" size={24} color="#f9a825" />
          <Text className="text-white font-semibold text-lg">Driver has arrived</Text>
        </View>
        <Text className="text-gray-400 text-sm leading-relaxed">
          Confirm that you have received your order. This will release payment to the driver.
        </Text>
      </View>

      <TouchableOpacity
        className={`rounded-2xl py-4 items-center ${
          confirming ? 'bg-dark-700' : 'bg-green-600'
        }`}
        onPress={handleConfirm}
        disabled={confirming}
      >
        {confirming ? (
          <ActivityIndicator color="white" />
        ) : (
          <Text className="text-white font-bold text-lg">Confirm Receipt</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        className="mt-4 items-center py-3"
        onPress={() => router.back()}
      >
        <Text className="text-gray-500">Cancel</Text>
      </TouchableOpacity>
    </View>
  );
}
