import { View, Text, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { OrderStatus, StatusEvent, DeliveryService } from '@/lib/types';

interface Stage {
  label: string;
  statuses: OrderStatus[];
}

const STAGES: Stage[] = [
  { label: 'Order Placed', statuses: ['Created', 'Funded'] },
  { label: 'Cooking', statuses: ['Preparing'] },
  { label: 'Ready for Pickup', statuses: ['ReadyForPickup'] },
  { label: 'On the Way', statuses: ['PickedUp'] },
  { label: 'Delivered & Funds Released', statuses: ['Delivered', 'Settled'] },
];

const ERROR_STATUSES: OrderStatus[] = ['Cancelled', 'Refunded', 'Disputed'];

interface Props {
  currentStatus: OrderStatus;
  statusHistory: StatusEvent[];
}

function stageIndex(status: OrderStatus): number {
  return STAGES.findIndex((s) => s.statuses.includes(status));
}

function deliveryServiceBadge(history: StatusEvent[]): DeliveryService | undefined {
  return history.find((e) => e.status === 'PickedUp')?.deliveryService;
}

export function OrderTracker({ currentStatus, statusHistory }: Props) {
  const isError = ERROR_STATUSES.includes(currentStatus);
  const activeIdx = stageIndex(currentStatus);
  const service = deliveryServiceBadge(statusHistory);

  if (isError) {
    return (
      <View className="bg-dark-900 rounded-2xl p-4">
        <View className="flex-row items-center gap-2">
          <Ionicons name="alert-circle" size={20} color="#ef4444" />
          <Text className="text-red-400 font-semibold capitalize">{currentStatus}</Text>
        </View>
        <Text className="text-dark-400 text-sm mt-1">
          {currentStatus === 'Disputed'
            ? 'This order is under review by support.'
            : 'This order has been cancelled. Any funds will be refunded.'}
        </Text>
      </View>
    );
  }

  return (
    <View className="bg-dark-900 rounded-2xl p-4">
      <Text className="text-white font-semibold mb-4">Order Status</Text>
      {STAGES.map((stage, idx) => {
        const isDone = activeIdx > idx;
        const isActive = activeIdx === idx;
        const isPending = activeIdx < idx;

        return (
          <View key={stage.label} className="flex-row items-start">
            {/* Timeline dot + line */}
            <View className="items-center mr-3" style={{ width: 20 }}>
              <View
                className={`w-5 h-5 rounded-full items-center justify-center ${
                  isDone ? 'bg-green-500' : isActive ? 'bg-brand-500' : 'bg-dark-700'
                }`}
              >
                {isDone && <Ionicons name="checkmark" size={12} color="white" />}
                {isActive && <ActivityIndicator size="small" color="white" />}
              </View>
              {idx < STAGES.length - 1 && (
                <View
                  className={`w-0.5 flex-1 mt-1 ${isDone ? 'bg-green-500' : 'bg-dark-700'}`}
                  style={{ minHeight: 24 }}
                />
              )}
            </View>

            {/* Label + badge */}
            <View className="flex-1 pb-5">
              <Text
                className={`font-medium ${
                  isDone ? 'text-green-400' : isActive ? 'text-white' : 'text-dark-500'
                }`}
              >
                {stage.label}
              </Text>

              {/* Delivery service badge on pickup stage */}
              {isActive && stage.statuses.includes('PickedUp') && service && (
                <View className="mt-1 flex-row">
                  <View className="bg-dark-800 rounded-full px-2 py-0.5 flex-row items-center gap-1">
                    <Text className="text-xs">{service === 'ai' ? '🤖' : '🧑'}</Text>
                    <Text className="text-dark-300 text-xs">
                      {service === 'ai' ? 'AI Routing' : 'Human Driver'}
                    </Text>
                  </View>
                </View>
              )}

              {/* Timestamp from history */}
              {(isDone || isActive) && (() => {
                const event = statusHistory.find((e) => stage.statuses.includes(e.status));
                return event ? (
                  <Text className="text-dark-500 text-xs mt-0.5">
                    {new Date(event.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </Text>
                ) : null;
              })()}
            </View>
          </View>
        );
      })}
    </View>
  );
}
