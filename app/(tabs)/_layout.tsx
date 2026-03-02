import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAppStore } from '@/store/app-store';

export default function TabLayout() {
  const { role } = useAppStore();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#f9a825',
        tabBarInactiveTintColor: '#9fa8da',
        tabBarStyle: {
          backgroundColor: '#0a0e1a',
          borderTopColor: '#1a237e',
        },
        headerStyle: { backgroundColor: '#0a0e1a' },
        headerTintColor: '#f9a825',
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: role === 'driver' ? 'Deliveries' : role === 'restaurant' ? 'Dashboard' : 'Home',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="orders"
        options={{
          title: 'Orders',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="receipt-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="track"
        options={{
          title: 'Track',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="map-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person-outline" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
