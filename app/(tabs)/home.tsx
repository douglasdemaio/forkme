import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  TextInput,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useEffect, useState, useCallback } from 'react';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
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
          Decentralized food delivery.{'\n'}Split the bill with friends on
          Solana.
        </Text>
        <TouchableOpacity
          className="bg-brand-500 rounded-2xl px-8 py-4 mt-8"
          onPress={() => router.push('/connect')}
        >
          <Text className="text-dark-950 font-bold text-lg">
            Connect Wallet
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (role === 'driver') return <DriverHome />;
  if (role === 'restaurant') return <RestaurantHome />;
  return <CustomerHome />;
}

// ── Customer: browse restaurants ─────────────────────────────────────

function CustomerHome() {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const router = useRouter();

  const load = useCallback(
    async (isRefresh = false) => {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      try {
        // Request real device GPS; fall back to Berlin if denied
        const { status } = await Location.requestForegroundPermissionsAsync();
        let lat = 52.52;
        let lng = 13.405;
        if (status === 'granted') {
          const loc = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
          });
          lat = loc.coords.latitude;
          lng = loc.coords.longitude;
        }
        const data = await api.getRestaurants({
          lat,
          lng,
          q: search || undefined,
        });
        setRestaurants(data);
      } catch {
        // silently fail
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [search]
  );

  useEffect(() => {
    load();
  }, [load]);

  if (loading && !refreshing) {
    return (
      <View className="flex-1 bg-dark-950 items-center justify-center">
        <ActivityIndicator size="large" color="#f9a825" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-dark-950">
      <View className="px-4 pt-4 pb-2">
        <Text className="text-white text-2xl font-bold">
          Nearby Restaurants
        </Text>
        <Text className="text-dark-300 mt-1">
          Order food, split with friends
        </Text>
        <View className="bg-dark-900 rounded-xl mt-3 flex-row items-center px-3">
          <Ionicons name="search" size={18} color="#5c6bc0" />
          <TextInput
            className="flex-1 text-white py-3 px-2"
            placeholder="Search restaurants..."
            placeholderTextColor="#5c6bc0"
            value={search}
            onChangeText={setSearch}
            onSubmitEditing={() => load()}
            returnKeyType="search"
          />
        </View>
      </View>
      <FlatList
        data={restaurants}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => load(true)}
            tintColor="#f9a825"
          />
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            className="bg-dark-900 rounded-2xl p-4 mb-3"
            onPress={() =>
              router.push({
                pathname: '/restaurant/menu',
                params: { id: item.id },
              })
            }
          >
            <Text className="text-white text-lg font-semibold">
              {item.name}
            </Text>
            {item.description ? (
              <Text
                className="text-dark-400 text-sm mt-1"
                numberOfLines={1}
              >
                {item.description}
              </Text>
            ) : null}
            <View className="flex-row items-center mt-2 gap-4">
              {item.rating != null && (
                <View className="flex-row items-center">
                  <Ionicons name="star" size={14} color="#f9a825" />
                  <Text className="text-brand-500 ml-1">
                    {item.rating.toFixed(1)}
                  </Text>
                </View>
              )}
              {item.distance != null && (
                <Text className="text-dark-400">
                  {item.distance.toFixed(1)} km away
                </Text>
              )}
              <Text className="text-dark-500 text-sm">
                {item.menuItems?.length ?? 0} items
              </Text>
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <Text className="text-dark-400 text-center mt-8">
            No restaurants found
          </Text>
        }
      />
    </View>
  );
}

// ── Driver: quick entry ──────────────────────────────────────────────

function DriverHome() {
  const router = useRouter();
  return (
    <View className="flex-1 bg-dark-950 items-center justify-center px-6">
      <Ionicons name="bicycle-outline" size={64} color="#f9a825" />
      <Text className="text-white text-xl font-bold mt-4">Driver Mode</Text>
      <Text className="text-dark-300 text-center mt-2">
        Pick up funded orders, verify with codes, get paid on settlement.
      </Text>
      <TouchableOpacity
        className="bg-brand-500 rounded-2xl px-8 py-4 mt-6"
        onPress={() => router.push('/driver/available')}
      >
        <Text className="text-dark-950 font-bold">
          View Available Orders
        </Text>
      </TouchableOpacity>
    </View>
  );
}

