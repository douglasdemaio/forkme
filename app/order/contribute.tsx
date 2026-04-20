import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState, useEffect } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useContribute } from '@/hooks/useContribute';
import { api } from '@/lib/api';
import { DEVNET_USDC_MINT } from '@/lib/constants';
import { FundingBar } from '@/components/funding-bar';
import type { FundingProgress } from '@/lib/types';

export default function ContributeScreen() {
  const { orderId, onChainOrderId, shareLink } = useLocalSearchParams<{
    orderId?: string;
    onChainOrderId?: string;
    shareLink?: string;
  }>();
  const router = useRouter();
  const { contribute, loading, error } = useContribute();
  const [amount, setAmount] = useState('');
  const [funding, setFunding] = useState<FundingProgress | null>(null);
  const [success, setSuccess] = useState(false);
  const [resolvedOrderId, setResolvedOrderId] = useState(orderId);
  const [resolvedOnChainId, setResolvedOnChainId] = useState(onChainOrderId);

  useEffect(() => {
    if (shareLink) {
      api.getOrderByShareLink(shareLink).then((order) => {
        setResolvedOrderId(order.id);
        setResolvedOnChainId(order.onChainOrderId);
        setFunding({
          escrowTarget: order.escrowTarget,
          escrowFunded: order.escrowFunded,
          remaining: order.remaining,
          percentFunded: order.percentFunded,
          contributorCount: order.contributions?.length || 0,
          contributions: order.contributions || [],
        });
      });
    } else if (orderId) {
      api.getFundingProgress(orderId).then(setFunding);
    }
  }, [orderId, shareLink]);

  const handleContribute = async () => {
    if (!resolvedOrderId || !resolvedOnChainId || !amount) return;
    try {
      const result = await contribute(
        resolvedOrderId,
        BigInt(resolvedOnChainId),
        DEVNET_USDC_MINT,
        Math.round(parseFloat(amount) * 1_000_000) // USDC has 6 decimals
      );
      setSuccess(true);
      if (result.funded) {
        setTimeout(() => router.back(), 2000);
      }
    } catch {}
  };

  const remaining = funding ? funding.remaining / 1_000_000 : 0;

  if (success) {
    return (
      <View className="flex-1 bg-dark-950 items-center justify-center px-8">
        <Ionicons name="checkmark-circle" size={80} color="#66bb6a" />
        <Text className="text-white text-2xl font-bold mt-4">
          Contribution Sent!
        </Text>
        <Text className="text-dark-300 text-center mt-2">
          Your tokens are in the escrow. Thanks for chipping in!
        </Text>
        <TouchableOpacity
          className="bg-brand-500 rounded-2xl px-8 py-4 mt-6"
          onPress={() => router.back()}
        >
          <Text className="text-dark-950 font-bold">Done</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-dark-950 px-6 pt-8">
      <Text className="text-white text-2xl font-bold">Chip In</Text>
      <Text className="text-dark-300 mt-2">
        Help fund this order. Your contribution goes directly to the
        on-chain escrow.
      </Text>

      {funding && (
        <View className="mt-6">
          <FundingBar
            funded={funding.escrowFunded}
            target={funding.escrowTarget}
          />
          <Text className="text-dark-400 text-sm mt-2">
            {funding.contributorCount} contributor(s) •{' '}
            {remaining.toFixed(2)} USDC remaining
          </Text>
        </View>
      )}

      <View className="mt-6">
        <Text className="text-dark-300 mb-2">Amount (USDC)</Text>
        <TextInput
          className="bg-dark-900 text-white text-2xl font-bold rounded-2xl px-4 py-4"
          placeholder="0.00"
          placeholderTextColor="#5c6bc0"
          keyboardType="decimal-pad"
          value={amount}
          onChangeText={setAmount}
        />

        {/* Quick amounts */}
        <View className="flex-row gap-2 mt-3">
          {[5, 10, 15].map((v) => (
            <TouchableOpacity
              key={v}
              className="flex-1 bg-dark-800 rounded-xl py-3 items-center"
              onPress={() => setAmount(v.toString())}
            >
              <Text className="text-brand-500 font-semibold">
                {v} USDC
              </Text>
            </TouchableOpacity>
          ))}
          {remaining > 0 && (
            <TouchableOpacity
              className="flex-1 bg-dark-800 rounded-xl py-3 items-center"
              onPress={() => setAmount(remaining.toFixed(2))}
            >
              <Text className="text-brand-500 font-semibold">All</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {error && (
        <View className="bg-red-900/30 rounded-xl px-4 py-3 mt-4">
          <Text className="text-red-400 text-center">{error}</Text>
        </View>
      )}

      <TouchableOpacity
        className={`rounded-2xl py-4 items-center mt-8 ${
          loading || !amount ? 'bg-dark-700' : 'bg-brand-500'
        }`}
        onPress={handleContribute}
        disabled={loading || !amount}
      >
        {loading ? (
          <ActivityIndicator color="#0a0e1a" />
        ) : (
          <Text className="text-dark-950 font-bold text-lg">
            Send {amount || '0'} USDC to Escrow
          </Text>
        )}
      </TouchableOpacity>

      <Text className="text-dark-500 text-center text-sm mt-4">
        Funds are held in the smart contract. If the order is cancelled
        {'\n'}or times out, you get a full refund.
      </Text>
    </View>
  );
}
