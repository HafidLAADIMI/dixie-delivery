// app/(app)/delivery/[id].jsx - Complete Fixed with Region Navigation
import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  Platform,
  ActivityIndicator,
} from "react-native";
import { useLocalSearchParams, useRouter, Stack } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather, MaterialIcons, FontAwesome5 } from "@expo/vector-icons";
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from "react-native-maps";
import * as Linking from "expo-linking";
import BottomSheet from "@/components/BottomSheet";

// Import du service de commande amélioré
import { getOrderOnce, updateOrderStatus } from "@/services/orderService";
import { useLocation } from "@/contexts/LocationContext";

// Import ou définition des couleurs de thème
const COLORS = {
  primary: { DEFAULT: "#F97316", dark: "#EA580C" }, // Orange
  gray: { light: "#9CA3AF" },
};

// Delivery regions
const ALLOWED_REGIONS = {
  "Hay Oulfa": { latitude: 33.5423, longitude: -7.6532, radius: 2000 },
  "Hay Hassani": { latitude: 33.5156, longitude: -7.6789, radius: 2000 },
  Lissasfa: { latitude: 33.5234, longitude: -7.6123, radius: 2000 },
  Almaz: { latitude: 33.5378, longitude: -7.6234, radius: 2000 },
  "Hay Laymoun": { latitude: 33.5512, longitude: -7.6445, radius: 2000 },
  Ciel: { latitude: 33.5289, longitude: -7.6456, radius: 2000 },
  Nassim: { latitude: 33.5334, longitude: -7.6298, radius: 2000 },
  "Sidi Maarouf": { latitude: 33.5167, longitude: -7.6234, radius: 2000 },
  CFC: { latitude: 33.5445, longitude: -7.6567, radius: 2000 },
};

