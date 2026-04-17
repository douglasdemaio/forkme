import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { api } from '@/lib/api';
import { getTokenByMint, explorerTxUrl } from '@/lib/constants';
import type { Order } from '@/lib/types';
import { Linking } from 'react-native';

export default function DeliveryScreen() {
  const { orderId } = useLocalSearchParams<{ orderId: string }>();
  const router = useRouter();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [codeInput, setCodeInput] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [settleTx, setSettleTx] = useState<string | null>(null);

  useEffect(() => {
    if (!orderId) return;
    api
      .getOrder(orderId)
      .then(setOrder)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [orderId]);

  const handleVerifyPickup = async () => {
    if (!orderId || !codeInput.trim()) return;
    setVerifying(true);
    try {
      const result = await api.verifyPickup(orderId, codeInput.trim());
      if (result.valid) {
        Alert.alert('Verified!', 'Pickup code confirmed. Deliver the order now.');
        setCodeInput('');
        // Refresh order to get updated status
        const updated = await api.getOrder(orderId);
        setOrder(updated);
      } else {
        Alert.alert('Invalid Code', 'The pickup code does not match.');
      }
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Verification failed');
    }
    setVerifying(false);
  };

  const handleConfirmDelivery = async () => {
    if (!orderId || !codeInput.trim()) return;
    setVerifying(true);
    try {
      const result = await api.confirmDelivery(orderId, codeInput.trim());
      if (result.valid) {
        setSettleTx(result.settleTxSignature || null);
        const updated = await api.getOrder(orderId);
        setOrder(updated);
        Alert.alert(
          'Delivery Complete!',
          'Funds have been released. You will receive your payment shortly.'
        );
      } else {
        Alert.alert('Invalid Code', 'The delivery code does not match.');
      }
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Delivery confirmation failed');
    }
    setVerifying(false);
  };

  if (loading || !order) {
    return (
      <View className="flex-1 bg-dark-950 items-center justify-center">
        <ActivityIndicator size="large" color="#f9a825" />
      </View>
    );
  }

  const token = getTokenByMint(order.tokenMint);
  const sign = token?.currencySign ?? '$';
  const sym = token?.symbol ?? 'USDC';
  const isPickedUp = order.status === 'PickedUp';
  const isSettled = order.status === 'Settled' || order.status === 'Delivered';

  return (
    <ScrollView className="flex-1 bg-dark-950 px-4 pt-6">
      {/* Order summary */}
      <View className="bg-dark-900 rounded-2xl p-4 mb-4">
        <Text className="text-white text-xl font-bold">
          {order.restaurant?.name}
        </Text>
        <Text className="text-brand-500 font-semibold mt-1">
          {order.status}
        </Text>
        <Text className="text-dark-400 mt-2">
          {order.items?.map((i) => `${i.quantity}× ${i.name}`).join(', ')}
        </Text>
        <View className="flex-row justify-between mt-3">
          <Text className="text-dark-300">Delivery fee</Text>
          <Text className="text-brand-500 font-bold">
            {sign}
            {order.deliveryFee.toFixed(2)} {sym}
          </Text>
        </View>
      </View>

      {/* Step 1: Verify pickup */}
      {order.status === 'ReadyForPickup' && (
        <View className="bg-dark-900 rounded-2xl p-4 mb-4">
          <View className="flex-row items-center gap-2 mb-3">
            <View className="bg-brand-500 w-8 h-8 rounded-full items-center justify-center">
              <Text className="text-dark-950 font-bold">1</Text>
            </View>
            <Text className="text-white font-semibold text-lg">
              Verify Pickup (Code A)
            </Text>
          </View>
          <Text className="text-dark-300 mb-3">
            Ask the restaurant for Code A and enter it here.
          </Text>
          <TextInput
            className="bg-dark-800 text-white text-center text-2xl font-mono rounded-xl px-4 py-4 tracking-widest"
            placeholder="Enter Code A"
            placeholderTextColor="#5c6bc0"
            value={codeInput}
            onChangeText={setCodeInput}
            autoCapitalize="characters"
            maxLength={8}
          />
          <TouchableOpacity
            className={`rounded-xl py-3 items-center mt-3 ${
              verifying || !codeInput ? 'bg-dark-700' : 'bg-brand-500'
            }`}
            onPress={handleVerifyPickup}
            disabled={verifying || !codeInput}
          >
            {verifying ? (
              <ActivityIndicator color="#0a0e1a" />
            ) : (
              <Text className="text-dark-950 font-bold">
                Verify Pickup
              </Text>
            )}
          </TouchableOpacity>
        </View>
      )}

      {/* Step 2: Confirm delivery */}
      {isPickedUp && !isSettled && (
        <View className="bg-dark-900 rounded-2xl p-4 mb-4">
          <View className="flex-row items-center gap-2 mb-3">
            <View className="bg-green-600 w-8 h-8 rounded-full items-center justify-center">
              <Text className="text-white font-bold">2</Text>
            </View>
            <Text className="text-white font-semibold text-lg">
              Confirm Delivery (Code B)
            </Text>
          </View>
          <Text className="text-dark-300 mb-3">
            The customer will show you Code B. Enter it to complete
            delivery and trigger settlement.
          </Text>
          <TextInput
            className="bg-dark-800 text-white text-center text-2xl font-mono rounded-xl px-4 py-4 tracking-widest"
            placeholder="Enter Code B"
            placeholderTextColor="#5c6bc0"
            value={codeInput}
            onChangeText={setCodeInput}
            autoCapitalize="characters"
            maxLength={8}
          />
          <TouchableOpacity
            className={`rounded-xl py-3 items-center mt-3 ${
              verifying || !codeInput ? 'bg-dark-700' : 'bg-green-600'
            }`}
            onPress={handleConfirmDelivery}
            disabled={verifying || !codeInput}
          >
            {verifying ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text className="text-white font-bold">
                Confirm Delivery
              </Text>
            )}
          </TouchableOpacity>
        </View>
      )}

      {/* Settlement complete */}
      {isSettled && (
        <View className="bg-green-900/30 border border-green-600 rounded-2xl p-4 mb-4">
          <View className="flex-row items-center gap-2 mb-2">
            <Ionicons
              name="checkmark-circle"
              size={24}
              color="#66bb6a"
            />
            <Text className="text-green-400 font-bold text-lg">
              Delivery Complete
            </Text>
          </View>
          <Text className="text-green-200">
            Funds have been released from escrow. Your payment of{' '}
            {sign}
            {order.deliveryFee.toFixed(2)} {sym} is on its way.
          </Text>
          {(settleTx || order.settleTxSignature) && (
            <TouchableOpacity
              className="flex-row items-center gap-1 mt-3"
              onPress={() =>
                Linking.openURL(
                  explorerTxUrl(
                    (settleTx || order.settleTxSignature)!
                  )
                )
              }
            >
              <Ionicons name="open-outline" size={14} color="#60a5fa" />
              <Text className="text-blue-400 text-sm">
                View on Solana Explorer
              </Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      <View className="h-8" />
    </ScrollView>
  );
}
