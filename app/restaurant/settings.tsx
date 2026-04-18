import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Image,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useAppStore } from '@/store/app-store';
import { api } from '@/lib/api';
import {
  RESTAURANT_TEMPLATES,
  SUPPORTED_TOKENS,
  type RestaurantTemplate,
  type StablecoinToken,
} from '@/lib/constants';

export default function RestaurantSettingsScreen() {
  const { restaurantId } = useLocalSearchParams<{
    restaurantId: string;
  }>();
  const { myRestaurant, setMyRestaurant } = useAppStore();
  const router = useRouter();

  const [name, setName] = useState(myRestaurant?.name || '');
  const [description, setDescription] = useState(
    myRestaurant?.description || ''
  );
  const [address, setAddress] = useState(myRestaurant?.address || '');
  const [template, setTemplate] = useState<RestaurantTemplate>(
    myRestaurant?.template || 'classic'
  );
  const [logoUrl, setLogoUrl] = useState(myRestaurant?.logoUrl || '');
  const [bannerUrl, setBannerUrl] = useState(myRestaurant?.bannerUrl || '');
  const [currency, setCurrency] = useState<string>(
    (myRestaurant as any)?.currency || SUPPORTED_TOKENS[0].symbol
  );
  const [deliveryFee, setDeliveryFee] = useState(
    (myRestaurant as any)?.deliveryFee?.toString() || '2.00'
  );
  const [saving, setSaving] = useState(false);
  const { t } = useTranslation();

  const id = restaurantId || myRestaurant?.id;

  const pickAndUpload = async (
    setter: (url: string) => void
  ) => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      try {
        const upload = await api.uploadImage(result.assets[0].uri);
        setter(upload.url);
      } catch (err: any) {
        Alert.alert('Upload failed', err.message);
      }
    }
  };

  const handleSave = async () => {
    if (!id) return;
    setSaving(true);
    try {
      const updated = await api.updateRestaurant(id, {
        name: name.trim(),
        description: description.trim(),
        address: address.trim(),
        template,
        logoUrl: logoUrl || undefined,
        bannerUrl: bannerUrl || undefined,
        currency,
        deliveryFee: parseFloat(deliveryFee) || 0,
      });
      setMyRestaurant(updated);
      Alert.alert('Saved', 'Restaurant settings updated.');
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to save');
    }
    setSaving(false);
  };

  return (
    <ScrollView className="flex-1 bg-dark-950 px-4 pt-6">
      {/* Banner */}
      <TouchableOpacity
        className="bg-dark-900 rounded-2xl h-40 items-center justify-center mb-4 overflow-hidden"
        onPress={() => pickAndUpload(setBannerUrl)}
      >
        {bannerUrl ? (
          <Image
            source={{ uri: bannerUrl }}
            className="w-full h-full"
            resizeMode="cover"
          />
        ) : (
          <View className="items-center">
            <Ionicons name="image-outline" size={40} color="#5c6bc0" />
            <Text className="text-dark-400 mt-2">Tap to set banner</Text>
          </View>
        )}
      </TouchableOpacity>

      {/* Logo */}
      <View className="flex-row items-center mb-6">
        <TouchableOpacity
          className="bg-dark-900 w-20 h-20 rounded-full items-center justify-center overflow-hidden mr-4"
          onPress={() => pickAndUpload(setLogoUrl)}
        >
          {logoUrl ? (
            <Image
              source={{ uri: logoUrl }}
              className="w-full h-full"
              resizeMode="cover"
            />
          ) : (
            <Ionicons name="camera" size={28} color="#5c6bc0" />
          )}
        </TouchableOpacity>
        <View>
          <Text className="text-white font-semibold">Logo</Text>
          <Text className="text-dark-400 text-sm">
            Tap to upload
          </Text>
        </View>
      </View>

      {/* Name */}
      <Text className="text-dark-300 mb-1 ml-1">{t('restaurantSettings.name')}</Text>
      <TextInput
        className="bg-dark-900 text-white rounded-xl px-4 py-3 mb-4 text-lg"
        value={name}
        onChangeText={setName}
        placeholder={t('restaurantSettings.namePlaceholder')}
        placeholderTextColor="#5c6bc0"
      />

      {/* Description */}
      <Text className="text-dark-300 mb-1 ml-1">{t('restaurantSettings.description')}</Text>
      <TextInput
        className="bg-dark-900 text-white rounded-xl px-4 py-3 mb-4"
        value={description}
        onChangeText={setDescription}
        placeholder={t('restaurantSettings.descriptionPlaceholder')}
        placeholderTextColor="#5c6bc0"
        multiline
        numberOfLines={3}
        textAlignVertical="top"
      />

      {/* Address */}
      <Text className="text-dark-300 mb-1 ml-1">{t('restaurantSettings.address')}</Text>
      <TextInput
        className="bg-dark-900 text-white rounded-xl px-4 py-3 mb-6"
        value={address}
        onChangeText={setAddress}
        placeholder={t('restaurantSettings.addressPlaceholder')}
        placeholderTextColor="#5c6bc0"
      />

      {/* Currency */}
      <Text className="text-white text-lg font-semibold mb-3">
        {t('restaurantSettings.currency')}
      </Text>
      <View className="flex-row gap-3 mb-6">
        {SUPPORTED_TOKENS.map((token) => {
          const isSelected = currency === token.symbol;
          return (
            <TouchableOpacity
              key={token.mint}
              onPress={() => setCurrency(token.symbol)}
              className={`flex-1 rounded-2xl p-4 border-2 ${
                isSelected
                  ? 'border-brand-500 bg-dark-800'
                  : 'border-dark-700 bg-dark-900'
              }`}
            >
              <View className="flex-row items-center justify-between">
                <Text className="text-white font-bold text-lg">
                  {token.currencySign} {token.symbol}
                </Text>
                {isSelected && (
                  <Ionicons
                    name="checkmark-circle"
                    size={20}
                    color="#f9a825"
                  />
                )}
              </View>
              <Text className="text-dark-400 text-xs mt-1">
                {token.name}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Delivery Fee */}
      <Text className="text-dark-300 mb-1 ml-1">
        {t('restaurantSettings.deliveryFee')}
      </Text>
      <TextInput
        className="bg-dark-900 text-white rounded-xl px-4 py-3 mb-6 text-lg"
        value={deliveryFee}
        onChangeText={setDeliveryFee}
        placeholder="2.00"
        placeholderTextColor="#5c6bc0"
        keyboardType="decimal-pad"
      />

      {/* Template */}
      <Text className="text-white text-lg font-semibold mb-3">
        {t('restaurantSettings.pageTemplate')}
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
              <View className="flex-1">
                <Text className="text-white font-semibold">
                  {t.label}
                </Text>
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

      {/* Save */}
      <TouchableOpacity
        className={`rounded-2xl py-4 items-center mb-8 ${
          saving ? 'bg-dark-700' : 'bg-brand-500'
        }`}
        onPress={handleSave}
        disabled={saving}
      >
        {saving ? (
          <ActivityIndicator color="#0a0e1a" />
        ) : (
          <Text className="text-dark-950 font-bold text-lg">
            {t('restaurantSettings.saveSettings')}
          </Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}