export default function DeliveryDetailsScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { currentLocation } = useLocation();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [mapType, setMapType] = useState("standard");
  const [mapExpanded, setMapExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState("details");
  const [showCompletionSheet, setShowCompletionSheet] = useState(false);
  const [userId, setUserId] = useState(null);
  const [orderId, setOrderId] = useState(null);

  // Map state
  const [mapError, setMapError] = useState(false);
  const [mapReady, setMapReady] = useState(true);

  // Refs
  const mapRef = useRef(null);
  const scrollViewRef = useRef(null);

  // Helper function to safely convert values to strings
  const safeString = (value, fallback = "") => {
    if (value === null || value === undefined) return fallback;
    return String(value);
  };

  // Helper function to safely format numbers
  const safeNumber = (value, fallback = 0) => {
    if (typeof value === "number" && !isNaN(value)) return value;
    return fallback;
  };

  // Add map error handler
  const handleMapError = (error) => {
    console.error("Map Error in delivery details:", error);
    setMapError(true);
  };

  // Helper function to calculate distance between coordinates
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // Distance in meters
  };

  // Helper function to get navigation coordinates based on order region
  const getNavigationCoordinates = (order) => {
    if (!order) return null;

    console.log(`[Navigation] Processing order ${order.id}`);

    // Method 1: Check order's shipping address region
    if (order.shippingAddress?.region) {
      const regionData = ALLOWED_REGIONS[order.shippingAddress.region];
      if (regionData) {
        console.log(
          `[Navigation] Using shipping address region: ${order.shippingAddress.region}`
        );
        return {
          latitude: regionData.latitude,
          longitude: regionData.longitude,
          regionName: order.shippingAddress.region,
          method: "shipping_address_region",
        };
      }
    }

    // Method 2: Check if coordinates in shippingAddress match a region
    if (order.shippingAddress?.latitude && order.shippingAddress?.longitude) {
      const shippingLat = order.shippingAddress.latitude;
      const shippingLng = order.shippingAddress.longitude;

      // Check if these coordinates match any of our regions
      for (const [regionName, regionData] of Object.entries(ALLOWED_REGIONS)) {
        if (
          Math.abs(shippingLat - regionData.latitude) < 0.001 &&
          Math.abs(shippingLng - regionData.longitude) < 0.001
        ) {
          console.log(
            `[Navigation] Using shipping coordinates matching region: ${regionName}`
          );
          return {
            latitude: regionData.latitude,
            longitude: regionData.longitude,
            regionName: regionName,
            method: "shipping_coordinates_match",
          };
        }
      }
    }

    // Method 3: Extract region from delivery address
    if (order.deliveryAddress || order.address) {
      const address = (order.deliveryAddress || order.address).toLowerCase();
      for (const [regionName, regionData] of Object.entries(ALLOWED_REGIONS)) {
        if (address.includes(regionName.toLowerCase())) {
          console.log(`[Navigation] Found region in address: ${regionName}`);
          return {
            latitude: regionData.latitude,
            longitude: regionData.longitude,
            regionName: regionName,
            method: "address_extraction",
          };
        }
      }
    }

    // Method 4: Use order coordinates to find closest region
    if (order.coordinates?.latitude && order.coordinates?.longitude) {
      let closestRegion = null;
      let shortestDistance = Infinity;

      Object.entries(ALLOWED_REGIONS).forEach(([regionName, regionData]) => {
        const distance = calculateDistance(
          order.coordinates.latitude,
          order.coordinates.longitude,
          regionData.latitude,
          regionData.longitude
        );

        if (distance < shortestDistance) {
          shortestDistance = distance;
          closestRegion = {
            name: regionName,
            ...regionData,
            distance: distance,
          };
        }
      });

      if (closestRegion) {
        console.log(
          `[Navigation] Using closest region: ${
            closestRegion.name
          } (${Math.round(closestRegion.distance)}m away)`
        );
        return {
          latitude: closestRegion.latitude,
          longitude: closestRegion.longitude,
          regionName: closestRegion.name,
          method: "closest_region",
          distance: closestRegion.distance,
        };
      }
    }

    // Fallback: return original coordinates if available
    if (order.coordinates?.latitude && order.coordinates?.longitude) {
      console.log(`[Navigation] Using original coordinates as fallback`);
      return {
        latitude: order.coordinates.latitude,
        longitude: order.coordinates.longitude,
        regionName: "Unknown",
        method: "fallback_original",
      };
    }

    console.warn("[Navigation] No valid coordinates found");
    return null;
  };

  // Helper function to get valid coordinates (updated to use region navigation)
  const getValidCoordinates = (orderData) => {
    // First try to get navigation coordinates (region-based)
    const navigationCoords = getNavigationCoordinates(orderData);
    if (navigationCoords) {
      return {
        latitude: navigationCoords.latitude,
        longitude: navigationCoords.longitude,
      };
    }

    // Fallback to original logic
    if (
      orderData.coordinates &&
      typeof orderData.coordinates.latitude === "number" &&
      typeof orderData.coordinates.longitude === "number"
    ) {
      return orderData.coordinates;
    }

    // Default coordinates if not found (Casablanca, Morocco)
    return {
      latitude: 33.5731,
      longitude: -7.5898,
    };
  };

  // Récupérer les données de la commande
  useEffect(() => {
    const loadOrderDetails = async () => {
      try {
        if (!id) {
          throw new Error("Aucun ID de commande fourni");
        }

        console.log(`[DeliveryDetails] Received ID: "${id}"`);

        let extractedUserId, extractedOrderId;

        // Check if ID contains underscore (expected format: userId_orderId)
        if (id.includes("_")) {
          const idParts = id.split("_");
          if (idParts.length !== 2) {
            throw new Error("Format d'ID de commande invalide");
          }
          [extractedUserId, extractedOrderId] = idParts;
          console.log(
            `[DeliveryDetails] Parsed - userId: "${extractedUserId}", orderId: "${extractedOrderId}"`
          );
        } else {
          // If no underscore, treat the entire ID as orderId and search across all users
          console.log(
            `[DeliveryDetails] No underscore found, treating "${id}" as orderId and searching across all users`
          );

          // Import the new function
          const { findOrderById } = await import("@/services/orderService");
          const orderData = await findOrderById(id);

          if (!orderData) {
            throw new Error("Commande introuvable");
          }

          // Extract the actual userId and orderId from the found order
          extractedUserId = orderData.userId;
          extractedOrderId = orderData.id;

          console.log(
            `[DeliveryDetails] Found order - userId: "${extractedUserId}", orderId: "${extractedOrderId}"`
          );

          // Ensure valid coordinates exist
          const coordinates = getValidCoordinates(orderData);
          orderData.coordinates = coordinates;

          console.log("Order data loaded:", orderData);
          setOrder(orderData);
          setUserId(extractedUserId);
          setOrderId(extractedOrderId);

          // Animate to location if map is ready
          if (mapRef.current && coordinates && mapReady) {
            setTimeout(() => {
              mapRef.current.animateToRegion(
                {
                  latitude: coordinates.latitude,
                  longitude: coordinates.longitude,
                  latitudeDelta: 0.02,
                  longitudeDelta: 0.02,
                },
                1000
              );
            }, 500);
          }
          return;
        }

        // Store the extracted IDs
        setUserId(extractedUserId);
        setOrderId(extractedOrderId);

        // Original logic for userId_orderId format
        const orderData = await getOrderOnce(extractedUserId, extractedOrderId);

        if (!orderData) {
          // If not found with the parsed IDs, try searching by orderId across all users
          console.log(
            `[DeliveryDetails] Order not found with parsed IDs, searching by orderId: "${extractedOrderId}"`
          );
          const { findOrderById } = await import("@/services/orderService");
          const foundOrder = await findOrderById(extractedOrderId);

          if (!foundOrder) {
            throw new Error("Commande introuvable");
          }

          // Update the userId if different from what we parsed
          setUserId(foundOrder.userId);

          // Use the found order
          const coordinates = getValidCoordinates(foundOrder);
          foundOrder.coordinates = coordinates;
          setOrder(foundOrder);
          return;
        }

        // Ensure valid coordinates exist
        const coordinates = getValidCoordinates(orderData);
        orderData.coordinates = coordinates;

        console.log("Order data loaded:", orderData);
        setOrder(orderData);

        // Si la référence de carte existe, animer vers l'emplacement du client
        if (mapRef.current && coordinates && mapReady) {
          setTimeout(() => {
            mapRef.current.animateToRegion(
              {
                latitude: coordinates.latitude,
                longitude: coordinates.longitude,
                latitudeDelta: 0.02,
                longitudeDelta: 0.02,
              },
              1000
            );
          }, 500);
        }
      } catch (error) {
        console.error(
          "Erreur lors du chargement des détails de la commande:",
          error
        );
        Alert.alert("Erreur", "Échec du chargement des détails de la commande");
        router.back();
      } finally {
        setLoading(false);
      }
    };
    loadOrderDetails();
  }, [id, router, mapReady]);

  // Générer les coordonnées de l'itinéraire entre le livreur et le client (updated)
  const getRouteCoordinates = () => {
    if (!currentLocation || !order) return [];

    // Use navigation coordinates instead of exact order coordinates
    const navigationCoords = getNavigationCoordinates(order);
    if (!navigationCoords) return [];

    return [
      { ...currentLocation },
      {
        latitude: navigationCoords.latitude,
        longitude: navigationCoords.longitude,
      },
    ];
  };

  // Formater la date
  const formatDate = (timestamp) => {
    if (!timestamp) return "Date inconnue";

    try {
      // Handle Firestore timestamp objects
      if (timestamp.seconds) {
        const date = new Date(timestamp.seconds * 1000);
        const hours = date.getHours().toString().padStart(2, "0");
        const minutes = date.getMinutes().toString().padStart(2, "0");
        return `${date.toLocaleDateString()} à ${hours}:${minutes}`;
      }

      // Handle date strings or Date objects
      const date =
        typeof timestamp === "string" ? new Date(timestamp) : timestamp;
      const hours = date.getHours().toString().padStart(2, "0");
      const minutes = date.getMinutes().toString().padStart(2, "0");
      return `${date.toLocaleDateString()} à ${hours}:${minutes}`;
    } catch (error) {
      console.error("Error formatting date:", error);
      return "Date inconnue";
    }
  };

  // Formater la devise
  const formatCurrency = (amount) => {
    if (typeof amount !== "number") return "0,00 MAD";
    return `${amount.toFixed(2).replace(".", ",")} MAD`;
  };

  // Appeler le client
  const callCustomer = () => {
    if (!order?.customerPhone) {
      Alert.alert("Erreur", "Aucun numéro de téléphone disponible");
      return;
    }
    Linking.openURL(`tel:${order.customerPhone}`);
  };

  // Ouvrir l'application de navigation (updated)
  const navigateToCustomer = () => {
    const navigationCoords = getNavigationCoordinates(order);

    if (!navigationCoords) {
      Alert.alert("Erreur", "Aucune coordonnée de navigation disponible");
      return;
    }

    const { latitude, longitude, regionName, method } = navigationCoords;

    console.log(
      `[Navigation] Navigating to ${regionName} (${latitude}, ${longitude}) using method: ${method}`
    );

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
    if (!order || !orderId) {
      Alert.alert(
        "Erreur",
        "Impossible de démarrer la livraison : détails de commande manquants"
      );
      return;
    }

    try {
      console.log(
        `[startDelivery] Starting delivery for orderId: "${orderId}"`
      );

      // Use the updated function that tries both locations
      await updateOrderStatus(userId, orderId, "processing");

      // Mettre à jour l'état local
      setOrder({
        ...order,
        status: "in-progress",
      });

      Alert.alert("Succès", "Livraison démarrée avec succès");
    } catch (error) {
      console.error("Erreur lors du démarrage de la livraison:", error);
      Alert.alert("Erreur", "Échec du démarrage de la livraison");
    }
  };

  // Terminer la livraison et montrer la feuille de finalisation
  const showDeliveryCompletion = () => {
    setShowCompletionSheet(true);
  };

  // Compléter la livraison (mettre à jour le statut à completed)
  const completeDelivery = async (withPayment = false) => {
    if (!order || !orderId) {
      Alert.alert(
        "Erreur",
        "Impossible de terminer la livraison : détails de commande manquants"
      );
      return;
    }

    try {
      console.log(
        `[completeDelivery] Completing delivery for orderId: "${orderId}"`
      );

      // Use the updated function that tries both locations
      await updateOrderStatus(userId, orderId, "delivered", {
        receivedBy: order.customerName || "Client",
        notes: "Livraison terminée avec succès",
        amountCollected: withPayment ? order.total || 0 : 0,
        signatureUrl: null,
        proofOfDeliveryUrl: null,
        deliveredAt: new Date(),
        deliveredBy: "current-driver-id",
        deliverymanName: "Livreur Actuel",
      });

      // Fermer la feuille de finalisation
      setShowCompletionSheet(false);

      // Naviguer vers l'écran de succès
      router.replace("/delivery-success");
    } catch (error) {
      console.error("Erreur lors de la finalisation de la livraison:", error);
      Alert.alert("Erreur", "Échec de la finalisation de la livraison");
    }
  };

  // État de chargement
  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-white">
        <ActivityIndicator size="large" color={COLORS.primary.DEFAULT} />
        <Text className="mt-4 text-gray-500">
          Chargement des détails de la commande...
        </Text>
      </View>
    );
  }

  if (!order) return null;

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <Stack.Screen
        options={{
          headerTitle: `Commande #${safeString(order.id).substring(0, 8)}`,
          headerTintColor: "#fff",
          headerStyle: { backgroundColor: COLORS.primary.DEFAULT },
        }}
      />

      {/* Section de carte */}
      <View className={`${mapExpanded ? "h-96" : "h-48"} w-full relative`}>
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
              console.log("Delivery details map is ready!");
              setMapReady(true);
            }}
            onError={handleMapError}
            mapType={mapType}
            loadingEnabled={!mapReady}
          >
            {/* Marqueur du client */}
            {mapReady && (
              <Marker
                coordinate={order.coordinates}
                title={safeString(order.customerName, "Client")}
                description={safeString(order.address)}
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
            <Text className="text-gray-500 mt-2">
              Chargement de la carte...
            </Text>
          </View>
        )}

        {/* Contrôles de carte */}
        {!mapError && (
          <View className="absolute top-3 right-3 flex-row">
            <TouchableOpacity
              className="bg-white p-2 rounded-md shadow-sm mr-2"
              onPress={() =>
                setMapType(mapType === "standard" ? "satellite" : "standard")
              }
              disabled={!mapReady}
            >
              <MaterialIcons
                name="layers"
                size={22}
                color={mapReady ? "#374151" : "#9CA3AF"}
              />
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

      {/* Onglets */}
      <View className="flex-row bg-white border-b border-gray-200">
        <TouchableOpacity
          className={`flex-1 py-3 ${
            activeTab === "details" ? "border-b-2 border-orange-500" : ""
          }`}
          onPress={() => setActiveTab("details")}
        >
          <Text
            className={`text-center font-medium ${
              activeTab === "details" ? "text-orange-500" : "text-gray-500"
            }`}
          >
            Détails
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          className={`flex-1 py-3 ${
            activeTab === "items" ? "border-b-2 border-orange-500" : ""
          }`}
          onPress={() => setActiveTab("items")}
        >
          <Text
            className={`text-center font-medium ${
              activeTab === "items" ? "text-orange-500" : "text-gray-500"
            }`}
          >
            Articles ({String(safeNumber(order.items?.length, 0))})
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        className="flex-1"
        ref={scrollViewRef}
        showsVerticalScrollIndicator={false}
      >
        {activeTab === "details" ? (
          // Onglet Détails
          <View className="p-4 space-y-4">
            {/* Carte de statut */}
            <View className="bg-white rounded-xl p-4 shadow-sm">
              <View className="flex-row justify-between items-center mb-2">
                <Text className="text-lg font-bold text-gray-800">
                  Statut de la Commande
                </Text>
                <View
                  className={`px-3 py-1 rounded-full ${
                    order.status === "pending"
                      ? "bg-yellow-100"
                      : order.status === "in-progress"
                      ? "bg-blue-100"
                      : order.status === "completed"
                      ? "bg-green-100"
                      : "bg-red-100"
                  }`}
                >
                  <Text
                    className={`text-xs font-semibold ${
                      order.status === "pending"
                        ? "text-yellow-700"
                        : order.status === "in-progress"
                        ? "text-blue-700"
                        : order.status === "completed"
                        ? "text-green-700"
                        : "text-red-700"
                    }`}
                  >
                    {order.status === "pending"
                      ? "En Attente"
                      : order.status === "in-progress"
                      ? "En Cours"
                      : order.status === "completed"
                      ? "Terminée"
                      : order.status === "confirmed"
                      ? "Confirmée"
                      : "Annulée"}
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
              <Text className="text-lg font-bold text-gray-800 mb-3">
                Informations Client
              </Text>

              <View className="flex-row justify-between items-start">
                <View className="flex-row items-center">
                  <View className="w-12 h-12 bg-orange-100 rounded-full items-center justify-center mr-3">
                    <Text className="text-orange-500 font-bold text-lg">
                      {safeString(order.customerName, "C").charAt(0)}
                    </Text>
                  </View>
                  <View>
                    <Text className="text-gray-800 font-semibold text-base">
                      {safeString(order.customerName, "Client")}
                    </Text>
                    <TouchableOpacity
                      className="flex-row items-center mt-1"
                      onPress={callCustomer}
                    >
                      <Feather name="phone" size={14} color="#F97316" />
                      <Text className="text-orange-500 ml-1">
                        {safeString(order.customerPhone, "Aucun numéro")}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>

                <View
                  className={`px-3 py-1 rounded-md ${
                    order.paymentStatus === "paid"
                      ? "bg-green-100"
                      : order.paymentMethod === "card" ||
                        order.paymentMethod === "online_payment"
                      ? "bg-pink-100"
                      : "bg-yellow-100"
                  }`}
                >
                  <Text
                    className={`text-xs font-medium ${
                      order.paymentStatus === "paid"
                        ? "text-green-700"
                        : order.paymentMethod === "card" ||
                          order.paymentMethod === "online_payment"
                        ? "text-pink-700"
                        : "text-yellow-700"
                    }`}
                  >
                    {order.paymentStatus === "paid"
                      ? "Payé"
                      : order.paymentMethod === "card" ||
                        order.paymentMethod === "online_payment"
                      ? "Paiement En Ligne"
                      : "Paiement à la Livraison"}
                  </Text>
                </View>
              </View>

              <View className="mt-4 pt-4 border-t border-gray-100">
                <Text className="text-gray-500">Adresse de Livraison</Text>
                <View className="flex-row mt-1">
                  <MaterialIcons
                    name="location-on"
                    size={18}
                    color="#6B7280"
                    className="mt-1 mr-1"
                  />
                  <Text className="text-gray-800 flex-1">
                    {safeString(
                      order.address || order.deliveryAddress,
                      "Aucune adresse fournie"
                    )}
                  </Text>
                </View>

                {/* Show region information */}
                {(() => {
                  const navigationCoords = getNavigationCoordinates(order);
                  if (navigationCoords) {
                    return (
                      <View className="mt-3 bg-orange-50 p-3 rounded-md">
                        <View className="flex-row items-center mb-1">
                          <MaterialIcons
                            name="my-location"
                            size={16}
                            color="#F97316"
                          />
                          <Text className="text-orange-700 font-semibold ml-1 text-sm">
                            Zone de Navigation
                          </Text>
                        </View>
                        <Text className="text-orange-600 text-sm">
                          📍 {navigationCoords.regionName}
                        </Text>
                        <Text className="text-orange-500 text-xs mt-1">
                          Coordinates: {navigationCoords.latitude.toFixed(4)},{" "}
                          {navigationCoords.longitude.toFixed(4)}
                        </Text>
                        {navigationCoords.distance && (
                          <Text className="text-orange-500 text-xs">
                            Distance du point client:{" "}
                            {Math.round(navigationCoords.distance)}m
                          </Text>
                        )}
                      </View>
                    );
                  }
                  return null;
                })()}

                {/* Afficher les coordonnées GPS pour debug */}
                <View className="mt-2 bg-gray-100 p-2 rounded-md">
                  <Text className="text-gray-500 text-xs">
                    Coordonnées Originales:
                  </Text>
                  <Text className="text-gray-600 text-xs">
                    Lat: {safeNumber(order.coordinates?.latitude, 0).toFixed(6)}
                    , Long:{" "}
                    {safeNumber(order.coordinates?.longitude, 0).toFixed(6)}
                  </Text>
                </View>

                {/* Add the delivery instructions section */}
                {(order.deliveryInstructions ||
                  order.shippingAddress?.instructions ||
                  order.notes) && (
                  <View className="mt-3">
                    <Text className="text-gray-500">
                      Instructions de Livraison
                    </Text>
                    <View className="flex-row mt-1">
                      <Feather
                        name="info"
                        size={18}
                        color="#6B7280"
                        className="mt-1 mr-1"
                      />
                      <Text className="text-gray-800 flex-1">
                        {safeString(
                          order.deliveryInstructions ||
                            order.shippingAddress?.instructions ||
                            order.notes
                        )}
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
                  <Text className="text-blue-500 ml-1 font-medium">
                    {(() => {
                      const navigationCoords = getNavigationCoordinates(order);
                      return navigationCoords
                        ? `Naviguer vers ${navigationCoords.regionName}`
                        : "Itinéraire GPS";
                    })()}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Résumé de la commande */}
            <View className="bg-white rounded-xl p-4 shadow-sm">
              <Text className="text-lg font-bold text-gray-800 mb-3">
                Résumé de la Commande
              </Text>

              <View className="space-y-2">
                <View className="flex-row justify-between">
                  <Text className="text-gray-500">Sous-total:</Text>
                  <Text className="text-gray-800">
                    {formatCurrency(safeNumber(order.subtotal))}
                  </Text>
                </View>

                <View className="flex-row justify-between">
                  <Text className="text-gray-500">Frais de livraison:</Text>
                  <Text className="text-gray-800">
                    {formatCurrency(safeNumber(order.deliveryFee))}
                  </Text>
                </View>

                {safeNumber(order.tipAmount) > 0 && (
                  <View className="flex-row justify-between">
                    <Text className="text-gray-500">Pourboire:</Text>
                    <Text className="text-gray-800">
                      {formatCurrency(safeNumber(order.tipAmount))}
                    </Text>
                  </View>
                )}

                <View className="border-t border-gray-100 my-2 pt-2">
                  <View className="flex-row justify-between">
                    <Text className="text-gray-800 font-bold">Total:</Text>
                    <Text className="text-orange-500 font-bold text-lg">
                      {formatCurrency(safeNumber(order.total))}
                    </Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Notes */}
            {order.notes && (
              <View className="bg-white rounded-xl p-4 shadow-sm">
                <Text className="text-lg font-bold text-gray-800 mb-1">
                  Notes de Livraison
                </Text>
                <Text className="text-gray-600">{safeString(order.notes)}</Text>
              </View>
            )}
          </View>
        ) : (
          // Onglet Articles
          <View className="p-4">
            <View className="bg-white rounded-xl shadow-sm mb-4">
              <Text className="p-4 text-lg font-bold text-gray-800 border-b border-gray-100">
                Articles Commandés
              </Text>
              {order.items && order.items.length > 0 ? (
                order.items.map((item, index) => (
                  <View
                    key={`item_${index}`}
                    className="p-4 border-b border-gray-100 last:border-b-0"
                  >
                    <View className="flex-row justify-between items-start">
                      <View className="flex-1">
                        <Text className="text-gray-800 font-semibold">
                          {safeString(item.name, "Article sans nom")}
                        </Text>
                        {item.description && (
                          <Text className="text-gray-500 text-sm mt-1">
                            {safeString(item.description)}
                          </Text>
                        )}
                        <View className="flex-row items-center mt-2">
                          <Text className="text-gray-600 text-sm">
                            Quantité: {String(safeNumber(item.quantity, 1))}
                          </Text>
                          <Text className="text-gray-600 text-sm ml-4">
                            Prix unitaire:{" "}
                            {formatCurrency(safeNumber(item.price))}
                          </Text>
                        </View>
                      </View>
                      <Text className="text-orange-500 font-semibold">
                        {formatCurrency(
                          safeNumber(item.price) * safeNumber(item.quantity, 1)
                        )}
                      </Text>
                    </View>
                  </View>
                ))
              ) : (
                <View className="p-4 items-center">
                  <Text className="text-gray-500">Aucun article trouvé</Text>
                </View>
              )}
            </View>
          </View>
        )}
      </ScrollView>

      {/* Boutons d'action */}
      <View className="p-4 bg-white border-t border-gray-200">
        {(order.status === "pending" || order.status === "confirmed") && (
          <TouchableOpacity
            className="bg-orange-500 py-3 rounded-xl items-center"
            onPress={startDelivery}
          >
            <Text className="text-white font-bold">Démarrer la Livraison</Text>
          </TouchableOpacity>
        )}

        {order.status === "in-progress" && (
          <View className="flex-row space-x-3">
            <TouchableOpacity
              className="flex-1 bg-white border border-orange-500 py-3 rounded-xl items-center"
              onPress={callCustomer}
            >
              <Text className="text-orange-500 font-bold">
                Appeler le Client
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              className="flex-1 bg-orange-500 py-3 rounded-xl items-center"
              onPress={showDeliveryCompletion}
            >
              <Text className="text-white font-bold">
                Terminer la Livraison
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {order.status === "completed" && (
          <TouchableOpacity
            className="bg-gray-800 py-3 rounded-xl items-center"
            onPress={() => router.replace("/deliveries")}
          >
            <Text className="text-white font-bold">Retour aux Commandes</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Feuille de finalisation de livraison */}
      {showCompletionSheet && (
        <BottomSheet onDismiss={() => setShowCompletionSheet(false)}>
          <View className="pb-6">
            <Text className="text-xl font-bold text-gray-800 mb-4">
              Finaliser la Livraison
            </Text>

            <View className="bg-gray-100 rounded-xl p-4 mb-4">
              <Text className="text-gray-800 font-semibold mb-2">
                Récapitulatif
              </Text>
              <Text className="text-gray-600 mb-1">
                Client: {safeString(order.customerName, "Client")}
              </Text>
              <Text className="text-gray-600 mb-1">
                Total: {formatCurrency(safeNumber(order.total))}
              </Text>
              <Text className="text-gray-600">
                Adresse: {safeString(order.address)}
              </Text>
            </View>

            {order.paymentMethod === "cash_on_delivery" &&
            order.paymentStatus !== "paid" ? (
              <View className="space-y-3">
                <Text className="text-gray-800 font-semibold">
                  Paiement à la Livraison
                </Text>
                <Text className="text-gray-600 mb-2">
                  Avez-vous reçu le paiement de{" "}
                  {formatCurrency(safeNumber(order.total))} ?
                </Text>

                <TouchableOpacity
                  className="bg-green-500 py-3 rounded-xl items-center"
                  onPress={() => completeDelivery(true)}
                >
                  <Text className="text-white font-bold">
                    Oui, j'ai reçu le paiement
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  className="bg-red-500 py-3 rounded-xl items-center"
                  onPress={() =>
                    Alert.alert(
                      "Paiement Requis",
                      "Vous devez recevoir le paiement avant de terminer la livraison.",
                      [{ text: "Compris" }]
                    )
                  }
                >
                  <Text className="text-white font-bold">
                    Non, le client n'a pas payé
                  </Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                className="bg-orange-500 py-3 rounded-xl items-center"
                onPress={() => completeDelivery(false)}
              >
                <Text className="text-white font-bold">
                  Confirmer la Livraison
                </Text>
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
