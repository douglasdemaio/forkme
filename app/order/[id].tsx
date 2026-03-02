import { View, Text, ScrollView, TouchableOpacity, Share } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { api } from '@/lib/api';
import { useAppStore } from '@/store/app-store';
import { useOrderTracking } from '@/hooks/useOrderTracking';
import { FundingBar } from '@/components/funding-bar';
import { DeliveryCode } from '@/components/delivery-code';
import type { Order } from '@/lib/types';

export default function OrderDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const { walletAddress, setActiveOrder } = useAppStore();
  const router = useRouter();
  useOrderTracking(id);

  useEffect(() => {
    if (id) {
      api.getOrder(id).then((o) => {
        setOrder(o);
        setActiveOrder(o);
      });
    }
  }, [id]);

  if (!order) {
    return (
      <View className="flex-1 bg-dark-950 items-center justify-center">
        <Text className="text-dark-400">Loading order...</Text>
      </View>
    );
  }

  const isCreator = order.restaurant && walletAddress;
  const isFunding = order.status === 'Created';
  const isSettled = order.status === 'Settled';

  const handleShare = async () => {
    try {
      let link = order.shareLink;
      if (!link) {
        const result = await api.generateShareLink(order.id);
        link = result.shareLink;
      }
      await Share.share({
        message: `Help me pay for food! Chip in here: forkme://contribute/${link}`,
        url: `forkme://contribute/${link}`,
      });
    } catch {}
  };

  return (
    <ScrollView className="flex-1 bg-dark-950 px-4 pt-4">
      {/* Restaurant & Status */}
      <View className="bg-dark-900 rounded-2xl p-4">
        <Text className="text-white text-xl font-bold">{order.restaurant?.name}</Text>
        <Text className="text-brand-500 mt-1 font-semibold">{order.status}</Text>
      </View>

      {/* Items */}
      <View className="bg-dark-900 rounded-2xl p-4 mt-3">
        <Text className="text-white font-semibold mb-2">Items</Text>
        {order.items?.map((item, idx) => (
          <View key={idx} className="flex-row justify-between py-1">
            <Text className="text-dark-300">
              {item.quantity}× {item.name}
            </Text>
            <Text className="text-white">{(item.price * item.quantity).toFixed(2)} USDC</Text>
          </View>
        ))}
        <View className="border-t border-dark-700 mt-2 pt-2">
          <View className="flex-row justify-between">
            <Text className="text-dark-400">Delivery</Text>
            <Text className="text-white">{order.deliveryFee} USDC</Text>
          </View>
          <View className="flex-row justify-between mt-1">
            <Text className="text-white font-bold">Total</Text>
            <Text className="text-white font-bold">
              {order.foodTotal + order.deliveryFee} USDC
            </Text>
          </View>
        </View>
      </View>

      {/* Funding Progress */}
      <View className="bg-dark-900 rounded-2xl p-4 mt-3">
        <Text className="text-white font-semibold mb-2">Funding</Text>
        <FundingBar funded={order.escrowFunded} target={order.escrowTarget} />
        <Text className="text-dark-400 text-sm mt-2">
          {order.contributions?.length || 0} contributor(s) •{' '}
          {order.escrowFunded}/{order.escrowTarget} USDC
        </Text>

        {/* Contributor list */}
        {order.contributions?.map((c, idx) => (
          <View key={idx} className="flex-row justify-between mt-2">
            <Text className="text-dark-300 font-mono text-sm">{c.wallet}</Text>
            <Text className="text-white">{c.amount} USDC</Text>
          </View>
        ))}
      </View>

      {/* Actions */}
      {isFunding && (
        <View className="flex-row gap-3 mt-3">
          <TouchableOpacity
            className="flex-1 bg-brand-500 rounded-2xl py-4 items-center"
            onPress={() =>
              router.push({
                pathname: '/order/contribute',
                params: { orderId: order.id, onChainOrderId: order.onChainOrderId },
              })
            }
          >
            <Text className="text-dark-950 font-bold">Chip In</Text>
          </TouchableOpacity>
          <TouchableOpacity
            className="flex-1 bg-dark-800 rounded-2xl py-4 items-center flex-row justify-center"
            onPress={handleShare}
          >
            <Ionicons name="share-outline" size={18} color="#f9a825" />
            <Text className="text-brand-500 font-bold ml-2">Share</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Delivery Codes — only for order creator */}
      {isCreator && order.codeA && (
        <View className="mt-3">
          <DeliveryCode label="Pickup Code (A)" code={order.codeA} />
        </View>
      )}
      {isCreator && order.codeB && (
        <View className="mt-3 mb-8">
          <DeliveryCode label="Delivery Code (B)" code={order.codeB} />
        </View>
      )}

      <View className="h-8" />
    </ScrollView>
  );
}