// ── Restaurant owner: dashboard ──────────────────────────────────────

function RestaurantHome() {
  const { myRestaurant, setMyRestaurant, walletAddress } = useAppStore();
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Try to find the restaurant owned by this wallet
    if (walletAddress && !myRestaurant) {
      api
        .getRestaurants({ q: walletAddress })
        .then((list) => {
          const mine = list.find(
            (r) => r.walletAddress === walletAddress
          );
          if (mine) setMyRestaurant(mine);
        })
        .catch(() => {})
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [walletAddress]);

  if (loading) {
    return (
      <View className="flex-1 bg-dark-950 items-center justify-center">
        <ActivityIndicator size="large" color="#f9a825" />
      </View>
    );
  }

  if (!myRestaurant) {
    return (
      <View className="flex-1 bg-dark-950 items-center justify-center px-6">
        <Ionicons name="storefront-outline" size={64} color="#f9a825" />
        <Text className="text-white text-xl font-bold mt-4">
          No Restaurant Yet
        </Text>
        <Text className="text-dark-300 text-center mt-2">
          Create your restaurant to start receiving orders.
        </Text>
        <TouchableOpacity
          className="bg-brand-500 rounded-2xl px-8 py-4 mt-6"
          onPress={() => router.push('/restaurant/create')}
        >
          <Text className="text-dark-950 font-bold">
            Create Restaurant
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-dark-950 px-4 pt-6">
      <View className="bg-dark-900 rounded-2xl p-4 mb-4">
        <Text className="text-white text-xl font-bold">
          {myRestaurant.name}
        </Text>
        <Text className="text-dark-400 mt-1">{myRestaurant.description}</Text>
        <View className="flex-row items-center mt-2">
          <View className="bg-brand-500/20 rounded-full px-3 py-1">
            <Text className="text-brand-500 text-sm font-medium capitalize">
              {myRestaurant.template} template
            </Text>
          </View>
          {myRestaurant.menuItems && (
            <Text className="text-dark-400 ml-3 text-sm">
              {myRestaurant.menuItems.length} menu items
            </Text>
          )}
        </View>
      </View>

      {/* Quick actions */}
      <View className="gap-3">
        <TouchableOpacity
          className="bg-dark-900 rounded-2xl p-4 flex-row items-center"
          onPress={() => router.push('/restaurant/incoming')}
        >
          <View className="bg-brand-500/20 w-12 h-12 rounded-full items-center justify-center mr-4">
            <Ionicons name="receipt-outline" size={24} color="#f9a825" />
          </View>
          <View className="flex-1">
            <Text className="text-white font-semibold">
              Incoming Orders
            </Text>
            <Text className="text-dark-400 text-sm">
              View, accept, and manage orders
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#5c6bc0" />
        </TouchableOpacity>

        <TouchableOpacity
          className="bg-dark-900 rounded-2xl p-4 flex-row items-center"
          onPress={() =>
            router.push({
              pathname: '/restaurant/menu-editor',
              params: { restaurantId: myRestaurant.id },
            })
          }
        >
          <View className="bg-green-500/20 w-12 h-12 rounded-full items-center justify-center mr-4">
            <Ionicons name="fast-food-outline" size={24} color="#66bb6a" />
          </View>
          <View className="flex-1">
            <Text className="text-white font-semibold">Edit Menu</Text>
            <Text className="text-dark-400 text-sm">
              Add items, upload photos, set prices
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#5c6bc0" />
        </TouchableOpacity>

        <TouchableOpacity
          className="bg-dark-900 rounded-2xl p-4 flex-row items-center"
          onPress={() =>
            router.push({
              pathname: '/restaurant/settings',
              params: { restaurantId: myRestaurant.id },
            })
          }
        >
          <View className="bg-blue-500/20 w-12 h-12 rounded-full items-center justify-center mr-4">
            <Ionicons name="settings-outline" size={24} color="#42a5f5" />
          </View>
          <View className="flex-1">
            <Text className="text-white font-semibold">
              Restaurant Settings
            </Text>
            <Text className="text-dark-400 text-sm">
              Template, profile, branding
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#5c6bc0" />
        </TouchableOpacity>
      </View>
    </View>
  );
}
