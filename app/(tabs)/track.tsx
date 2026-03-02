import { View, Text } from 'react-native';
import { useAppStore } from '@/store/app-store';
import { useOrderTracking } from '@/hooks/useOrderTracking';
import { Ionicons } from '@expo/vector-icons';

export default function TrackScreen() {
  const { activeOrder } = useAppStore();
  useOrderTracking(activeOrder?.id || null);

  if (!activeOrder) {
    return (
      <View className="flex-1 bg-dark-950 items-center justify-center px-6">
        <Ionicons name="map-outline" size={64} color="#5c6bc0" />
        <Text className="text-dark-300 text-center mt-4 text-lg">
          No active delivery to track
        </Text>
        <Text className="text-dark-500 text-center mt-2">
          Place an order to see live tracking here
        </Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-dark-950">
      {/* Map placeholder — integrate react-native-maps here */}
      <View className="flex-1 bg-dark-900 items-center justify-center">
        {activeOrder.driverLocation ? (
          <View className="items-center">
            <Ionicons name="bicycle" size={48} color="#f9a825" />
            <Text className="text-white mt-2">
              Driver at {activeOrder.driverLocation.lat.toFixed(4)},{' '}
              {activeOrder.driverLocation.lng.toFixed(4)}
            </Text>
          </View>
        ) : (
          <Text className="text-dark-400">Waiting for driver location...</Text>
        )}
      </View>

      {/* Status bar */}
      <View className="bg-dark-900 p-4 border-t border-dark-800">
        <View className="flex-row justify-between items-center">
          <View>
            <Text className="text-white font-semibold text-lg">
              {activeOrder.restaurant?.name}
            </Text>
            <Text className="text-brand-500 mt-1">{activeOrder.status}</Text>
          </View>
          <View className="items-end">
            <Text className="text-white">
              {activeOrder.foodTotal + activeOrder.deliveryFee} USDC
            </Text>
            <Text className="text-dark-400 text-sm">
              {activeOrder.contributions?.length || 0} contributors
            </Text>
          </View>
        </View>

        {/* Progress steps */}
        <View className="flex-row justify-between mt-4">
          {['Funded', 'Preparing', 'ReadyForPickup', 'PickedUp', 'Delivered'].map(
            (step, idx) => {
              const steps = ['Funded', 'Preparing', 'ReadyForPickup', 'PickedUp', 'Delivered'];
              const currentIdx = steps.indexOf(activeOrder.status);
              const isActive = idx <= currentIdx;
              return (
                <View key={step} className="items-center flex-1">
                  <View
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: isActive ? '#f9a825' : '#283593' }}
                  />
                  <Text
                    className="text-xs mt-1 text-center"
                    style={{ color: isActive ? '#f9a825' : '#5c6bc0' }}
                  >
                    {step.replace('ReadyForPickup', 'Ready').replace('PickedUp', 'Picked Up')}
                  </Text>
                </View>
              );
            }
          )}
        </View>
      </View>
    </View>
  );
}
