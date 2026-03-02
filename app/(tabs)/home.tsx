import { View, Text, TouchableOpacity, FlatList, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useAppStore } from '@/store/app-store';
import { api } from '@/lib/api';
import type { Restaurant } from '@/lib/types';

export default function HomeScreen() {
  const { isConnected, role } = useAppStore();
  const router = useRouter();

  if (!isConnected) {
    return (
      <View className="flex-1 bg-dark-950 items-center justify-center px-6">
        <Ionicons name="restaurant-outline" size={80} color="#f9a825" />
        <Text className="text-white text-3xl font-bold mt-6">ForkMe</Text>
        <Text className="text-dark-300 text-center mt-3 text-lg">
          Decentralized food delivery.{'\n'}Split the bill with friends on Solana.
        </Text>
        <TouchableOpacity
          className="bg-brand-500 rounded-2xl px-8 py-4 mt-8"
          onPress={() => router.push('/connect')}
        >
          <Text className="text-dark-950 font-bold text-lg">Connect Wallet</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (role === 'driver') return <DriverHome />;
  if (role === 'restaurant') return <RestaurantHome />;
  return <CustomerHome />;
}

function CustomerHome() {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // TODO: get actual location
    api.getNearbyRestaurants(52.52, 13.405).then(setRestaurants).finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <View className="flex-1 bg-dark-950 items-center justify-center">
        <ActivityIndicator size="large" color="#f9a825" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-dark-950">
      <View className="px-4 pt-4 pb-2">
        <Text className="text-white text-2xl font-bold">Nearby Restaurants</Text>
        <Text className="text-dark-300 mt-1">Order food, split with friends</Text>
      </View>
      <FlatList
        data={restaurants}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16 }}
        renderItem={({ item }) => (
          <TouchableOpacity
            className="bg-dark-900 rounded-2xl p-4 mb-3"
            onPress={() => router.push({ pathname: '/restaurant/menu', params: { id: item.id } })}
          >
            <Text className="text-white text-lg font-semibold">{item.name}</Text>
            {item.rating && (
              <View className="flex-row items-center mt-1">
                <Ionicons name="star" size={14} color="#f9a825" />
                <Text className="text-brand-500 ml-1">{item.rating.toFixed(1)}</Text>
              </View>
            )}
            {item.distance && (
              <Text className="text-dark-400 mt-1">{item.distance.toFixed(1)} km away</Text>
            )}
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <Text className="text-dark-400 text-center mt-8">No restaurants nearby</Text>
        }
      />
    </View>
  );
}

function DriverHome() {
  const router = useRouter();
  return (
    <View className="flex-1 bg-dark-950 items-center justify-center px-6">
      <Ionicons name="bicycle-outline" size={64} color="#f9a825" />
      <Text className="text-white text-xl font-bold mt-4">Driver Mode</Text>
      <TouchableOpacity
        className="bg-brand-500 rounded-2xl px-8 py-4 mt-6"
        onPress={() => router.push('/driver/available')}
      >
        <Text className="text-dark-950 font-bold">View Available Orders</Text>
      </TouchableOpacity>
    </View>
  );
}

function RestaurantHome() {
  const router = useRouter();
  return (
    <View className="flex-1 bg-dark-950 items-center justify-center px-6">
      <Ionicons name="storefront-outline" size={64} color="#f9a825" />
      <Text className="text-white text-xl font-bold mt-4">Restaurant Dashboard</Text>
      <TouchableOpacity
        className="bg-brand-500 rounded-2xl px-8 py-4 mt-6"
        onPress={() => router.push('/restaurant/incoming')}
      >
        <Text className="text-dark-950 font-bold">View Incoming Orders</Text>
      </TouchableOpacity>
    </View>
  );
}
