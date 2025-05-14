// app/(app)/deliveries.jsx
import React, { useEffect, useState, useCallback } from 'react';
import {
    View,
    Text,
    FlatList,
    TouchableOpacity,
    TextInput,
    ScrollView,
    RefreshControl,
    StatusBar,
    ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, Stack } from 'expo-router';
import { Feather, FontAwesome5 } from '@expo/vector-icons';

// Import du service de commande amélioré
import { getOrders } from '@/services/orderService';
import OrderCard from '@/components/OrderCard';
import DeliveryToggle from '@/components/DeliveryToggle';
import DeliveryStats from '@/components/DeliveryStats';

// Import ou définition de vos couleurs de thème
const COLORS = {
    primary: { DEFAULT: '#F97316', dark: '#EA580C' }, // Orange
    gray: { light: '#9CA3AF' }
};

export default function DeliveriesScreen() {
    const [orders, setOrders] = useState([]);
    const [filteredOrders, setFilteredOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [search, setSearch] = useState('');
    const [activeTab, setActiveTab] = useState(0); // 0=Tous, 1=En Attente, 2=En Cours, 3=Terminées
    const [deliveryMode, setDeliveryMode] = useState(true); // true = livraison, false = ramassage

    // Charger toutes les commandes
    const loadData = useCallback(async () => {
        setRefreshing(true);
        try {
            const ordersList = await getOrders();
            setOrders(ordersList);

            // Appliquer le filtrage initial
            applyFilters(ordersList, search, activeTab);
        } catch (error) {
            console.error('Erreur lors du chargement des commandes:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [search, activeTab]);

    // Appliquer tous les filtres
    const applyFilters = useCallback((ordersList, searchQuery, tabIndex) => {
        let result = [...ordersList];

        // Appliquer le filtre de recherche
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            result = result.filter(o =>
                (o.customerName?.toLowerCase().includes(query)) ||
                (o.address?.toLowerCase().includes(query)) ||
                (o.id?.toLowerCase().includes(query))
            );
        }

        // Appliquer le filtre par onglet
        switch(tabIndex) {
            case 1: // En Attente
                result = result.filter(o => o.status === 'pending');
                break;
            case 2: // En Cours
                result = result.filter(o => o.status === 'in-progress');
                break;
            case 3: // Terminées
                result = result.filter(o => o.status === 'completed');
                break;
            // Le cas 0 est "Tous", donc pas de filtrage nécessaire
        }

        setFilteredOrders(result);
    }, []);

    // Charger les données au montage
    useEffect(() => {
        loadData();
    }, [loadData]);

    // Quand les filtres changent, les appliquer
    useEffect(() => {
        applyFilters(orders, search, activeTab);
    }, [orders, search, activeTab, applyFilters]);

    // Naviguer vers les détails de la commande
    const openDetails = (order) => {
        if (order && order.id && order.userId) {
            router.push(`/delivery/${order.userId}_${order.id}`);
        }
    };

    // Obtenir les compteurs pour les onglets
    const getPendingCount = () => orders.filter(o => o.status === 'pending').length;
    const getActiveCount = () => orders.filter(o => o.status === 'progress').length;
    const getCompletedCount = () => orders.filter(o => o.status === 'delivered').length;

    return (
        <SafeAreaView className="flex-1 bg-gray-50">
            <StatusBar barStyle="light-content" backgroundColor={COLORS.primary.DEFAULT} />

            <Stack.Screen
                options={{
                    headerTitle: 'Commandes à Livrer',
                    headerTintColor: '#fff',
                    headerStyle: { backgroundColor: COLORS.primary.DEFAULT },
                }}
            />

            {/* Bascule entre Livraison et Ramassage */}
            <DeliveryToggle
                deliveryMode={deliveryMode}
                onToggle={(mode) => setDeliveryMode(mode)}
            />

            {/* Statistiques des Livraisons */}
            <DeliveryStats
                completedCount={getCompletedCount()}
                pendingCount={getPendingCount()}
            />

            {/* Barre de recherche */}
            <View className="p-4 bg-white border-b border-gray-100">
                <View className="flex-row items-center bg-gray-100 rounded-lg px-3 py-2">
                    <Feather name="search" size={20} color="#6B7280" />
                    <TextInput
                        className="flex-1 ml-2 text-gray-800 text-base"
                        placeholder="Rechercher des commandes..."
                        placeholderTextColor="#9CA3AF"
                        value={search}
                        onChangeText={setSearch}
                    />
                    {search ? (
                        <TouchableOpacity onPress={() => setSearch('')}>
                            <Feather name="x" size={20} color="#6B7280" />
                        </TouchableOpacity>
                    ) : null}
                </View>
            </View>

            {/* Onglets */}
            <View className="bg-white">
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerClassName="px-2"
                >
                    <TouchableOpacity
                        className={`py-3 px-4 relative ${activeTab === 0 ? 'border-b-2 border-orange-500' : ''}`}
                        onPress={() => setActiveTab(0)}
                    >
                        <Text className={`${activeTab === 0 ? 'text-orange-500 font-semibold' : 'text-gray-500'}`}>
                            Toutes ({orders.length})
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        className={`py-3 px-4 relative ${activeTab === 1 ? 'border-b-2 border-orange-500' : ''}`}
                        onPress={() => setActiveTab(1)}
                    >
                        <Text className={`${activeTab === 1 ? 'text-orange-500 font-semibold' : 'text-gray-500'}`}>
                            En Attente ({getPendingCount()})
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        className={`py-3 px-4 relative ${activeTab === 2 ? 'border-b-2 border-orange-500' : ''}`}
                        onPress={() => setActiveTab(2)}
                    >
                        <Text className={`${activeTab === 2 ? 'text-orange-500 font-semibold' : 'text-gray-500'}`}>
                            En Cours ({getActiveCount()})
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        className={`py-3 px-4 relative ${activeTab === 3 ? 'border-b-2 border-orange-500' : ''}`}
                        onPress={() => setActiveTab(3)}
                    >
                        <Text className={`${activeTab === 3 ? 'text-orange-500 font-semibold' : 'text-gray-500'}`}>
                            Terminées ({getCompletedCount()})
                        </Text>
                    </TouchableOpacity>
                </ScrollView>
            </View>

            {/* État de chargement */}
            {loading ? (
                <View className="flex-1 justify-center items-center">
                    <ActivityIndicator size="large" color={COLORS.primary.DEFAULT} />
                    <Text className="mt-4 text-gray-600">Chargement des commandes...</Text>
                </View>
            ) : (
                <>
                    {/* Liste des commandes */}
                    <FlatList
                        data={filteredOrders}
                        renderItem={({ item }) => (
                            <OrderCard order={item} onPress={openDetails} />
                        )}
                        keyExtractor={item => item.id}
                        contentContainerClassName="pt-2 pb-24"
                        refreshControl={
                            <RefreshControl
                                refreshing={refreshing}
                                onRefresh={loadData}
                                colors={[COLORS.primary.DEFAULT]}
                            />
                        }
                        ListEmptyComponent={
                            <View className="flex-1 items-center justify-center mt-16">
                                <FontAwesome5 name="shipping-fast" size={50} color="#CBD5E0" />
                                <Text className="text-gray-500 mt-4 text-center text-lg font-medium">
                                    Aucune commande trouvée
                                </Text>
                                <Text className="text-gray-400 text-center mt-2 mx-12">
                                    {activeTab === 1
                                        ? 'Aucune livraison en attente pour le moment'
                                        : activeTab === 2
                                            ? 'Aucune livraison en cours'
                                            : activeTab === 3
                                                ? 'Aucune livraison terminée pour l\'instant'
                                                : 'Aucune commande ne correspond à votre recherche'}
                                </Text>

                                {search && (
                                    <TouchableOpacity
                                        className="mt-6 bg-orange-500 px-6 py-3 rounded-lg"
                                        onPress={() => setSearch('')}
                                    >
                                        <Text className="text-white font-medium">Effacer la recherche</Text>
                                    </TouchableOpacity>
                                )}
                            </View>
                        }
                    />

                    {/* Notification des commandes en attente */}
                    {getPendingCount() > 0 && activeTab !== 1 && (
                        <TouchableOpacity
                            className="absolute bottom-6 right-6 bg-orange-500 rounded-full shadow-lg px-4 py-3"
                            onPress={() => setActiveTab(1)}
                        >
                            <View className="flex-row items-center">
                                <Feather name="clock" size={18} color="white" />
                                <Text className="text-white font-bold ml-2">
                                    {getPendingCount()} En Attente
                                </Text>
                            </View>
                        </TouchableOpacity>
                    )}
                </>
            )}
        </SafeAreaView>
    );
}