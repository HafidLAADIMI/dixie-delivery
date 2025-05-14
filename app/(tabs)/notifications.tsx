import { View, Text, FlatList, TouchableOpacity } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';

export default function NotificationsScreen() {
    // Mock notifications data
    const notifications = [
        {
            id: '1',
            title: 'Nouvelle Commande Assignée',
            message: 'Une nouvelle commande de livraison #B182450 vous a été assignée',
            time: 'Il y a 10 min',
            read: false,
            icon: 'cube',
        },
        {
            id: '2',
            title: 'Livraison Terminée',
            message: 'La commande #B182427 a été marquée comme livrée',
            time: 'Il y a 1 heure',
            read: true,
            icon: 'checkmark-circle',
        },
        {
            id: '3',
            title: 'Mise à Jour du Planning',
            message: 'Votre planning de livraison pour demain a été mis à jour',
            time: 'Hier',
            read: true,
            icon: 'calendar',
        },
    ];

    const renderNotification = ({ item }) => (
        <TouchableOpacity
            className={`p-4 border-b border-gray-100 flex-row ${!item.read ? 'bg-blue-50' : ''}`}
        >
            <View className="w-10 h-10 rounded-full bg-[#0047AB] items-center justify-center mr-3">
                <Ionicons name={item.icon} size={20} color="#fff" />
            </View>

            <View className="flex-1">
                <View className="flex-row justify-between items-center mb-1">
                    <Text className="font-bold text-base">{item.title}</Text>
                    <Text className="text-xs text-gray-500">{item.time}</Text>
                </View>
                <Text className="text-sm text-gray-700">{item.message}</Text>
            </View>

            {!item.read && (
                <View className="w-3 h-3 rounded-full bg-[#0047AB] ml-2" />
            )}
        </TouchableOpacity>
    );

    return (
        <View className="flex-1 bg-white">
            <StatusBar style="light" />
            {/* Notification List */}
            <FlatList
                data={notifications}
                keyExtractor={(item) => item.id}
                renderItem={renderNotification}
                contentContainerStyle={{ flexGrow: 1 }}
                ListEmptyComponent={
                    <View className="flex-1 justify-center items-center p-5">
                        <Ionicons name="notifications-off" size={48} color="#CCCCCC" />
                        <Text className="text-gray-500 mt-2">Aucune notification</Text>
                    </View>
                }
            />
        </View>
    );
}