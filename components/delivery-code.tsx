import { View, Text } from 'react-native';
import QRCode from 'react-native-qrcode-svg';

interface DeliveryCodeProps {
  label: string;
  code: string;
}

export function DeliveryCode({ label, code }: DeliveryCodeProps) {
  return (
    <View className="bg-dark-900 rounded-2xl p-4 items-center">
      <Text className="text-dark-400 text-sm mb-2">{label}</Text>
      <View className="bg-white rounded-xl p-3">
        <QRCode value={code} size={160} />
      </View>
      <Text className="text-white font-mono text-2xl font-bold mt-3 tracking-widest">
        {code}
      </Text>
      <Text className="text-dark-500 text-xs mt-2">
        Show this to the {label.includes('Pickup') ? 'driver' : 'delivery person'}
      </Text>
    </View>
  );
}
