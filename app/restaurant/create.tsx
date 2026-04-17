import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useAppStore } from '@/store/app-store';
import { api } from '@/lib/api';
import {
  RESTAURANT_TEMPLATES,
  type RestaurantTemplate,
} from '@/lib/constants';

export default function CreateRestaurantScreen() {
  const { walletAddress, setMyRestaurant } = useAppStore();
  const router = useRouter();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [address, setAddress] = useState('');
  const [template, setTemplate] = useState<RestaurantTemplate>('classic');
  const [saving, setSaving] = useState(false);

  const handleCreate = async () => {
    if (!name.trim()) {
      Alert.alert('Missing name', 'Please enter a restaurant name.');
      return;
    }
    if (!walletAddress) {
      Alert.alert('Not connected', 'Please connect your wallet first.');
      return;
    }

    setSaving(true);
    try {
      const restaurant = await api.createRestaurant({
        name: name.trim(),
        description: description.trim(),
        template,
        walletAddress,
        address: address.trim() || undefined,
      });
      setMyRestaurant(restaurant);
      router.back();
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to create restaurant');
    }
    setSaving(false);
  };

  return (
    <ScrollView className="flex-1 bg-dark-950 px-4 pt-6">
      <Text className="text-white text-2xl font-bold mb-2">
        Create Your Restaurant
      </Text>
      <Text className="text-dark-300 mb-6">
        Set up your restaurant to start receiving orders through ForkIt.
      </Text>

      {/* Name */}
      <Text className="text-dark-300 mb-1 ml-1">Restaurant Name *</Text>
      <TextInput
        className="bg-dark-900 text-white rounded-xl px-4 py-3 mb-4 text-lg"
        placeholder="e.g. Tony's Pizzeria"
        placeholderTextColor="#5c6bc0"
        value={name}
        onChangeText={setName}
      />

      {/* Description */}
      <Text className="text-dark-300 mb-1 ml-1">Description</Text>
      <TextInput
        className="bg-dark-900 text-white rounded-xl px-4 py-3 mb-4"
        placeholder="Tell customers what makes your food special..."
        placeholderTextColor="#5c6bc0"
        value={description}
        onChangeText={setDescription}
        multiline
        numberOfLines={3}
        textAlignVertical="top"
      />

      {/* Address */}
      <Text className="text-dark-300 mb-1 ml-1">Address</Text>
      <TextInput
        className="bg-dark-900 text-white rounded-xl px-4 py-3 mb-4"
        placeholder="123 Main St, Berlin"
        placeholderTextColor="#5c6bc0"
        value={address}
        onChangeText={setAddress}
      />

      {/* Template selection */}
      <Text className="text-white text-lg font-semibold mb-3">
        Choose a Template
      </Text>
      <View className="gap-3 mb-6">
        {RESTAURANT_TEMPLATES.map((t) => (
          <TouchableOpacity
            key={t.id}
            className={`rounded-2xl p-4 border-2 ${
              template === t.id
                ? 'border-brand-500 bg-dark-800'
                : 'border-dark-700 bg-dark-900'
            }`}
            onPress={() => setTemplate(t.id)}
          >
            <View className="flex-row items-center justify-between">
              <View>
                <Text className="text-white font-semibold">{t.label}</Text>
                <Text className="text-dark-400 text-sm mt-1">
                  {t.description}
                </Text>
              </View>
              {template === t.id && (
                <Ionicons
                  name="checkmark-circle"
                  size={24}
                  color="#f9a825"
                />
              )}
            </View>
          </TouchableOpacity>
        ))}
      </View>

      {/* Wallet info */}
      <View className="bg-dark-900 rounded-xl p-4 mb-6">
        <Text className="text-dark-400 text-sm">Linked Wallet</Text>
        <Text className="text-white font-mono mt-1" numberOfLines={1}>
          {walletAddress}
        </Text>
        <Text className="text-dark-500 text-xs mt-1">
          Order payments will be sent to this wallet on settlement.
        </Text>
      </View>

      {/* Create button */}
      <TouchableOpacity
        className={`rounded-2xl py-4 items-center mb-8 ${
          saving ? 'bg-dark-700' : 'bg-brand-500'
        }`}
        onPress={handleCreate}
        disabled={saving}
      >
        {saving ? (
          <ActivityIndicator color="#0a0e1a" />
        ) : (
          <Text className="text-dark-950 font-bold text-lg">
            Create Restaurant
          </Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}
