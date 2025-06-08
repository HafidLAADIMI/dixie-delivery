// app/(app)/delivery/[id].jsx - Fixed with map error handling
import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    Alert,
    Platform,
    ActivityIndicator,
    Image,
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather, MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Linking from 'expo-linking';
import BottomSheet from '@/components/BottomSheet';

// Import du service de commande amélioré
import { getOrderOnce, updateOrderStatus } from '@/services/orderService';
import { useLocation } from '@/contexts/LocationContext';

// Import ou définition des couleurs de thème
const COLORS = {
    primary: { DEFAULT: '#F97316', dark: '#EA580C' }, // Orange
    gray: { light: '#9CA3AF' }
};

export default function DeliveryDetailsScreen() {
    const { id } = useLocalSearchParams();
    const router = useRouter();
    const { currentLocation } = useLocation();
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [mapType, setMapType] = useState('standard');
    const [mapExpanded, setMapExpanded] = useState(false);
    const [activeTab, setActiveTab] = useState('details');
    const [showCompletionSheet, setShowCompletionSheet] = useState(false);

    // Map state
    const [mapError, setMapError] = useState(false);
    const [mapReady, setMapReady] = useState(false);

    // Refs
    const mapRef = useRef(null);
    const scrollViewRef = useRef(null);

    // Add map error handler
    const handleMapError = (error) => {
        console.error('Map Error in delivery details:', error);
        setMapError(true);
    };

    // Helper function to get valid coordinates
    const getValidCoordinates = (orderData) => {
        // First check if coordinates exist and are valid
        if (orderData.coordinates &&
            typeof orderData.coordinates.latitude === 'number' &&
            typeof orderData.coordinates.longitude === 'number') {
            return orderData.coordinates;
        }

        // Default coordinates if not found (Casablanca, Morocco)
        return {
            latitude: 33.5731,
            longitude: -7.5898
        };
    };

    // Récupérer les données de la commande
    useEffect(() => {
        const loadOrderDetails = async () => {
            try {
                if (!id) {
                    throw new Error('Aucun ID de commande fourni');
                }

                const idParts = id.split('_');
                if (idParts.length !== 2) {
                    throw new Error('Format d\'ID de commande invalide');
                }

                const [userId, orderId] = idParts;

                // Obtenir la commande avec des champs standardisés
                const orderData = await getOrderOnce(userId, orderId);

                if (!orderData) {
                    throw new Error('Commande introuvable');
                }

                // Ensure valid coordinates exist
                const coordinates = getValidCoordinates(orderData);

                // Add or update coordinates in the order data
                orderData.coordinates = coordinates;

                console.log('Order data loaded:', orderData);
                setOrder(orderData);

                // Si la référence de carte existe, animer vers l'emplacement du client
                if (mapRef.current && coordinates && mapReady) {
                    setTimeout(() => {
                        mapRef.current.animateToRegion({
                            latitude: coordinates.latitude,
                            longitude: coordinates.longitude,
                            latitudeDelta: 0.02,
                            longitudeDelta: 0.02,
                        }, 1000);
                    }, 500);
                }
            } catch (error) {
                console.error('Erreur lors du chargement des détails de la commande:', error);
                Alert.alert('Erreur', 'Échec du chargement des détails de la commande');
                router.back();
            } finally {
                setLoading(false);
            }
        };

        loadOrderDetails();
    }, [id, router, mapReady]);

    // Générer les coordonnées de l'itinéraire entre le livreur et le client
    const getRouteCoordinates = () => {
        if (!currentLocation || !order?.coordinates) return [];

        return [
            { ...currentLocation },
            {
                latitude: order.coordinates.latitude,
                longitude: order.coordinates.longitude,
            },
        ];
    };

    // Formater la date
    const formatDate = (timestamp) => {
        if (!timestamp) return 'Date inconnue';

        try {
            // Handle Firestore timestamp objects
            if (timestamp.seconds) {
                const date = new Date(timestamp.seconds * 1000);
                const hours = date.getHours().toString().padStart(2, '0');
                const minutes = date.getMinutes().toString().padStart(2, '0');
                return `${date.toLocaleDateString()} à ${hours}:${minutes}`;
            }

            // Handle date strings or Date objects
            const date = typeof timestamp === 'string' ? new Date(timestamp) : timestamp;
            const hours = date.getHours().toString().padStart(2, '0');
            const minutes = date.getMinutes().toString().padStart(2, '0');
            return `${date.toLocaleDateString()} à ${hours}:${minutes}`;
        } catch (error) {
            console.error('Error formatting date:', error);
            return 'Date inconnue';
        }
    };

    // Formater la devise
    const formatCurrency = (amount) => {
        if (typeof amount !== 'number') return '0,00 MAD';
        return `${amount.toFixed(2).replace('.', ',')} MAD`;
    };

    // Appeler le client
    const callCustomer = () => {
        if (!order?.customerPhone) {
            Alert.alert('Erreur', 'Aucun numéro de téléphone disponible');
            return;
        }
        Linking.openURL(`tel:${order.customerPhone}`);
    };

    // Ouvrir l'application de navigation
    const navigateToCustomer = () => {
        if (!order?.coordinates) {
            Alert.alert('Erreur', 'Aucune coordonnée de localisation disponible');
            return;
        }

        const { latitude, longitude } = order.coordinates;
        const url = Platform.select({
            ios: `maps:0,0?q=${latitude},${longitude}`,
            android: `geo:0,0?q=${latitude},${longitude}`,
        });

        if (url) {
            Linking.openURL(url);
        }
    };

    // Commencer la livraison (mettre à jour le statut à en-cours)
    const startDelivery = async () => {
        if (!order || !id) {
            Alert.alert('Erreur', 'Impossible de démarrer la livraison : détails de commande manquants');
            return;
        }

        try {
            const idParts = id.split('_');
            const [userId, orderId] = idParts;

            await updateOrderStatus(userId, orderId, 'processing');

            // Mettre à jour l'état local
            setOrder({
                ...order,
                status: 'in-progress'
            });

            Alert.alert('Succès', 'Livraison démarrée avec succès');
        } catch (error) {
            console.error('Erreur lors du démarrage de la livraison:', error);
            Alert.alert('Erreur', 'Échec du démarrage de la livraison');
        }
    };

    // Terminer la livraison et montrer la feuille de finalisation
    const showDeliveryCompletion = () => {
        setShowCompletionSheet(true);
    };

    // Compléter la livraison (mettre à jour le statut à completed)
    const completeDelivery = async (withPayment = false) => {
        if (!order || !id) {
            Alert.alert('Erreur', 'Impossible de terminer la livraison : détails de commande manquants');
            return;
        }

        try {
            const idParts = id.split('_');
            const [userId, orderId] = idParts;

            await updateOrderStatus(userId, orderId, 'delivered', {
                receivedBy: order.customerName || 'Client',
                notes: 'Livraison terminée avec succès',
                amountCollected: withPayment ? (order.total || 0) : 0,
                signatureUrl: null,
                proofOfDeliveryUrl: null,
                deliveredAt: new Date(),
                deliveredBy: 'current-driver-id',
                deliverymanName: 'Livreur Actuel'
            });

            // Fermer la feuille de finalisation
            setShowCompletionSheet(false);

            // Naviguer vers l'écran de succès
            router.replace('/delivery-success');
        } catch (error) {
            console.error('Erreur lors de la finalisation de la livraison:', error);
            Alert.alert('Erreur', 'Échec de la finalisation de la livraison');
        }
    };

    // État de chargement
    if (loading) {
        return (
            <View className="flex-1 justify-center items-center bg-white">
                <ActivityIndicator size="large" color={COLORS.primary.DEFAULT} />
                <Text className="mt-4 text-gray-500">Chargement des détails de la commande...</Text>
            </View>
        );
    }

    if (!order) return null;

    return (
        <SafeAreaView className="flex-1 bg-gray-50">
            <Stack.Screen
                options={{
                    headerTitle: `Commande #${order.id.substring(0, 8)}`,
                    headerTintColor: '#fff',
                    headerStyle: { backgroundColor: COLORS.primary.DEFAULT },
                }}
            />

            {/* Section de carte */}
            <View className={`${mapExpanded ? 'h-96' : 'h-48'} w-full relative`}>
                {mapError ? (
                    <View className="flex-1 items-center justify-center bg-gray-100">
                        <Feather name="map-off" size={40} color="#9CA3AF" />
                        <Text className="text-gray-500 mt-2">Carte indisponible</Text>
                        <Text className="text-gray-400 text-sm text-center px-4">
                            Vérifiez votre connexion internet
                        </Text>
                        <TouchableOpacity
                            onPress={() => {
                                setMapError(false);
                                setMapReady(false);
                            }}
                            className="bg-orange-500 px-4 py-2 rounded-lg mt-3"
                        >
                            <Text className="text-white font-medium">Réessayer</Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    <MapView
                        ref={mapRef}
                        provider={PROVIDER_GOOGLE}
                        className="flex-1"
                        initialRegion={{
                            latitude: order.coordinates.latitude,
                            longitude: order.coordinates.longitude,
                            latitudeDelta: 0.02,
                            longitudeDelta: 0.02,
                        }}
                        onMapReady={() => {
                            console.log('Delivery details map is ready!');
                            setMapReady(true);
                        }}
                        onError={handleMapError}
                        mapType={mapType}
                        loadingEnabled={!mapReady}
                        // Remove custom styles temporarily for debugging
                    >
                        {/* Marqueur du client */}
                        {mapReady && (
                            <Marker
                                coordinate={order.coordinates}
                                title={order.customerName || "Client"}
                                description={order.address}
                            >
                                <View className="bg-white p-1 rounded-full">
                                    <MaterialIcons name="location-on" size={30} color="#F97316" />
                                </View>
                            </Marker>
                        )}

                        {/* Marqueur du livreur */}
                        {mapReady && currentLocation && (
                            <Marker coordinate={currentLocation}>
                                <View className="bg-blue-500 p-2 rounded-full">
                                    <FontAwesome5 name="car" size={16} color="white" />
                                </View>
                            </Marker>
                        )}

                        {/* Ligne d'itinéraire */}
                        {mapReady && getRouteCoordinates().length >= 2 && (
                            <Polyline
                                coordinates={getRouteCoordinates()}
                                strokeColor="#F97316"
                                strokeWidth={3}
                                lineDashPattern={[1]}
                            />
                        )}
                    </MapView>
                )}

                {/* Loading overlay for map */}
                {!mapReady && !mapError && (
                    <View className="absolute inset-0 items-center justify-center bg-gray-100">
                        <ActivityIndicator size="large" color={COLORS.primary.DEFAULT} />
                        <Text className="text-gray-500 mt-2">Chargement de la carte...</Text>
                    </View>
                )}

                {/* Contrôles de carte */}
                {!mapError && (
                    <View className="absolute top-3 right-3 flex-row">
                        <TouchableOpacity
                            className="bg-white p-2 rounded-md shadow-sm mr-2"
                            onPress={() => setMapType(mapType === 'standard' ? 'satellite' : 'standard')}
                            disabled={!mapReady}
                        >
                            <MaterialIcons name="layers" size={22} color={mapReady ? "#374151" : "#9CA3AF"} />
                        </TouchableOpacity>
                        <TouchableOpacity
                            className="bg-white p-2 rounded-md shadow-sm"
                            onPress={() => setMapExpanded(!mapExpanded)}
                        >
                            <MaterialIcons
                                name={mapExpanded ? "fullscreen-exit" : "fullscreen"}
                                size={22}
                                color="#374151"
                            />
                        </TouchableOpacity>
                    </View>
                )}

                {/* Bouton de navigation */}
                {!mapError && (
                    <TouchableOpacity
                        className="absolute bottom-3 right-3 bg-orange-500 px-4 py-2 rounded-lg shadow-lg"
                        onPress={navigateToCustomer}
                    >
                        <View className="flex-row items-center">
                            <MaterialIcons name="directions" size={18} color="white" />
                            <Text className="text-white font-bold ml-2">Naviguer</Text>
                        </View>
                    </TouchableOpacity>
                )}
            </View>

            {/* Rest of the component remains the same... */}
            {/* Onglets */}
            <View className="flex-row bg-white border-b border-gray-200">
                <TouchableOpacity
                    className={`flex-1 py-3 ${activeTab === 'details' ? 'border-b-2 border-orange-500' : ''}`}
                    onPress={() => setActiveTab('details')}
                >
                    <Text className={`text-center font-medium ${activeTab === 'details' ? 'text-orange-500' : 'text-gray-500'}`}>
                        Détails
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    className={`flex-1 py-3 ${activeTab === 'items' ? 'border-b-2 border-orange-500' : ''}`}
                    onPress={() => setActiveTab('items')}
                >
                    <Text className={`text-center font-medium ${activeTab === 'items' ? 'text-orange-500' : 'text-gray-500'}`}>
                        Articles ({order.items?.length || 0})
                    </Text>
                </TouchableOpacity>
            </View>

            <ScrollView
                className="flex-1"
                ref={scrollViewRef}
                showsVerticalScrollIndicator={false}
            >
                {activeTab === 'details' ? (
                    // Onglet Détails
                    <View className="p-4 space-y-4">
                        {/* Carte de statut */}
                        <View className="bg-white rounded-xl p-4 shadow-sm">
                            <View className="flex-row justify-between items-center mb-2">
                                <Text className="text-lg font-bold text-gray-800">Statut de la Commande</Text>
                                <View className={`px-3 py-1 rounded-full ${
                                    order.status === 'pending' ? 'bg-yellow-100' :
                                        order.status === 'in-progress' ? 'bg-blue-100' :
                                            order.status === 'completed' ? 'bg-green-100' : 'bg-red-100'
                                }`}>
                                    <Text className={`text-xs font-semibold ${
                                        order.status === 'pending' ? 'text-yellow-700' :
                                            order.status === 'in-progress' ? 'text-blue-700' :
                                                order.status === 'completed' ? 'text-green-700' : 'text-red-700'
                                    }`}>
                                        {order.status === 'pending' ? 'En Attente' :
                                            order.status === 'in-progress' ? 'En Cours' :
                                                order.status === 'completed' ? 'Terminée' :
                                                    order.status === 'confirmed' ? 'Confirmée' : 'Annulée'}
                                    </Text>
                                </View>
                            </View>
                            <View className="flex-row items-center">
                                <Feather name="clock" size={14} color="#6B7280" />
                                <Text className="text-gray-500 ml-1 text-sm">
                                    {formatDate(order.createdAt || order.date)}
                                </Text>
                            </View>
                        </View>

                        <View className="bg-white rounded-xl p-4 shadow-sm">
                            <Text className="text-lg font-bold text-gray-800 mb-3">Informations Client</Text>

                            <View className="flex-row justify-between items-start">
                                <View className="flex-row items-center">
                                    <View className="w-12 h-12 bg-orange-100 rounded-full items-center justify-center mr-3">
                                        <Text className="text-orange-500 font-bold text-lg">
                                            {order.customerName?.charAt(0) || 'C'}
                                        </Text>
                                    </View>
                                    <View>
                                        <Text className="text-gray-800 font-semibold text-base">
                                            {order.customerName || 'Client'}
                                        </Text>
                                        <TouchableOpacity
                                            className="flex-row items-center mt-1"
                                            onPress={callCustomer}
                                        >
                                            <Feather name="phone" size={14} color="#F97316" />
                                            <Text className="text-orange-500 ml-1">
                                                {order.customerPhone || 'Aucun numéro'}
                                            </Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>

                                <View className={`px-3 py-1 rounded-md ${
                                    order.paymentStatus === 'paid' ? 'bg-green-100' :
                                        (order.paymentMethod === 'card' || order.paymentMethod === 'online_payment') ? 'bg-pink-100' : 'bg-yellow-100'
                                }`}>
                                    <Text className={`text-xs font-medium ${
                                        order.paymentStatus === 'paid' ? 'text-green-700' :
                                            (order.paymentMethod === 'card' || order.paymentMethod === 'online_payment') ? 'text-pink-700' : 'text-yellow-700'
                                    }`}>
                                        {order.paymentStatus === 'paid' ? 'Payé' :
                                            (order.paymentMethod === 'card' || order.paymentMethod === 'online_payment') ? 'Paiement En Ligne' : 'Paiement à la Livraison'}
                                    </Text>
                                </View>
                            </View>

                            <View className="mt-4 pt-4 border-t border-gray-100">
                                <Text className="text-gray-500">Adresse de Livraison</Text>
                                <View className="flex-row mt-1">
                                    <MaterialIcons name="location-on" size={18} color="#6B7280" className="mt-1 mr-1" />
                                    <Text className="text-gray-800 flex-1">
                                        {order.address || 'Aucune adresse fournie'}
                                    </Text>
                                </View>

                                {/* Afficher les coordonnées GPS pour debug */}
                                <View className="mt-1 bg-gray-100 p-2 rounded-md">
                                    <Text className="text-gray-500 text-xs">Coordonnées GPS:</Text>
                                    <Text className="text-gray-600 text-xs">
                                        Lat: {order.coordinates.latitude.toFixed(6)}, Long: {order.coordinates.longitude.toFixed(6)}
                                    </Text>
                                </View>

                                {/* Add the delivery instructions section */}
                                {order.deliveryInstructions && (
                                    <View className="mt-3">
                                        <Text className="text-gray-500">Instructions de Livraison</Text>
                                        <View className="flex-row mt-1">
                                            <Feather name="info" size={18} color="#6B7280" className="mt-1 mr-1" />
                                            <Text className="text-gray-800 flex-1">
                                                {order.deliveryInstructions}
                                            </Text>
                                        </View>
                                    </View>
                                )}

                                {/* Navigation button */}
                                <TouchableOpacity
                                    className="flex-row items-center mt-3 bg-blue-50 px-3 py-2 rounded-md self-start"
                                    onPress={navigateToCustomer}
                                >
                                    <MaterialIcons name="directions" size={16} color="#3B82F6" />
                                    <Text className="text-blue-500 ml-1 font-medium">Itinéraire GPS</Text>
                                </TouchableOpacity>
                            </View>
                        </View>

                        {/* Résumé de la commande */}
                        <View className="bg-white rounded-xl p-4 shadow-sm">
                            <Text className="text-lg font-bold text-gray-800 mb-3">Résumé de la Commande</Text>

                            <View className="space-y-2">
                                <View className="flex-row justify-between">
                                    <Text className="text-gray-500">Sous-total:</Text>
                                    <Text className="text-gray-800">{formatCurrency(order.subtotal)}</Text>
                                </View>

                                <View className="flex-row justify-between">
                                    <Text className="text-gray-500">Frais de livraison:</Text>
                                    <Text className="text-gray-800">{formatCurrency(order.deliveryFee)}</Text>
                                </View>

                                {order.tipAmount > 0 && (
                                    <View className="flex-row justify-between">
                                        <Text className="text-gray-500">Pourboire:</Text>
                                        <Text className="text-gray-800">{formatCurrency(order.tipAmount)}</Text>
                                    </View>
                                )}

                                <View className="border-t border-gray-100 my-2 pt-2">
                                    <View className="flex-row justify-between">
                                        <Text className="text-gray-800 font-bold">Total:</Text>
                                        <Text className="text-orange-500 font-bold text-lg">{formatCurrency(order.total)}</Text>
                                    </View>
                                </View>
                            </View>
                        </View>

                        {/* Notes */}
                        {order.notes && (
                            <View className="bg-white rounded-xl p-4 shadow-sm">
                                <Text className="text-lg font-bold text-gray-800 mb-1">Notes de Livraison</Text>
                                <Text className="text-gray-600">{order.notes}</Text>
                            </View>
                        )}
                    </View>
                ) : (
                    // Onglet Articles - keeping the same content
                    <View className="p-4">
                        <View className="bg-white rounded-xl shadow-sm mb-4">
                            <Text className="p-4 text-lg font-bold text-gray-800 border-b border-gray-100">
                                Articles Commandés
                            </Text>
                            {/* ... rest of items tab content ... */}
                        </View>
                    </View>
                )}
            </ScrollView>

            {/* Boutons d'action */}
            <View className="p-4 bg-white border-t border-gray-200">
                {(order.status === 'pending' || order.status === 'confirmed') && (
                    <TouchableOpacity
                        className="bg-orange-500 py-3 rounded-xl items-center"
                        onPress={startDelivery}
                    >
                        <Text className="text-white font-bold">Démarrer la Livraison</Text>
                    </TouchableOpacity>
                )}

                {order.status === 'in-progress' && (
                    <View className="flex-row space-x-3">
                        <TouchableOpacity
                            className="flex-1 bg-white border border-orange-500 py-3 rounded-xl items-center"
                            onPress={callCustomer}
                        >
                            <Text className="text-orange-500 font-bold">Appeler le Client</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            className="flex-1 bg-orange-500 py-3 rounded-xl items-center"
                            onPress={showDeliveryCompletion}
                        >
                            <Text className="text-white font-bold">Terminer la Livraison</Text>
                        </TouchableOpacity>
                    </View>
                )}

                {order.status === 'completed' && (
                    <TouchableOpacity
                        className="bg-gray-800 py-3 rounded-xl items-center"
                        onPress={() => router.replace('/deliveries')}
                    >
                        <Text className="text-white font-bold">Retour aux Commandes</Text>
                    </TouchableOpacity>
                )}
            </View>

            {/* Feuille de finalisation de livraison */}
            {showCompletionSheet && (
                <BottomSheet onDismiss={() => setShowCompletionSheet(false)}>
                    <View className="pb-6">
                        <Text className="text-xl font-bold text-gray-800 mb-4">Finaliser la Livraison</Text>

                        <View className="bg-gray-100 rounded-xl p-4 mb-4">
                            <Text className="text-gray-800 font-semibold mb-2">Récapitulatif</Text>
                            <Text className="text-gray-600 mb-1">Client: {order.customerName || 'Client'}</Text>
                            <Text className="text-gray-600 mb-1">Total: {formatCurrency(order.total)}</Text>
                            <Text className="text-gray-600">Adresse: {order.address}</Text>
                        </View>

                        {order.paymentMethod === 'cash_on_delivery' && order.paymentStatus !== 'paid' ? (
                            <View className="space-y-3">
                                <Text className="text-gray-800 font-semibold">Paiement à la Livraison</Text>
                                <Text className="text-gray-600 mb-2">Avez-vous reçu le paiement de {formatCurrency(order.total)} ?</Text>

                                <TouchableOpacity
                                    className="bg-green-500 py-3 rounded-xl items-center"
                                    onPress={() => completeDelivery(true)}
                                >
                                    <Text className="text-white font-bold">Oui, j'ai reçu le paiement</Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    className="bg-red-500 py-3 rounded-xl items-center"
                                    onPress={() => Alert.alert(
                                        'Paiement Requis',
                                        'Vous devez recevoir le paiement avant de terminer la livraison.',
                                        [{ text: 'Compris' }]
                                    )}
                                >
                                    <Text className="text-white font-bold">Non, le client n'a pas payé</Text>
                                </TouchableOpacity>
                            </View>
                        ) : (
                            <TouchableOpacity
                                className="bg-orange-500 py-3 rounded-xl items-center"
                                onPress={() => completeDelivery(false)}
                            >
                                <Text className="text-white font-bold">Confirmer la Livraison</Text>
                            </TouchableOpacity>
                        )}

                        <TouchableOpacity
                            className="mt-3 py-3 items-center"
                            onPress={() => setShowCompletionSheet(false)}
                        >
                            <Text className="text-gray-600 font-medium">Annuler</Text>
                        </TouchableOpacity>
                    </View>
                </BottomSheet>
            )}
        </SafeAreaView>
    );
}