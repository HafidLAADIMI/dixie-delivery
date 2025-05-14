import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    ScrollView,
    RefreshControl,
    TouchableOpacity,
    Image,
    StyleSheet,
    ActivityIndicator,
    Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Feather, Ionicons } from '@expo/vector-icons';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';

import { COLORS } from '@/constants/theme';
import { useLocation } from '@/contexts/LocationContext';
import { useAuth } from '@/contexts/AuthContext';
import { getOrders, Order } from '@/services/orderService';
import { getDeliverymanDetails, getDeliverymanByEmail } from '@/services/deliverymanService';

export default function HomeScreen() {
    /* ------------------------------------------------------------------ */
    /*  State                                                             */
    /* ------------------------------------------------------------------ */
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [active, setActive] = useState<Order | null>(null);
    const [deliveryman, setDeliveryman] = useState(null);
    const [loadingProfile, setLoadingProfile] = useState(true);
    const [error, setError] = useState(null);

    /* context */
    const { currentLocation } = useLocation();
    const { user } = useAuth();

    /* ------------------------------------------------------------------ */
    /*  Data fetch                                                         */
    /* ------------------------------------------------------------------ */
    const loadData = async () => {
        setRefreshing(true);
        try {
            const list = await getOrders();
            setOrders(list);
        } catch (error) {
            console.error("Error loading orders:", error);
            Alert.alert("Erreur", "Échec du chargement des commandes. Veuillez réessayer.");
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const fetchDeliverymanDetails = async () => {
        if (!user) {
            console.log('No user data available');
            setLoadingProfile(false);
            return;
        }

        console.log('Current user data:', user);

        try {
            let data = null;

            // Try fetching by deliverymanId first if available
            if (user.deliverymanId) {
                console.log('Fetching details for deliverymanId:', user.deliverymanId);
                data = await getDeliverymanDetails(user.deliverymanId);
            }

            // If no data found and we have an email, try fetching by email
            if (!data && user.email) {
                console.log('No data found by ID, trying to fetch by email:', user.email);
                data = await getDeliverymanByEmail(user.email);

                // If we found data by email but didn't have an ID before, we should
                // update our auth context with this ID (in a real app)
                if (data && !user.deliverymanId) {
                    console.log('Found deliveryman by email, deliverymanId:', data.id);
                    // You would update your auth context here
                }
            }

            if (data) {
                console.log('Deliveryman data retrieved:', data);
                setDeliveryman(data);
            } else {
                console.log('No deliveryman data found for this user');
                // We'll just use the user data we have
            }
        } catch (error) {
            console.error('Error fetching deliveryman details:', error);
            setError('Failed to load deliveryman details');
        } finally {
            setLoadingProfile(false);
        }
    };

    useEffect(() => {
        loadData();
        fetchDeliverymanDetails();
    }, [user]);

    /* ------------------------------------------------------------------ */
    /*  Derived stats                                                      */
    /* ------------------------------------------------------------------ */
    const todayStr = new Date().toDateString();
    const todayCount = orders.filter((o) => {
        try {
            const date = o.createdAt?.toDate?.() ??
                (o.createdAt ? new Date(o.createdAt) : null);
            return date && date.toDateString() === todayStr;
        } catch (e) {
            return false;
        }
    }).length;

    const pendingCount = orders.filter((o) => o.status === 'pending').length;

    /* ------------------------------------------------------------------ */
    /*  Helpers                                                            */
    /* ------------------------------------------------------------------ */
    const openDetails = (o: Order) => {
        if (o && o.id) {
            router.push(`/delivery/${o.userId}_${o.id}`);
        }
    };

    const setActiveWithValidation = (o: Order) => {
        if (o && o.coordinates &&
            typeof o.coordinates.latitude === 'number' &&
            typeof o.coordinates.longitude === 'number') {
            setActive(o);
        } else {
            console.warn("Invalid coordinates for order:", o.id);
        }
    };

    const region =
        currentLocation ?? {
            latitude: 23.7808,
            longitude: 90.3852,
            latitudeDelta: 0.02,
            longitudeDelta: 0.02,
        };

    /* ------------------------------------------------------------------ */
    /*  UI                                                                 */
    /* ------------------------------------------------------------------ */
    return (
        <SafeAreaView className="flex-1 bg-gray-50">
            {loading ? (
                <View className="flex-1 justify-center items-center">
                    <ActivityIndicator size="large" color={COLORS.primary.DEFAULT} />
                </View>
            ) : (
                <ScrollView
                    className="flex-1"
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={loadData} colors={[COLORS.primary.DEFAULT]} />}
                >
                    {/* header --------------------------------------------------- */}
                    <View className="bg-white px-4 pt-4 pb-6">
                        <View className="flex-row items-center justify-between">
                            <View className="flex-row items-center">
                                {/* Use data from either source, with fallbacks */}
                                <Image
                                    source={
                                        // Try to get profile image from multiple possible fields
                                        deliveryman?.profileImageUrl ?
                                            { uri: deliveryman.profileImageUrl } :
                                            user?.avatarUrl ?
                                                { uri: user.avatarUrl } :
                                                user?.profileImageUrl ?
                                                    { uri: user.profileImageUrl } :
                                                    require('@/assets/avatar-placeholder.png')
                                    }
                                    className="w-12 h-12 rounded-full mr-3"
                                />
                                <View>
                                    <Text className="text-gray-900 text-lg font-semibold">
                                        {/* Try to build full name from multiple possible sources */}
                                        Bonjour, {(() => {
                                        // If we have firstName and lastName in deliveryman data
                                        if (deliveryman?.firstName || deliveryman?.lastName) {
                                            return `${deliveryman.firstName || ''} ${deliveryman.lastName || ''}`.trim();
                                        }

                                        // If we have firstName and lastName directly in user
                                        if (user?.firstName || user?.lastName) {
                                            return `${user.firstName || ''} ${user.lastName || ''}`.trim();
                                        }

                                        // If we have a name field
                                        if (user?.name) {
                                            return user.name;
                                        }

                                        // Default
                                        return user?.email?.split('@')[0] || 'Livreur';
                                    })()}
                                    </Text>
                                    <Text className="text-gray-500">
                                        {deliveryman?.zone || user?.zone || 'Zone non définie'} • {deliveryman?.vehicle || user?.vehicle || 'Véhicule non défini'}
                                    </Text>
                                </View>
                            </View>

                            <TouchableOpacity
                                onPress={() => router.push('/(app)/notifications')}
                                className="w-10 h-10 bg-orange-100 rounded-full items-center justify-center"
                            >
                                <Feather name="bell" size={20} color={COLORS.primary.DEFAULT} />
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Display error if any */}
                    {error && (
                        <View className="mx-4 mt-2 bg-red-100 p-3 rounded-xl">
                            <Text className="text-red-500">{error}</Text>
                        </View>
                    )}

                    {/* stats ----------------------------------------------------- */}
                    <View className="flex-row mx-4 mt-4">
                        <View style={[styles.card, { marginRight: 8 }]}>
                            <Text className="text-gray-500 mb-1">Commandes du Jour</Text>
                            <View className="flex-row items-center justify-between">
                                <Text className="text-2xl font-bold">{todayCount}</Text>
                                <View className="w-9 h-9 bg-orange-100 rounded-full items-center justify-center">
                                    <Feather name="package" size={20} color={COLORS.primary.DEFAULT} />
                                </View>
                            </View>
                        </View>

                        <View style={[styles.card, { marginLeft: 8 }]}>
                            <Text className="text-gray-500 mb-1">En Attente</Text>
                            <View className="flex-row items-center justify-between">
                                <Text className="text-2xl font-bold">{pendingCount}</Text>
                                <View className="w-9 h-9 bg-orange-100 rounded-full items-center justify-center">
                                    <Feather name="clock" size={20} color={COLORS.primary.DEFAULT} />
                                </View>
                            </View>
                        </View>
                    </View>

                    {/* map ------------------------------------------------------- */}
                    <View className="mx-4 mt-4 bg-white rounded-xl overflow-hidden" style={styles.cardShadow}>
                        <Text className="text-lg font-semibold p-4 pb-2">Carte des Commandes</Text>
                        <View className="h-48 w-full">
                            <MapView provider={PROVIDER_GOOGLE} style={{ flex: 1 }} initialRegion={region} showsUserLocation>
                                {orders
                                    .filter(o => o.coordinates &&
                                        typeof o.coordinates.latitude === 'number' &&
                                        typeof o.coordinates.longitude === 'number')
                                    .map((o) => (
                                        <Marker
                                            key={o.id}
                                            coordinate={o.coordinates}
                                            onPress={() => setActiveWithValidation(o)}
                                        >
                                            <View className="bg-orange-500 p-2 rounded-full border-2 border-white">
                                                <Feather name="package" size={16} color="white" />
                                            </View>
                                        </Marker>
                                    ))
                                }
                            </MapView>
                        </View>
                    </View>

                    {/* list preview -------------------------------------------- */}
                    <View className="mx-4 mt-4 mb-6">
                        <View className="flex-row items-center justify-between mb-2">
                            <Text className="text-lg font-semibold">Dernières Commandes</Text>
                            <TouchableOpacity onPress={() => router.push('/(tabs)/deliveries')}>
                                <Text className="text-orange-500">Voir Tout</Text>
                            </TouchableOpacity>
                        </View>

                        {orders.length ? (
                            orders.slice(0, 5).map((o) => (
                                <TouchableOpacity key={o.id} onPress={() => openDetails(o)} style={styles.card} className="mb-3">
                                    <View className="flex-row justify-between items-center mb-1">
                                        <Text className="text-gray-800 font-semibold">#{o.id}</Text>
                                        <View
                                            className={`px-2 py-1 rounded-full ${
                                                o.status === 'pending'
                                                    ? 'bg-yellow-100'
                                                    : o.status === 'in-progress'
                                                        ? 'bg-blue-100'
                                                        : o.status === 'cancelled'
                                                            ? 'bg-red-100'
                                                            : 'bg-green-100'
                                            }`}
                                        >
                                            <Text
                                                className={`text-xs font-medium ${
                                                    o.status === 'pending'
                                                        ? 'text-yellow-700'
                                                        : o.status === 'in-progress'
                                                            ? 'text-blue-700'
                                                            : o.status === 'cancelled'
                                                                ? 'text-red-700'
                                                                : 'text-green-700'
                                                }`}
                                            >
                                                {o.status === 'pending' ? 'En attente' :
                                                    o.status === 'in-progress' ? 'En cours' :
                                                        o.status === 'cancelled' ? 'Annulée' : 'Terminée'}
                                            </Text>
                                        </View>
                                    </View>
                                    <Text className="text-gray-800 font-medium">{o.customerName || 'Client'}</Text>
                                    <Text className="text-gray-500 text-sm" numberOfLines={1}>
                                        {o.address || 'Pas d\'adresse'}
                                    </Text>
                                    <View className="flex-row justify-between items-center mt-1">
                                        <Text className="text-gray-600 text-xs">{o.items?.length || 0} article(s)</Text>
                                        <Text className="text-orange-500 font-semibold">
                                            ${typeof o.total === 'number' ? o.total.toFixed(2) : '0.00'}
                                        </Text>
                                    </View>
                                </TouchableOpacity>
                            ))
                        ) : (
                            <View style={styles.card} className="items-center">
                                <Feather name="package" size={40} color={COLORS.gray.light} />
                                <Text className="text-gray-500 mt-2">Aucune commande</Text>
                            </View>
                        )}
                    </View>
                </ScrollView>
            )}

            {/* tapped marker sheet ----------------------------------------- */}
            {active && (
                <View className="absolute bottom-0 left-0 right-0 bg-white rounded-t-xl p-4" style={styles.bottomShadow}>
                    <View className="flex-row justify-between items-center mb-2">
                        <View className="flex-row items-center">
                            <View className="bg-orange-100 p-2 rounded-full mr-3">
                                <Feather name="package" size={20} color={COLORS.primary.DEFAULT} />
                            </View>
                            <View>
                                <Text className="text-gray-500 text-xs">#{active.id}</Text>
                                <Text className="text-gray-900 font-semibold">{active.customerName || 'Client'}</Text>
                            </View>
                        </View>
                        <TouchableOpacity onPress={() => openDetails(active)} className="bg-orange-500 px-4 py-2 rounded-lg">
                            <Text className="text-white font-medium">Ouvrir</Text>
                        </TouchableOpacity>
                    </View>
                    <TouchableOpacity onPress={() => setActive(null)} className="absolute top-2 right-2">
                        <Feather name="x" size={20} color={COLORS.gray.dark} />
                    </TouchableOpacity>
                </View>
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    card: {
        backgroundColor: 'white',
        borderRadius: 12,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    cardShadow: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    bottomShadow: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 4,
    },
});