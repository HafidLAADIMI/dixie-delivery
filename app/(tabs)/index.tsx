// Fixed HomeScreen with better map error handling and text rendering
import React, { useEffect, useRef, useState, useCallback } from "react";
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
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Feather, Ionicons } from "@expo/vector-icons";
import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps";

import { COLORS } from "@/constants/theme";
import { useLocation } from "@/contexts/LocationContext";
import { useAuth } from "@/contexts/AuthContext";
import { getOrders, Order } from "@/services/orderService";
import {
  getDeliverymanDetails,
  getDeliverymanByEmail,
} from "@/services/deliverymanService";

export default function HomeScreen() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [active, setActive] = useState<Order | null>(null);
  const [deliveryman, setDeliveryman] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [error, setError] = useState(null);
  const [mapError, setMapError] = useState(false);
  const [mapReady, setMapReady] = useState(true);

  const { currentLocation } = useLocation();
  const { user } = useAuth();
  const mapRef = useRef(null);

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
    console.error("Map Error:", error);
    setMapError(true);
    setError(
      "Erreur de chargement de la carte. Vérifiez votre connexion internet."
    );
  };

  const loadData = async () => {
    setRefreshing(true);
    try {
      const list = await getOrders();
      setOrders(list || []); // Ensure it's always an array
    } catch (error) {
      console.error("Error loading orders:", error);
      Alert.alert(
        "Erreur",
        "Échec du chargement des commandes. Veuillez réessayer."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchDeliverymanDetails = async () => {
    if (!user) {
      console.log("No user data available");
      setLoadingProfile(false);
      return;
    }

    try {
      let data = null;

      if (user.deliverymanId) {
        data = await getDeliverymanDetails(user.deliverymanId);
      }

      if (!data && user.email) {
        data = await getDeliverymanByEmail(user.email);
      }

      if (data) {
        setDeliveryman(data);
      }
    } catch (error) {
      console.error("Error fetching deliveryman details:", error);
      setError("Failed to load deliveryman details");
    } finally {
      setLoadingProfile(false);
    }
  };

  useEffect(() => {
    loadData();
    fetchDeliverymanDetails();
  }, [user]);

  const todayStr = new Date().toDateString();
  const todayCount = orders.filter((o) => {
    try {
      const date =
        o.createdAt?.toDate?.() ?? (o.createdAt ? new Date(o.createdAt) : null);
      return date && date.toDateString() === todayStr;
    } catch (e) {
      return false;
    }
  }).length;

  const pendingCount = orders.filter((o) => o.status === "pending").length;

  // Fixed openDetails function in HomeScreen
  const openDetails = (o: Order) => {
    if (o && o.id) {
      // Debug logging to see what IDs we're working with
      console.log(
        `[HomeScreen] Opening order details - userId: "${o.userId}", orderId: "${o.id}"`
      );

      // Check if we have a valid userId
      if (o.userId && o.userId !== o.id) {
        // Use the expected format: userId_orderId
        console.log(
          `[HomeScreen] Navigating to: /delivery/${o.userId}_${o.id}`
        );
        router.push(`/delivery/${o.userId}_${o.id}`);
      } else {
        // If userId is missing or same as orderId, just use the orderId
        console.log(
          `[HomeScreen] No valid userId, navigating to: /delivery/${o.id}`
        );
        router.push(`/delivery/${o.id}`);
      }
    } else {
      console.error(
        "[HomeScreen] Cannot open details - missing order or order ID"
      );
    }
  };

  const setActiveWithValidation = (o: Order) => {
    if (
      o &&
      o.coordinates &&
      typeof o.coordinates.latitude === "number" &&
      typeof o.coordinates.longitude === "number"
    ) {
      setActive(o);
    } else {
      console.warn("Invalid coordinates for order:", o.id);
    }
  };

  // Use fallback coordinates for Morocco (Casablanca)
  const region = currentLocation ?? {
    latitude: 33.5731,
    longitude: -7.5898,
    latitudeDelta: 0.02,
    longitudeDelta: 0.02,
  };

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center">
        <ActivityIndicator size="large" color={COLORS.primary.DEFAULT} />
      </View>
    );
  }

  // Get user data with fallbacks and ensure strings
  const userData = deliveryman || user || {};
  const fullName = (() => {
    if (deliveryman?.firstName || deliveryman?.lastName) {
      return `${safeString(deliveryman.firstName)} ${safeString(
        deliveryman.lastName
      )}`.trim();
    }
    if (user?.firstName || user?.lastName) {
      return `${safeString(user.firstName)} ${safeString(
        user.lastName
      )}`.trim();
    }
    if (userData.name) {
      return safeString(userData.name);
    }
    return safeString(user?.email?.split("@")[0], "Livreur");
  })();

  const profileImageUrl =
    userData.profileImageUrl ||
    userData.avatarUrl ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(
      fullName
    )}&background=FFA500&color=fff`;

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <ScrollView
        className="flex-1"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={loadData}
            colors={[COLORS.primary.DEFAULT]}
          />
        }
      >
        {/* Header */}
        <View className="bg-white px-4 pt-4 pb-6">
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center">
              <Image
                source={{ uri: profileImageUrl }}
                className="w-12 h-12 rounded-full mr-3"
              />
              <View>
                <Text className="text-gray-900 text-lg font-semibold">
                  Bonjour, {fullName}
                </Text>
                <Text className="text-gray-500">
                  {safeString(
                    deliveryman?.zone || user?.zone,
                    "Zone non définie"
                  )}{" "}
                  •{" "}
                  {safeString(
                    deliveryman?.vehicle || user?.vehicle,
                    "Véhicule non défini"
                  )}
                </Text>
              </View>
            </View>

            <TouchableOpacity
              onPress={() => router.push("/notifications")}
              className="w-10 h-10 bg-orange-100 rounded-full items-center justify-center"
            >
              <Feather name="bell" size={20} color={COLORS.primary.DEFAULT} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Display error if any */}
        {error && (
          <View className="mx-4 mt-2 bg-red-100 p-3 rounded-xl">
            <Text className="text-red-500">{safeString(error)}</Text>
            <TouchableOpacity
              onPress={() => {
                setError(null);
                setMapError(false);
              }}
              className="mt-2"
            >
              <Text className="text-red-700 font-medium">Fermer</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Stats */}
        <View className="flex-row mx-4 mt-4">
          <View style={[styles.card, { marginRight: 8 }]}>
            <Text className="text-gray-500 mb-1">Commandes du Jour</Text>
            <View className="flex-row items-center justify-between">
              <Text className="text-2xl font-bold">{String(todayCount)}</Text>
              <View className="w-9 h-9 bg-orange-100 rounded-full items-center justify-center">
                <Feather
                  name="package"
                  size={20}
                  color={COLORS.primary.DEFAULT}
                />
              </View>
            </View>
          </View>

          <View style={[styles.card, { marginLeft: 8 }]}>
            <Text className="text-gray-500 mb-1">En Attente</Text>
            <View className="flex-row items-center justify-between">
              <Text className="text-2xl font-bold">{String(pendingCount)}</Text>
              <View className="w-9 h-9 bg-orange-100 rounded-full items-center justify-center">
                <Feather
                  name="clock"
                  size={20}
                  color={COLORS.primary.DEFAULT}
                />
              </View>
            </View>
          </View>
        </View>

        {/* Map Section */}
        <View
          className="mx-4 mt-4 bg-white rounded-xl overflow-hidden"
          style={styles.cardShadow}
        >
          <View className="flex-row items-center justify-between p-4 pb-2">
            <Text className="text-lg font-semibold">Carte des Commandes</Text>
            {mapError && (
              <TouchableOpacity
                onPress={() => {
                  setMapError(false);
                  setError(null);
                  setMapReady(false);
                }}
                className="bg-orange-500 px-3 py-1 rounded-md"
              >
                <Text className="text-white text-xs">Réessayer</Text>
              </TouchableOpacity>
            )}
          </View>

          {mapError ? (
            <View className="h-48 items-center justify-center bg-gray-100">
              <Feather name="map-off" size={40} color="#9CA3AF" />
              <Text className="text-gray-500 mt-2">Carte indisponible</Text>
              <Text className="text-gray-400 text-sm text-center px-4">
                Vérifiez votre connexion internet
              </Text>
            </View>
          ) : (
            <View className="h-48 w-full">
              <MapView
                ref={mapRef}
                style={{ flex: 1 }}
                initialRegion={region}
                onLayout={(event) => {
                  console.log("Map layout:", event.nativeEvent.layout);
                  // Set map ready after layout instead of waiting for onMapReady
                  if (!mapReady) {
                    console.log("Setting map ready from onLayout");
                    setMapReady(true);
                  }
                }}
                onError={(error) => {
                  console.error("MAP ERROR:", error);
                  handleMapError(error);
                }}
                loadingEnabled={false} // Disable default loading
                mapType="standard"
              >
                {mapReady &&
                  orders
                    .filter(
                      (o) =>
                        o.coordinates &&
                        typeof o.coordinates.latitude === "number" &&
                        typeof o.coordinates.longitude === "number"
                    )
                    .filter(
                      (order, index, arr) =>
                        arr.findIndex((o) => o.id === order.id) === index
                    )
                    .map((o, index) => (
                      <Marker
                        key={`${safeString(o.userId)}_${safeString(
                          o.id
                        )}_${index}`}
                        coordinate={o.coordinates}
                        onPress={() => setActiveWithValidation(o)}
                      >
                        <View className="bg-orange-500 p-2 rounded-full border-2 border-white">
                          <Feather name="package" size={16} color="white" />
                        </View>
                      </Marker>
                    ))}
              </MapView>

              {!mapReady && (
                <View className="absolute inset-0 items-center justify-center bg-gray-100">
                  <ActivityIndicator
                    size="large"
                    color={COLORS.primary.DEFAULT}
                  />
                  <Text className="text-gray-500 mt-2">
                    Chargement de la carte...
                  </Text>
                </View>
              )}
            </View>
          )}
        </View>

        {/* Orders List Preview */}
        <View className="mx-4 mt-4 mb-6">
          <View className="flex-row items-center justify-between mb-2">
            <Text className="text-lg font-semibold">Dernières Commandes</Text>
            <TouchableOpacity onPress={() => router.push("/(tabs)/deliveries")}>
              <Text className="text-orange-500">Voir Tout</Text>
            </TouchableOpacity>
          </View>

          {orders.length ? (
            orders
              // Remove duplicates first
              .filter(
                (order, index, arr) =>
                  arr.findIndex((o) => o.id === order.id) === index
              )
              .slice(0, 5)
              .map((o, index) => (
                <TouchableOpacity
                  key={`order_${safeString(o.userId)}_${safeString(
                    o.id
                  )}_${index}`}
                  onPress={() => openDetails(o)}
                  style={styles.card}
                  className="mb-3"
                >
                  <View className="flex-row justify-between items-center mb-1">
                    <Text className="text-gray-800 font-semibold">
                      #{safeString(o.id)}
                    </Text>
                    <View
                      className={`px-2 py-1 rounded-full ${
                        o.status === "pending"
                          ? "bg-yellow-100"
                          : o.status === "in-progress"
                          ? "bg-blue-100"
                          : o.status === "cancelled"
                          ? "bg-red-100"
                          : "bg-green-100"
                      }`}
                    >
                      <Text
                        className={`text-xs font-medium ${
                          o.status === "pending"
                            ? "text-yellow-700"
                            : o.status === "in-progress"
                            ? "text-blue-700"
                            : o.status === "cancelled"
                            ? "text-red-700"
                            : "text-green-700"
                        }`}
                      >
                        {o.status === "pending"
                          ? "En attente"
                          : o.status === "in-progress"
                          ? "En cours"
                          : o.status === "cancelled"
                          ? "Annulée"
                          : "Terminée"}
                      </Text>
                    </View>
                  </View>
                  <Text className="text-gray-800 font-medium">
                    {safeString(o.customerName, "Client")}
                  </Text>
                  <Text className="text-gray-500 text-sm" numberOfLines={1}>
                    {safeString(o.address, "Pas d'adresse")}
                  </Text>
                  <View className="flex-row justify-between items-center mt-1">
                    <Text className="text-gray-600 text-xs">
                      {String(safeNumber(o.items?.length, 0))} article(s)
                    </Text>
                    <Text className="text-orange-500 font-semibold">
                      {safeNumber(o.total, 0).toFixed(2)} MAD
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

      {/* Tapped marker sheet */}
      {active && (
        <View
          className="absolute bottom-0 left-0 right-0 bg-white rounded-t-xl p-4"
          style={styles.bottomShadow}
        >
          <View className="flex-row justify-between items-center mb-2">
            <View className="flex-row items-center">
              <View className="bg-orange-100 p-2 rounded-full mr-3">
                <Feather
                  name="package"
                  size={20}
                  color={COLORS.primary.DEFAULT}
                />
              </View>
              <View>
                <Text className="text-gray-500 text-xs">
                  #{safeString(active.id)}
                </Text>
                <Text className="text-gray-900 font-semibold">
                  {safeString(active.customerName, "Client")}
                </Text>
              </View>
            </View>
            <TouchableOpacity
              onPress={() => openDetails(active)}
              className="bg-orange-500 px-4 py-2 rounded-lg"
            >
              <Text className="text-white font-medium">Ouvrir</Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity
            onPress={() => setActive(null)}
            className="absolute top-2 right-2"
          >
            <Feather name="x" size={20} color={COLORS.gray.dark} />
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  cardShadow: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  bottomShadow: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
});
