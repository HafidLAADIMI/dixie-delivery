// components/OrderCard.jsx
import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Feather, MaterialIcons } from '@expo/vector-icons';
import { Order } from '@/services/orderService';

const OrderCard = ({ order, onPress }) => {
    // Format date from various possible timestamp formats
    const formatDate = (timestamp) => {
        if (!timestamp) return 'Date inconnue';

        try {
            // Handle Firestore timestamp objects
            if (timestamp && timestamp.seconds) {
                const date = new Date(timestamp.seconds * 1000);
                const hours = date.getHours().toString().padStart(2, '0');
                const minutes = date.getMinutes().toString().padStart(2, '0');
                return `${date.toLocaleDateString()} à ${hours}:${minutes}`;
            }

            // Handle ISO date strings
            if (typeof timestamp === 'string') {
                const date = new Date(timestamp);
                if (!isNaN(date.getTime())) {
                    const hours = date.getHours().toString().padStart(2, '0');
                    const minutes = date.getMinutes().toString().padStart(2, '0');
                    return `${date.toLocaleDateString()} à ${hours}:${minutes}`;
                }
            }

            // Handle Date objects or .toDate() method from Firestore
            const date = timestamp?.toDate?.() ??
                (timestamp instanceof Date ? timestamp : new Date());

            const hours = date.getHours().toString().padStart(2, '0');
            const minutes = date.getMinutes().toString().padStart(2, '0');

            return `${date.toLocaleDateString()} à ${hours}:${minutes}`;
        } catch (error) {
            console.error('Error formatting date:', error);
            return 'Date inconnue';
        }
    };

    // Get status badge properties
    const getStatusBadge = () => {
        switch (order.status) {
            case 'pending':
                return {
                    bgColor: 'bg-yellow-100',
                    textColor: 'text-yellow-700',
                    icon: 'clock'
                };
            case 'progress':
                return {
                    bgColor: 'bg-blue-100',
                    textColor: 'text-blue-700',
                    icon: 'truck'
                };
            case 'completed':
            case 'delivered':
                return {
                    bgColor: 'bg-green-100',
                    textColor: 'text-green-700',
                    icon: 'check-circle'
                };
            case 'cancelled':
                return {
                    bgColor: 'bg-red-100',
                    textColor: 'text-red-700',
                    icon: 'x-circle'
                };
            case 'confirmed':
                return {
                    bgColor: 'bg-purple-100',
                    textColor: 'text-purple-700',
                    icon: 'check'
                };
            default:
                return {
                    bgColor: 'bg-gray-100',
                    textColor: 'text-gray-700',
                    icon: 'help-circle'
                };
        }
    };

    // Get payment badge properties
    const getPaymentBadge = () => {
        // Check payment status first
        if (order.paymentStatus === 'paid') {
            return {
                bgColor: 'bg-green-100',
                textColor: 'text-green-700',
                label: 'Payé'
            };
        }

        // Check payment method
        switch (order.paymentMethod) {
            case 'card':
            case 'online_payment':
                return {
                    bgColor: 'bg-pink-100',
                    textColor: 'text-pink-700',
                    label: 'Paiement En Ligne'
                };
            case 'cash_on_delivery':
            case 'cash':
                return {
                    bgColor: 'bg-yellow-100',
                    textColor: 'text-yellow-700',
                    label: 'Paiement à la Livraison'
                };
            default:
                return {
                    bgColor: 'bg-gray-100',
                    textColor: 'text-gray-700',
                    label: order.paymentMethod || 'Paiement à la Livraison'
                };
        }
    };

    // Format currency amount
    const formatCurrency = (amount) => {
        if (typeof amount !== 'number' || isNaN(amount)) return '0,00 MAD';
        return `${amount.toFixed(2).replace('.', ',')} MAD`;
    };

    // Calculate total number of items
    const getTotalItems = () => {
        if (!Array.isArray(order.items)) return 0;

        return order.items.reduce((sum, item) => {
            const quantity = parseInt(item.quantity || 1);
            return isNaN(quantity) ? sum : sum + quantity;
        }, 0);
    };

    // Get order ID to display (truncated or formatted)
    const getDisplayOrderId = () => {
        if (!order.id) return 'Inconnu';

        // If ID is very long (like Firestore auto-ID), truncate it
        if (order.id.length > 8) {
            return order.id.substring(0, 8);
        }

        return order.id;
    };

    const statusBadge = getStatusBadge();
    const paymentBadge = getPaymentBadge();
    const totalItems = getTotalItems();

    return (
        <TouchableOpacity
            className="bg-white rounded-xl mx-4 mb-4 shadow-md overflow-hidden active:opacity-90"
            onPress={() => onPress(order)}
        >
            {/* Header with order ID and status */}
            <View className="flex-row justify-between items-center px-4 py-3 border-b border-gray-100">
                <View className="flex-row items-center">
                    <Feather name="package" size={15} color="#F97316" className="mr-2" />
                    <Text className="text-gray-800 font-semibold">
                        #{getDisplayOrderId()}
                    </Text>
                </View>

                <View className={`flex-row items-center px-2 py-1 rounded-full ${statusBadge.bgColor}`}>
                    <Feather name={statusBadge.icon} size={12} color="#000" className="mr-1" />
                    <Text className={`text-xs font-medium ${statusBadge.textColor}`}>
                        {Order.getStatusDisplay(order.status)}
                    </Text>
                </View>
            </View>

            {/* Main content */}
            <View className="p-4">
                {/* Customer info and payment */}
                <View className="flex-row justify-between items-start mb-3">
                    <View className="flex-1">
                        <Text className="text-gray-900 font-semibold text-base">
                            {order.customerName || 'Client'}
                        </Text>
                        <Text className="text-gray-500 text-xs">
                            {formatDate(order.createdAt || order.date)}
                        </Text>
                    </View>

                    <View className={`px-2 py-1 rounded-md ${paymentBadge.bgColor}`}>
                        <Text className={`text-xs font-medium ${paymentBadge.textColor}`}>
                            {paymentBadge.label}
                        </Text>
                    </View>
                </View>

                {/* Address */}
                <View className="flex-row mb-3">
                    <MaterialIcons name="location-on" size={16} color="#6B7280" className="mt-1 mr-2" />
                    <Text className="text-gray-600 text-sm flex-1" numberOfLines={2}>
                        {order.address || 'Aucune adresse fournie'}
                    </Text>
                </View>

                {/* Phone number - only if available */}
                {order.customerPhone && (
                    <View className="flex-row mb-3">
                        <Feather name="phone" size={16} color="#6B7280" className="mt-1 mr-2" />
                        <Text className="text-gray-600 text-sm">{order.customerPhone}</Text>
                    </View>
                )}

                {/* Order summary and price */}
                <View className="flex-row justify-between items-center">
                    <View className="flex-row items-center">
                        <Feather name="shopping-bag" size={14} color="#6B7280" className="mr-2" />
                        <Text className="text-gray-600 text-sm">
                            {totalItems} {totalItems <= 1 ? 'article' : 'articles'}
                        </Text>
                    </View>

                    <Text className="text-orange-500 font-bold text-base">
                        {formatCurrency(order.total)}
                    </Text>
                </View>

                {/* Delivery instructions when available */}
                {order.deliveryInstructions && (
                    <View className="mt-2 pt-2 border-t border-gray-100">
                        <Text className="text-gray-600 text-xs italic" numberOfLines={2}>
                            {order.deliveryInstructions}
                        </Text>
                    </View>
                )}
            </View>

            {/* Action buttons based on status */}
            {order.status === 'pending' && (
                <TouchableOpacity
                    className="bg-orange-500 py-3 items-center"
                    onPress={() => onPress(order)}
                >
                    <Text className="text-white font-semibold text-sm">Accepter la Livraison</Text>
                </TouchableOpacity>
            )}

            {order.status === 'in-progress' && (
                <TouchableOpacity
                    className="bg-blue-500 py-3 items-center"
                    onPress={() => onPress(order)}
                >
                    <Text className="text-white font-semibold text-sm">Navigation vers Client</Text>
                </TouchableOpacity>
            )}

            {order.status === 'confirmed' && (
                <TouchableOpacity
                    className="bg-purple-500 py-3 items-center"
                    onPress={() => onPress(order)}
                >
                    <Text className="text-white font-semibold text-sm">Démarrer la Livraison</Text>
                </TouchableOpacity>
            )}
        </TouchableOpacity>
    );
};

export default OrderCard;