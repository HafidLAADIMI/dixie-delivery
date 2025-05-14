// components/ActiveDeliveryCard.tsx
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

type DeliveryCardProps = {
    delivery: {
        id: string;
        name: string;
        address: string;
        cod?: number;
    };
    onDetailsPress: () => void;
};

export default function ActiveDeliveryCard({ delivery, onDetailsPress }: DeliveryCardProps) {
    return (
        <View className="bg-[#0047AB] rounded-lg p-4 mx-2 my-2 flex-row justify-between shadow-md">
            <View className="flex-3">
                <Text className="text-base font-bold text-white mb-1">{delivery.name}</Text>
                <Text className="text-sm text-gray-200 mb-1" numberOfLines={2}>{delivery.address}</Text>
                <Text className="text-xs text-white">
                    <Text>ID Commande: </Text>
                    <Text className="font-bold">{delivery.id}</Text>
                </Text>
            </View>

            <View className="flex-1 items-end justify-between">
                {delivery.cod && (
                    <Text className="text-sm text-white mb-2">
                        <Text>Paiement: </Text>
                        <Text className="font-bold">${delivery.cod.toFixed(2)}</Text>
                    </Text>
                )}

                <TouchableOpacity
                    className="bg-white py-1 px-3 rounded"
                    onPress={onDetailsPress}
                >
                    <Text className="text-xs font-bold text-[#0047AB]">Détails</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}