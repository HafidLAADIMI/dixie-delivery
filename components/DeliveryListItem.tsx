// components/DeliveryListItem.jsx
import { View, Text, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';

export default function DeliveryListItem({ delivery, onPress }) {
    // Couleurs du badge de statut
    const getStatusColor = (status) => {
        switch (status) {
            case 'completed': return 'bg-green-500';
            case 'in-progress': return 'bg-blue-500';
            case 'cancelled': return 'bg-red-500';
            default: return 'bg-yellow-500';
        }
    };

    // Traduire le statut en français
    const translateStatus = (status) => {
        switch (status) {
            case 'completed': return 'Livrée';
            case 'in-progress': return 'En Cours';
            case 'cancelled': return 'Annulée';
            default: return 'En Attente';
        }
    };

    // Formater la devise
    const formatCurrency = (amount) => {
        if (typeof amount !== 'number') return '0,00 MAD';
        return `${amount.toFixed(2).replace('.', ',')} MAD`;
    };

    return (
        <TouchableOpacity
            className="bg-white rounded-lg p-4 mb-3 flex-row shadow-sm"
            onPress={() => onPress(delivery)}
        >
            <View className="flex-1">
                {/* En-tête avec ID Commande et Statut */}
                <View className="flex-row justify-between items-center mb-2">
                    <Text className="text-base font-bold">#{delivery.id.substring(0, 8)}</Text>
                    <View className={`px-2 py-1 rounded ${getStatusColor(delivery.status)}`}>
                        <Text className="text-xs text-white font-bold">{translateStatus(delivery.status)}</Text>
                    </View>
                </View>

                {/* Détails Client */}
                <Text className="text-sm mb-0.5">Client: {delivery.customerName}</Text>
                <Text className="text-sm text-gray-600 mb-0.5">Tél: {delivery.customerPhone}</Text>
                <Text className="text-sm text-gray-600 mb-3" numberOfLines={2}>
                    Adresse: {delivery.address}
                </Text>

                {/* Pied de page avec Paiement et Détails */}
                <View className="flex-row justify-between items-center">
                    <View className="flex-row items-center">
                        <Text className="font-bold text-gray-700 mr-2">Total:</Text>
                        <Text className="font-bold text-orange-500">{formatCurrency(delivery.total)}</Text>
                    </View>

                    <View className="flex-row">
                        {delivery.paymentMethod === 'cash_on_delivery' && delivery.paymentStatus !== 'paid' ? (
                            <View className="px-2 py-1 rounded bg-yellow-100">
                                <Text className="text-yellow-700 text-xs font-medium">À Percevoir</Text>
                            </View>
                        ) : (
                            <View className="px-2 py-1 rounded bg-green-100">
                                <Text className="text-green-700 text-xs font-medium">Payé</Text>
                            </View>
                        )}
                    </View>
                </View>
            </View>

            {/* Boutons d'action */}
            <View className="ml-3 justify-center">
                <TouchableOpacity className="w-9 h-9 rounded-full border border-orange-500 items-center justify-center mb-2">
                    <Feather name="phone" size={18} color="#F97316" />
                </TouchableOpacity>

                <TouchableOpacity className="w-9 h-9 rounded-full border border-orange-500 items-center justify-center">
                    <Feather name="map-pin" size={18} color="#F97316" />
                </TouchableOpacity>
            </View>
        </TouchableOpacity>
    );
}
