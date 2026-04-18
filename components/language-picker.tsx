import { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  FlatList,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { supportedLocales, setLanguage } from '@/i18n';

interface LanguagePickerProps {
  visible: boolean;
  onClose: () => void;
}

export default function LanguagePicker({ visible, onClose }: LanguagePickerProps) {
  const { t, i18n } = useTranslation();
  const [changing, setChanging] = useState(false);

  const handleSelect = async (code: string) => {
    if (code === i18n.language) {
      onClose();
      return;
    }
    setChanging(true);
    try {
      await setLanguage(code);
    } finally {
      setChanging(false);
      onClose();
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView className="flex-1 bg-dark-950">
        {/* Header */}
        <View className="flex-row items-center justify-between px-4 py-3 border-b border-dark-800">
          <Text className="text-white text-xl font-bold">
            {t('language.title')}
          </Text>
          <TouchableOpacity onPress={onClose} hitSlop={12}>
            <Ionicons name="close" size={24} color="#9fa8da" />
          </TouchableOpacity>
        </View>

        {/* Language list */}
        <FlatList
          data={supportedLocales}
          keyExtractor={(item) => item.code}
          contentContainerStyle={{ paddingVertical: 8 }}
          renderItem={({ item }) => {
            const isActive = i18n.language === item.code;
            return (
              <TouchableOpacity
                className={`flex-row items-center justify-between mx-4 my-1 px-4 py-4 rounded-2xl ${
                  isActive ? 'bg-brand-500/20' : 'bg-dark-900'
                }`}
                onPress={() => handleSelect(item.code)}
                disabled={changing}
              >
                <View>
                  <Text
                    className={`text-lg font-semibold ${
                      isActive ? 'text-brand-500' : 'text-white'
                    }`}
                  >
                    {item.nativeName}
                  </Text>
                  <Text className="text-dark-400 text-sm mt-0.5">
                    {item.name}
                  </Text>
                </View>
                {isActive && (
                  <Ionicons name="checkmark-circle" size={24} color="#f9a825" />
                )}
              </TouchableOpacity>
            );
          }}
        />
      </SafeAreaView>
    </Modal>
  );
}
