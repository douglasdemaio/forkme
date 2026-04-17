import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  TextInput,
  Image,
  Alert,
  ActivityIndicator,
  Switch,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useEffect, useState, useCallback } from 'react';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { api } from '@/lib/api';
import type { MenuItem } from '@/lib/types';

interface EditingItem {
  id?: string;
  name: string;
  description: string;
  price: string;
  category: string;
  imageUrl: string;
  imageUri: string; // local URI before upload
  available: boolean;
}

const EMPTY_ITEM: EditingItem = {
  name: '',
  description: '',
  price: '',
  category: '',
  imageUrl: '',
  imageUri: '',
  available: true,
};

const CATEGORIES = [
  'Mains',
  'Sides',
  'Drinks',
  'Desserts',
  'Specials',
  'Other',
];

export default function MenuEditorScreen() {
  const { restaurantId } = useLocalSearchParams<{ restaurantId: string }>();
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState<EditingItem | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null); // null = new item

  const load = useCallback(async () => {
    if (!restaurantId) return;
    setLoading(true);
    try {
      const menu = await api.getMenu(restaurantId);
      setItems(menu);
    } catch {}
    setLoading(false);
  }, [restaurantId]);

  useEffect(() => {
    load();
  }, [load]);

  // ── Image picker ────────────────────────────────────────────────
  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setEditing((prev) =>
        prev
          ? { ...prev, imageUri: result.assets[0].uri, imageUrl: '' }
          : null
      );
    }
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Camera permission is required to take photos.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setEditing((prev) =>
        prev
          ? { ...prev, imageUri: result.assets[0].uri, imageUrl: '' }
          : null
      );
    }
  };

  // ── Save item ───────────────────────────────────────────────────
  const saveItem = async () => {
    if (!editing || !restaurantId) return;
    if (!editing.name.trim()) {
      Alert.alert('Missing name', 'Please enter a name for the menu item.');
      return;
    }
    const price = parseFloat(editing.price);
    if (isNaN(price) || price <= 0) {
      Alert.alert('Invalid price', 'Please enter a valid price.');
      return;
    }

    setSaving(true);
    try {
      // Upload image if a local URI is set
      let imageUrl = editing.imageUrl;
      if (editing.imageUri) {
        const upload = await api.uploadImage(editing.imageUri);
        imageUrl = upload.url;
      }

      const payload = {
        name: editing.name.trim(),
        description: editing.description.trim(),
        price,
        category: editing.category || 'Other',
        imageUrl,
        available: editing.available,
      };

      if (editingId) {
        // Update existing
        await api.updateMenuItem(restaurantId, editingId, payload);
      } else {
        // Add new
        await api.addMenuItem(restaurantId, payload);
      }

      setEditing(null);
      setEditingId(null);
      await load();
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to save menu item');
    }
    setSaving(false);
  };

  // ── Delete item ─────────────────────────────────────────────────
  const deleteItem = (item: MenuItem) => {
    Alert.alert(
      'Delete Item',
      `Remove "${item.name}" from the menu?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.deleteMenuItem(restaurantId!, item.id);
              setItems((prev) => prev.filter((i) => i.id !== item.id));
            } catch (err: any) {
              Alert.alert('Error', err.message || 'Failed to delete');
            }
          },
        },
      ]
    );
  };

  // ── Toggle availability ─────────────────────────────────────────
  const toggleAvailability = async (item: MenuItem) => {
    try {
      const updated = await api.updateMenuItem(restaurantId!, item.id, {
        available: !item.available,
      });
      setItems((prev) =>
        prev.map((i) => (i.id === item.id ? { ...i, available: updated.available } : i))
      );
    } catch {}
  };

  // ── Start editing ───────────────────────────────────────────────
  const startEdit = (item?: MenuItem) => {
    if (item) {
      setEditingId(item.id);
      setEditing({
        id: item.id,
        name: item.name,
        description: item.description,
        price: item.price.toString(),
        category: item.category,
        imageUrl: item.imageUrl,
        imageUri: '',
        available: item.available,
      });
    } else {
      setEditingId(null);
      setEditing({ ...EMPTY_ITEM });
    }
  };

  // ── Loading state ───────────────────────────────────────────────
  if (loading) {
    return (
      <View className="flex-1 bg-dark-950 items-center justify-center">
        <ActivityIndicator size="large" color="#f9a825" />
      </View>
    );
  }

  // ── Edit form ───────────────────────────────────────────────────
  if (editing) {
    const imageSource = editing.imageUri || editing.imageUrl;

    return (
      <KeyboardAvoidingView
        className="flex-1 bg-dark-950"
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView className="flex-1 px-4 pt-4" keyboardShouldPersistTaps="handled">
          <Text className="text-white text-xl font-bold mb-4">
            {editingId ? 'Edit Item' : 'New Menu Item'}
          </Text>

          {/* Image */}
          <TouchableOpacity
            className="bg-dark-900 rounded-2xl h-48 items-center justify-center mb-4 overflow-hidden"
            onPress={() => {
              Alert.alert('Add Photo', 'Choose a source', [
                { text: 'Camera', onPress: takePhoto },
                { text: 'Gallery', onPress: pickImage },
                { text: 'Cancel', style: 'cancel' },
              ]);
            }}
          >
            {imageSource ? (
              <Image
                source={{ uri: imageSource }}
                className="w-full h-full"
                resizeMode="cover"
              />
            ) : (
              <View className="items-center">
                <Ionicons name="camera-outline" size={48} color="#5c6bc0" />
                <Text className="text-dark-400 mt-2">
                  Tap to add a photo
                </Text>
              </View>
            )}
          </TouchableOpacity>

          {/* Name */}
          <Text className="text-dark-300 mb-1 ml-1">Name *</Text>
          <TextInput
            className="bg-dark-900 text-white rounded-xl px-4 py-3 mb-3 text-lg"
            placeholder="e.g. Margherita Pizza"
            placeholderTextColor="#5c6bc0"
            value={editing.name}
            onChangeText={(v) => setEditing({ ...editing, name: v })}
          />

          {/* Description */}
          <Text className="text-dark-300 mb-1 ml-1">Description</Text>
          <TextInput
            className="bg-dark-900 text-white rounded-xl px-4 py-3 mb-3"
            placeholder="Fresh tomato, mozzarella, basil..."
            placeholderTextColor="#5c6bc0"
            value={editing.description}
            onChangeText={(v) => setEditing({ ...editing, description: v })}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />

          {/* Price */}
          <Text className="text-dark-300 mb-1 ml-1">Price (USDC) *</Text>
          <TextInput
            className="bg-dark-900 text-white rounded-xl px-4 py-3 mb-3 text-lg"
            placeholder="0.00"
            placeholderTextColor="#5c6bc0"
            keyboardType="decimal-pad"
            value={editing.price}
            onChangeText={(v) => setEditing({ ...editing, price: v })}
          />

          {/* Category */}
          <Text className="text-dark-300 mb-2 ml-1">Category</Text>
          <View className="flex-row flex-wrap gap-2 mb-4">
            {CATEGORIES.map((cat) => (
              <TouchableOpacity
                key={cat}
                className={`rounded-full px-4 py-2 ${
                  editing.category === cat
                    ? 'bg-brand-500'
                    : 'bg-dark-900'
                }`}
                onPress={() => setEditing({ ...editing, category: cat })}
              >
                <Text
                  className={
                    editing.category === cat
                      ? 'text-dark-950 font-semibold'
                      : 'text-dark-300'
                  }
                >
                  {cat}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Available toggle */}
          <View className="flex-row items-center justify-between bg-dark-900 rounded-xl px-4 py-3 mb-6">
            <Text className="text-white font-medium">Available</Text>
            <Switch
              value={editing.available}
              onValueChange={(v) => setEditing({ ...editing, available: v })}
              trackColor={{ false: '#283593', true: '#f9a825' }}
              thumbColor="#fff"
            />
          </View>

          {/* Buttons */}
          <View className="flex-row gap-3 mb-8">
            <TouchableOpacity
              className="flex-1 bg-dark-800 rounded-2xl py-4 items-center"
              onPress={() => {
                setEditing(null);
                setEditingId(null);
              }}
            >
              <Text className="text-dark-300 font-semibold">Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              className={`flex-1 rounded-2xl py-4 items-center ${
                saving ? 'bg-dark-700' : 'bg-brand-500'
              }`}
              onPress={saveItem}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator color="#0a0e1a" />
              ) : (
                <Text className="text-dark-950 font-bold">
                  {editingId ? 'Save Changes' : 'Add Item'}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

  // ── Item list ───────────────────────────────────────────────────
  return (
    <View className="flex-1 bg-dark-950">
      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
        renderItem={({ item }) => (
          <View className="bg-dark-900 rounded-2xl p-4 mb-3">
            <View className="flex-row">
              {item.imageUrl ? (
                <Image
                  source={{ uri: item.imageUrl }}
                  className="w-16 h-16 rounded-xl mr-3"
                  resizeMode="cover"
                />
              ) : (
                <View className="w-16 h-16 rounded-xl mr-3 bg-dark-800 items-center justify-center">
                  <Ionicons
                    name="fast-food-outline"
                    size={24}
                    color="#5c6bc0"
                  />
                </View>
              )}
              <View className="flex-1">
                <View className="flex-row items-center justify-between">
                  <Text className="text-white font-semibold flex-1">
                    {item.name}
                  </Text>
                  <View className="flex-row items-center ml-2">
                    <Switch
                      value={item.available}
                      onValueChange={() => toggleAvailability(item)}
                      trackColor={{ false: '#283593', true: '#66bb6a' }}
                      thumbColor="#fff"
                      style={{ transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }] }}
                    />
                  </View>
                </View>
                {item.description ? (
                  <Text
                    className="text-dark-400 text-sm mt-1"
                    numberOfLines={1}
                  >
                    {item.description}
                  </Text>
                ) : null}
                <View className="flex-row items-center justify-between mt-2">
                  <Text className="text-brand-500 font-bold">
                    ${item.price.toFixed(2)}
                  </Text>
                  <Text className="text-dark-500 text-xs">
                    {item.category}
                  </Text>
                </View>
              </View>
            </View>

            {/* Actions */}
            <View className="flex-row gap-2 mt-3">
              <TouchableOpacity
                className="flex-1 bg-dark-800 rounded-xl py-2.5 items-center flex-row justify-center"
                onPress={() => startEdit(item)}
              >
                <Ionicons name="pencil" size={16} color="#f9a825" />
                <Text className="text-brand-500 font-medium ml-2">
                  Edit
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                className="bg-dark-800 rounded-xl py-2.5 px-4 items-center flex-row justify-center"
                onPress={() => deleteItem(item)}
              >
                <Ionicons name="trash-outline" size={16} color="#ef5350" />
              </TouchableOpacity>
            </View>
          </View>
        )}
        ListEmptyComponent={
          <View className="items-center mt-16">
            <Ionicons
              name="fast-food-outline"
              size={48}
              color="#5c6bc0"
            />
            <Text className="text-dark-400 mt-4">
              No menu items yet
            </Text>
            <Text className="text-dark-500 text-sm mt-1">
              Add your first item to get started
            </Text>
          </View>
        }
      />

      {/* FAB — Add new item */}
      <TouchableOpacity
        className="absolute bottom-6 right-6 bg-brand-500 w-16 h-16 rounded-full items-center justify-center shadow-lg"
        onPress={() => startEdit()}
      >
        <Ionicons name="add" size={32} color="#0a0e1a" />
      </TouchableOpacity>
    </View>
  );
}
