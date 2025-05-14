// components/DeliveryStats.tsx
import { View, Text } from 'react-native';

type DeliveryStatsProps = {
    completedCount: number;
    pendingCount: number;
};

export default function DeliveryStats({ completedCount, pendingCount }: DeliveryStatsProps) {
    // Ensure numbers are displayed with leading zeros
    const formatCount = (count: number) => count.toString().padStart(2, '0');

    return (
        <View className="flex-row bg-white py-1">
            <View className="flex-1 bg-[#0047AB] m-1 p-4 rounded items-center justify-center">
                <Text className="text-lg font-bold text-white mb-1">
                    {formatCount(completedCount)}
                </Text>
                <Text className="text-sm text-white">Livraisons Terminées</Text>
            </View>

            <View className="flex-1 bg-[#0047AB] m-1 p-4 rounded items-center justify-center">
                <Text className="text-lg font-bold text-white mb-1">
                    {formatCount(pendingCount)}
                </Text>
                <Text className="text-sm text-white">Livraisons En Attente</Text>
            </View>
        </View>
    );
}