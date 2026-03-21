import { View, Text, TouchableOpacity, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { explorerTxUrl } from '@/lib/constants';
import type { OrderReceipt } from '@/lib/types';

interface Props {
  receipt: OrderReceipt;
}

function Line({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <View className="flex-row justify-between py-1.5">
      <View>
        <Text className="text-dark-300">{label}</Text>
        {sub && <Text className="text-dark-500 text-xs">{sub}</Text>}
      </View>
      <Text className="text-white">{value}</Text>
    </View>
  );
}

export function PaymentReceipt({ receipt }: Props) {
  const s = receipt.currencySign;

  const openExplorer = () => {
    if (receipt.settleTxSignature) {
      Linking.openURL(explorerTxUrl(receipt.settleTxSignature));
    }
  };

  return (
    <View className="bg-dark-900 rounded-2xl p-4">
      <View className="flex-row items-center gap-2 mb-3">
        <Ionicons name="receipt-outline" size={18} color="#f9a825" />
        <Text className="text-white font-semibold">Receipt</Text>
      </View>

      {/* Items */}
      {receipt.items.map((item, idx) => (
        <Line
          key={idx}
          label={`${item.quantity}× ${item.name}`}
          value={`${s}${(item.price * item.quantity).toFixed(2)}`}
        />
      ))}

      <View className="border-t border-dark-700 mt-2 pt-2">
        <Line
          label="Food subtotal"
          value={`${s}${receipt.foodTotal.toFixed(2)}`}
        />
        <Line
          label="Delivery fee"
          value={`${s}${receipt.deliveryFee.toFixed(2)}`}
        />
        <Line
          label="Protocol fee"
          sub="0.02% — goes to ForkIt treasury"
          value={`${s}${receipt.protocolFee.toFixed(2)}`}
        />
        <Line
          label={receipt.depositRefunded > 0 ? 'Deposit (refunded ✓)' : 'Deposit (2%)'}
          sub={receipt.depositRefunded > 0 ? 'Returned after delivery' : 'Returned on delivery'}
          value={
            receipt.depositRefunded > 0
              ? `-${s}${receipt.depositRefunded.toFixed(2)}`
              : `+${s}${receipt.depositAmount.toFixed(2)}`
          }
        />
      </View>

      <View className="border-t border-dark-600 mt-2 pt-2">
        <View className="flex-row justify-between">
          <Text className="text-white font-bold">Net paid</Text>
          <Text className="text-brand-500 font-bold text-lg">
            {s}{receipt.netPaid.toFixed(2)} {receipt.tokenSymbol}
          </Text>
        </View>
      </View>

      {/* Settlement tx link */}
      {receipt.settleTxSignature && (
        <TouchableOpacity
          onPress={openExplorer}
          className="flex-row items-center gap-1 mt-3"
        >
          <Ionicons name="open-outline" size={14} color="#60a5fa" />
          <Text className="text-blue-400 text-sm">View settlement on Solana Explorer</Text>
        </TouchableOpacity>
      )}

      <Text className="text-dark-600 text-xs mt-3">
        Order #{receipt.onChainOrderId} · {new Date(receipt.createdAt).toLocaleDateString()}
      </Text>
    </View>
  );
}
