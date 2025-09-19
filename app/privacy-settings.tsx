// app/(app)/privacy-settings.tsx
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Switch,
  Alert,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Feather } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  requestTrackingPermission,
  getTrackingPermissionStatus,
} from "@/utils/trackingPermission";
import { PrivacyDisclosure } from "@/components/PrivacyDisclosure";

const STORAGE_KEYS = {
  PRIVACY_ACCEPTED: "@privacy_accepted",
  TRACKING_PERMISSION: "@tracking_permission",
  ANALYTICS_ENABLED: "@analytics_enabled",
  MARKETING_ENABLED: "@marketing_enabled",
};

export default function PrivacySettingsScreen() {
  const [loading, setLoading] = useState(true);
  const [showPrivacyDisclosure, setShowPrivacyDisclosure] = useState(false);

  // Privacy settings state
  const [trackingEnabled, setTrackingEnabled] = useState(false);
  const [analyticsEnabled, setAnalyticsEnabled] = useState(true);
  const [marketingEnabled, setMarketingEnabled] = useState(true);
  const [trackingStatus, setTrackingStatus] = useState("undetermined");

  useEffect(() => {
    loadPrivacySettings();
  }, []);

  const loadPrivacySettings = async () => {
    try {
      setLoading(true);

      // Load current settings
      const [tracking, analytics, marketing, status] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.TRACKING_PERMISSION),
        AsyncStorage.getItem(STORAGE_KEYS.ANALYTICS_ENABLED),
        AsyncStorage.getItem(STORAGE_KEYS.MARKETING_ENABLED),
        getTrackingPermissionStatus(),
      ]);

      setTrackingEnabled(tracking === "true");
      setAnalyticsEnabled(analytics !== "false"); // Default to true
      setMarketingEnabled(marketing !== "false"); // Default to true
      setTrackingStatus(status);
    } catch (error) {
      console.error("Error loading privacy settings:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleTrackingToggle = async (enabled) => {
    if (enabled) {
      // Request permission
      const granted = await requestTrackingPermission();
      if (granted) {
        setTrackingEnabled(true);
        await AsyncStorage.setItem(STORAGE_KEYS.TRACKING_PERMISSION, "true");
        Alert.alert(
          "Suivi activé",
          "Le suivi publicitaire a été activé. Cela nous aide à améliorer votre expérience."
        );
      } else {
        Alert.alert(
          "Permission refusée",
          "Le suivi publicitaire n'a pas pu être activé. Vous pouvez modifier cela dans les paramètres iOS."
        );
      }
    } else {
      setTrackingEnabled(false);
      await AsyncStorage.setItem(STORAGE_KEYS.TRACKING_PERMISSION, "false");
      Alert.alert(
        "Suivi désactivé",
        "Le suivi publicitaire a été désactivé. Vos données ne seront plus utilisées pour la publicité personnalisée."
      );
    }

    // Reload status
    const newStatus = await getTrackingPermissionStatus();
    setTrackingStatus(newStatus);
  };

  const handleAnalyticsToggle = async (enabled) => {
    setAnalyticsEnabled(enabled);
    await AsyncStorage.setItem(
      STORAGE_KEYS.ANALYTICS_ENABLED,
      enabled.toString()
    );

    Alert.alert(
      enabled ? "Analytics activés" : "Analytics désactivés",
      enabled
        ? "Les données d'analyse nous aident à améliorer l'application."
        : "Les données d'analyse ne seront plus collectées."
    );
  };

  const handleMarketingToggle = async (enabled) => {
    setMarketingEnabled(enabled);
    await AsyncStorage.setItem(
      STORAGE_KEYS.MARKETING_ENABLED,
      enabled.toString()
    );

    Alert.alert(
      enabled
        ? "Communications marketing activées"
        : "Communications marketing désactivées",
      enabled
        ? "Vous recevrez des offres et des nouvelles de nos services."
        : "Vous ne recevrez plus de communications marketing."
    );
  };

  const showFullPrivacyPolicy = () => {
    setShowPrivacyDisclosure(true);
  };

  const resetAllSettings = () => {
    Alert.alert(
      "Réinitialiser les paramètres",
      "Êtes-vous sûr de vouloir réinitialiser tous vos paramètres de confidentialité ?",
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Réinitialiser",
          style: "destructive",
          onPress: async () => {
            try {
              await AsyncStorage.multiRemove([
                STORAGE_KEYS.TRACKING_PERMISSION,
                STORAGE_KEYS.ANALYTICS_ENABLED,
                STORAGE_KEYS.MARKETING_ENABLED,
              ]);
              await loadPrivacySettings();
              Alert.alert("Succès", "Les paramètres ont été réinitialisés");
            } catch (error) {
              Alert.alert(
                "Erreur",
                "Impossible de réinitialiser les paramètres"
              );
            }
          },
        },
      ]
    );
  };

  const getTrackingStatusText = () => {
    switch (trackingStatus) {
      case "granted":
        return "Autorisé";
      case "denied":
        return "Refusé";
      case "restricted":
        return "Restreint";
      case "not_applicable":
        return "Non applicable";
      default:
        return "Non déterminé";
    }
  };

  const getTrackingStatusColor = () => {
    switch (trackingStatus) {
      case "granted":
        return "#10B981"; // green
      case "denied":
        return "#EF4444"; // red
      case "restricted":
        return "#F59E0B"; // amber
      default:
        return "#6B7280"; // gray
    }
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-white justify-center items-center">
        <ActivityIndicator size="large" color="#F97316" />
        <Text className="text-gray-500 mt-4">Chargement des paramètres...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="flex-row items-center justify-between p-4 bg-white border-b border-gray-200">
        <TouchableOpacity onPress={() => router.back()} className="p-2">
          <Feather name="arrow-left" size={24} color="#374151" />
        </TouchableOpacity>

        <Text className="text-lg font-bold text-gray-800">
          Paramètres de confidentialité
        </Text>

        <View className="w-8" />
      </View>

      <ScrollView className="flex-1">
        {/* Privacy Overview */}
        <View className="bg-white mx-4 mt-4 rounded-xl p-4 shadow-sm">
          <View className="flex-row items-center mb-3">
            <Feather name="shield" size={24} color="#F97316" />
            <Text className="text-lg font-bold text-gray-800 ml-3">
              Votre confidentialité
            </Text>
          </View>
          <Text className="text-gray-600 text-sm leading-5">
            Contrôlez comment vos données sont utilisées et partagées. Vous
            pouvez modifier ces paramètres à tout moment.
          </Text>
        </View>

        {/* App Tracking Transparency */}
        <View className="bg-white mx-4 mt-4 rounded-xl shadow-sm">
          <View className="p-4 border-b border-gray-100">
            <Text className="text-lg font-semibold text-gray-800 mb-2">
              Suivi publicitaire
            </Text>
            <Text className="text-gray-600 text-sm mb-3">
              Permet aux apps de suivre votre activité pour personnaliser les
              publicités.
            </Text>

            <View className="flex-row items-center justify-between">
              <View className="flex-1">
                <Text className="text-gray-800 font-medium">
                  Autoriser le suivi
                </Text>
                <Text className="text-gray-500 text-xs mt-1">
                  Statut:{" "}
                  <Text style={{ color: getTrackingStatusColor() }}>
                    {getTrackingStatusText()}
                  </Text>
                </Text>
              </View>
              <Switch
                value={trackingEnabled}
                onValueChange={handleTrackingToggle}
                trackColor={{ false: "#E5E7EB", true: "#FDE68A" }}
                thumbColor={trackingEnabled ? "#F97316" : "#9CA3AF"}
              />
            </View>
          </View>
        </View>

        {/* Analytics Settings */}
        <View className="bg-white mx-4 mt-4 rounded-xl shadow-sm">
          <View className="p-4 border-b border-gray-100">
            <Text className="text-lg font-semibold text-gray-800 mb-2">
              Données d'analyse
            </Text>
            <Text className="text-gray-600 text-sm mb-3">
              Aide à améliorer l'application en analysant l'utilisation (données
              anonymisées).
            </Text>

            <View className="flex-row items-center justify-between">
              <View className="flex-1">
                <Text className="text-gray-800 font-medium">
                  Partager les analytics
                </Text>
                <Text className="text-gray-500 text-xs mt-1">
                  Données anonymes sur l'utilisation
                </Text>
              </View>
              <Switch
                value={analyticsEnabled}
                onValueChange={handleAnalyticsToggle}
                trackColor={{ false: "#E5E7EB", true: "#FDE68A" }}
                thumbColor={analyticsEnabled ? "#F97316" : "#9CA3AF"}
              />
            </View>
          </View>
        </View>

        {/* Marketing Communications */}
        <View className="bg-white mx-4 mt-4 rounded-xl shadow-sm">
          <View className="p-4 border-b border-gray-100">
            <Text className="text-lg font-semibold text-gray-800 mb-2">
              Communications marketing
            </Text>
            <Text className="text-gray-600 text-sm mb-3">
              Recevez des offres spéciales et des nouvelles sur nos services.
            </Text>

            <View className="flex-row items-center justify-between">
              <View className="flex-1">
                <Text className="text-gray-800 font-medium">
                  Recevoir les offres
                </Text>
                <Text className="text-gray-500 text-xs mt-1">
                  Emails et notifications promotionnelles
                </Text>
              </View>
              <Switch
                value={marketingEnabled}
                onValueChange={handleMarketingToggle}
                trackColor={{ false: "#E5E7EB", true: "#FDE68A" }}
                thumbColor={marketingEnabled ? "#F97316" : "#9CA3AF"}
              />
            </View>
          </View>
        </View>

        {/* Data Management */}
        <View className="bg-white mx-4 mt-4 rounded-xl shadow-sm">
          <Text className="text-lg font-semibold text-gray-800 p-4 pb-2">
            Gestion des données
          </Text>

          <TouchableOpacity
            className="flex-row items-center p-4 border-b border-gray-100"
            onPress={showFullPrivacyPolicy}
          >
            <View className="w-10 h-10 bg-blue-100 rounded-full items-center justify-center mr-3">
              <Feather name="file-text" size={18} color="#3B82F6" />
            </View>
            <View className="flex-1">
              <Text className="text-gray-800 font-medium">
                Politique de confidentialité
              </Text>
              <Text className="text-gray-500 text-sm">
                Lire la politique complète
              </Text>
            </View>
            <Feather name="external-link" size={20} color="#9CA3AF" />
          </TouchableOpacity>

          <TouchableOpacity
            className="flex-row items-center p-4 border-b border-gray-100"
            onPress={() => router.push("/(app)/delete-account")}
          >
            <View className="w-10 h-10 bg-red-100 rounded-full items-center justify-center mr-3">
              <Feather name="trash-2" size={18} color="#EF4444" />
            </View>
            <View className="flex-1">
              <Text className="text-red-600 font-medium">
                Supprimer mon compte
              </Text>
              <Text className="text-gray-500 text-sm">
                Supprime toutes vos données
              </Text>
            </View>
            <Feather name="chevron-right" size={20} color="#EF4444" />
          </TouchableOpacity>

          <TouchableOpacity
            className="flex-row items-center p-4"
            onPress={resetAllSettings}
          >
            <View className="w-10 h-10 bg-gray-100 rounded-full items-center justify-center mr-3">
              <Feather name="refresh-ccw" size={18} color="#6B7280" />
            </View>
            <View className="flex-1">
              <Text className="text-gray-800 font-medium">
                Réinitialiser les paramètres
              </Text>
              <Text className="text-gray-500 text-sm">
                Revenir aux paramètres par défaut
              </Text>
            </View>
            <Feather name="chevron-right" size={20} color="#9CA3AF" />
          </TouchableOpacity>
        </View>

        {/* Contact Info */}
        <View className="bg-white mx-4 mt-4 mb-8 rounded-xl p-4 shadow-sm">
          <Text className="text-lg font-semibold text-gray-800 mb-3">
            Questions sur la confidentialité ?
          </Text>
          <Text className="text-gray-600 text-sm mb-3">
            Contactez-nous pour toute question concernant vos données
            personnelles.
          </Text>
          <Text className="text-orange-500 font-medium">
            📧 oumzil@gmail.com
          </Text>
          <Text className="text-orange-500 font-medium">
            🌐 https://Afood.ma
          </Text>
        </View>
      </ScrollView>

      {/* Privacy Disclosure Modal */}
      {showPrivacyDisclosure && (
        <PrivacyDisclosure
          visible={showPrivacyDisclosure}
          onAccept={() => setShowPrivacyDisclosure(false)}
          onDecline={() => setShowPrivacyDisclosure(false)}
        />
      )}
    </SafeAreaView>
  );
}
