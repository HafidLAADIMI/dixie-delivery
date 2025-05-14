// components/DeliveryToggle.tsx
import { View, Text, TouchableOpacity } from 'react-native';

type DeliveryToggleProps = {
    deliveryMode: boolean;
    onToggle: (mode: boolean) => void;
};

export default function DeliveryToggle({ deliveryMode, onToggle }: DeliveryToggleProps) {
    return (
        <View className="flex-row bg-white border-b border-gray-100">
            <TouchableOpacity
                className={`flex-1 py-3 items-center justify-center ${deliveryMode ? 'bg-[#0047AB]' : 'bg-white'}`}
                onPress={() => onToggle(true)}
            >
                <Text className={`text-base ${deliveryMode ? 'font-bold text-white' : 'text-gray-600'}`}>
                    Livraison
                </Text>
            </TouchableOpacity>

            <TouchableOpacity
                className={`flex-1 py-3 items-center justify-center ${!deliveryMode ? 'bg-[#0047AB]' : 'bg-white'}`}
                onPress={() => onToggle(false)}
            >
                <Text className={`text-base ${!deliveryMode ? 'font-bold text-white' : 'text-gray-600'}`}>
                    Ramassage
                </Text>
            </TouchableOpacity>
        </View>
    );
}