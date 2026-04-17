import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import '../global.css';

export default function RootLayout() {
  return (
    <>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: '#0a0e1a' },
          headerTintColor: '#f9a825',
          headerTitleStyle: { fontWeight: 'bold' },
          contentStyle: { backgroundColor: '#0d1421' },
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="order/[id]"
          options={{ title: 'Order Details', presentation: 'card' }}
        />
        <Stack.Screen
          name="order/contribute"
          options={{ title: 'Chip In', presentation: 'modal' }}
        />
        <Stack.Screen
          name="order/checkout"
          options={{ title: 'Checkout', presentation: 'modal' }}
        />
        <Stack.Screen
          name="restaurant/menu"
          options={{ title: 'Menu', presentation: 'card' }}
        />
        <Stack.Screen
          name="restaurant/incoming"
          options={{ title: 'Incoming Orders' }}
        />
        <Stack.Screen
          name="restaurant/menu-editor"
          options={{ title: 'Edit Menu' }}
        />
        <Stack.Screen
          name="restaurant/settings"
          options={{ title: 'Restaurant Settings' }}
        />
        <Stack.Screen
          name="restaurant/create"
          options={{ title: 'Create Restaurant', presentation: 'modal' }}
        />
        <Stack.Screen
          name="driver/available"
          options={{ title: 'Available Deliveries' }}
        />
        <Stack.Screen
          name="driver/delivery"
          options={{ title: 'Active Delivery' }}
        />
        <Stack.Screen
          name="connect"
          options={{ title: 'Connect Wallet', presentation: 'modal' }}
        />
      </Stack>
    </>
  );
}
