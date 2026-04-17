import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useAppStore } from '@/store/app-store';
import { api } from '@/lib/api';
import type { MenuItem, Restaurant } from '@/lib/types';

export default function MenuScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { cart, addToCart, cartTotal, cartItemCount, setCurrentRestaurantId } =
    useAppStore();
  const router = useRouter();
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    setCurrentRestaurantId(id);

    Promise.all([api.getRestaurant(id), api.getMenu(id)])
      .then(([rest, menu]) => {
        setRestaurant(rest);
        setItems(menu.filter((m) => m.available));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <View className="flex-1 bg-dark-950 items-center justify-center">
        <ActivityIndicator size="large" color="#f9a825" />
      </View>
    );
  }

  // Group items by category
  const categories = [...new Set(items.map((i) => i.category))];

  return (
    <View className="flex-1 bg-dark-950">
      {/* Restaurant header */}
      {restaurant && (
        <View className="px-4 pt-4 pb-2">
          {restaurant.bannerUrl ? (
            <Image
              source={{ uri: restaurant.bannerUrl }}
              className="w-full h-32 rounded-2xl mb-3"
              resizeMode="cover"
            />
          ) : null}
          <Text className="text-white text-2xl font-bold">
            {restaurant.name}
          </Text>
          {restaurant.description ? (
            <Text className="text-dark-400 mt-1">
              {restaurant.description}
            </Text>
          ) : null}
          <View className="flex-row items-center mt-2 gap-3">
            {restaurant.rating != null && (
              <View className="flex-row items-center">
                <Ionicons name="star" size={14} color="#f9a825" />
                <Text className="text-brand-500 ml-1">
                  {restaurant.rating.toFixed(1)}
                </Text>
              </View>
            )}
            <Text className="text-dark-500 text-sm">
              {items.length} items
            </Text>
          </View>
        </View>
      )}

      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16, paddingBottom: cart.length > 0 ? 100 : 16 }}
        // Optional section headers by category
        renderItem={({ item }) => {
          const inCart = cart.find((c) => c.menuItemId === item.id);
          return (
            <View className="bg-dark-900 rounded-2xl p-4 mb-3 flex-row">
              {item.imageUrl ? (
                <Image
                  source={{ uri: item.imageUrl }}
                  className="w-20 h-20 rounded-xl mr-4"
                  resizeMode="cover"
                />
              ) : (
                <View className="w-20 h-20 rounded-xl mr-4 bg-dark-800 items-center justify-center">
                  <Ionicons
                    name="fast-food-outline"
                    size={28}
                    color="#5c6bc0"
                  />
                </View>
              )}
              <View className="flex-1">
                <Text className="text-white font-semibold">{item.name}</Text>
                {item.description ? (
                  <Text
                    className="text-dark-400 text-sm mt-1"
                    numberOfLines={2}
                  >
                    {item.description}
                  </Text>
                ) : null}
                <View className="flex-row items-center justify-between mt-2">
                  <Text className="text-brand-500 font-bold">
                    ${item.price.toFixed(2)}
                  </Text>
                  {inCart ? (
                    <View className="flex-row items-center gap-2">
                      <TouchableOpacity
                        className="bg-dark-700 w-8 h-8 rounded-full items-center justify-center"
                        onPress={() =>
                          useAppStore
                            .getState()
                            .updateCartQuantity(
                              item.id,
                              inCart.quantity - 1
                            )
                        }
                      >
                        <Ionicons
                          name="remove"
                          size={18}
                          color="#f9a825"
                        />
                      </TouchableOpacity>
                      <Text className="text-white font-bold">
                        {inCart.quantity}
                      </Text>
                      <TouchableOpacity
                        className="bg-brand-500 w-8 h-8 rounded-full items-center justify-center"
                        onPress={() =>
                          addToCart({
                            menuItemId: item.id,
                            name: item.name,
                            price: item.price,
                          })
                        }
                      >
                        <Ionicons name="add" size={18} color="#0a0e1a" />
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <TouchableOpacity
                      className="bg-brand-500 w-10 h-10 rounded-full items-center justify-center"
                      onPress={() =>
                        addToCart({
                          menuItemId: item.id,
                          name: item.name,
                          price: item.price,
                        })
                      }
                    >
                      <Ionicons name="add" size={24} color="#0a0e1a" />
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            </View>
          );
        }}
        ListEmptyComponent={
          <Text className="text-dark-400 text-center mt-8">
            No menu items available
          </Text>
        }
      />

      {/* Cart bar */}
      {cart.length > 0 && (
        <View className="absolute bottom-0 left-0 right-0 bg-dark-900 border-t border-dark-800 px-4 py-4">
          <TouchableOpacity
            className="bg-brand-500 rounded-2xl py-4 items-center flex-row justify-center"
            onPress={() =>
              router.push({
                pathname: '/order/checkout',
                params: { restaurantId: id },
              })
            }
          >
            <Ionicons name="cart" size={20} color="#0a0e1a" />
            <Text className="text-dark-950 font-bold text-lg ml-2">
              Checkout • ${cartTotal().toFixed(2)} ({cartItemCount()} items)
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}
