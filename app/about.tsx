// app/(app)/about.tsx
import React from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  Linking,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Feather } from "@expo/vector-icons";

export default function AboutScreen() {
  const appVersion = "1.0.0";
  const buildNumber = "4";

  const openWebsite = () => {
    Linking.openURL("https://Afood.ma");
  };

  const openEmail = () => {
    Linking.openURL("mailto:oumzil@gmail.com");
  };

  const openPrivacyPolicy = () => {
    Linking.openURL("https://Afood.ma/privacy");
  };

  const openTermsOfService = () => {
    Linking.openURL("https://Afood.ma/terms");
  };

  const teamMembers = [
    {
      name: "Équipe Afood",
      role: "Développement & Design",
      description:
        "Passionnés par la livraison de nourriture et la technologie",
    },
  ];

  const features = [
    {
      icon: "map-pin",
      title: "Suivi en temps réel",
      description: "Suivez vos livraisons en direct avec notre système GPS",
    },
    {
      icon: "clock",
      title: "Livraisons rapides",
      description: "Optimisation des trajets pour des livraisons efficaces",
    },
    {
      icon: "smartphone",
      title: "Interface intuitive",
      description: "Application simple et facile à utiliser",
    },
    {
      icon: "shield",
      title: "Sécurisé",
      description: "Vos données sont protégées et sécurisées",
    },
  ];

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="flex-row items-center justify-between p-4 bg-white border-b border-gray-200">
        <TouchableOpacity onPress={() => router.back()} className="p-2">
          <Feather name="arrow-left" size={24} color="#374151" />
        </TouchableOpacity>

        <Text className="text-lg font-bold text-gray-800">À Propos</Text>

        <View className="w-8" />
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* App Logo and Info */}
        <View className="bg-white mx-4 mt-4 rounded-xl p-6 shadow-sm items-center">
          <Image
            source={require("@/assets/logo.png")}
            className="w-24 h-24 rounded-xl mb-4"
            resizeMode="contain"
          />
          <Text className="text-2xl font-bold text-gray-800 mb-2">
            Afood Delivery
          </Text>
          <Text className="text-gray-600 text-center mb-4">
            Application de livraison pour les livreurs partenaires de Afood
          </Text>
          <View className="bg-orange-100 px-4 py-2 rounded-full">
            <Text className="text-orange-600 font-medium">
              Version {appVersion} ({buildNumber})
            </Text>
          </View>
        </View>

        {/* Mission */}
        <View className="bg-white mx-4 mt-4 rounded-xl p-4 shadow-sm">
          <View className="flex-row items-center mb-3">
            <Feather name="target" size={24} color="#F97316" />
            <Text className="text-lg font-bold text-gray-800 ml-3">
              Notre Mission
            </Text>
          </View>
          <Text className="text-gray-600 text-sm leading-6">
            Chez Afood, nous connectons les livreurs avec les restaurants et les
            clients pour créer un écosystème de livraison efficace et fiable.
            Notre mission est de faciliter la vie des livreurs tout en
            garantissant une expérience exceptionnelle aux clients.
          </Text>
        </View>

        {/* Features */}
        <View className="bg-white mx-4 mt-4 rounded-xl shadow-sm">
          <Text className="text-lg font-bold text-gray-800 p-4 pb-2">
            Fonctionnalités principales
          </Text>

          {features.map((feature, index) => (
            <View
              key={index}
              className={`flex-row p-4 ${
                index < features.length - 1 ? "border-b border-gray-100" : ""
              }`}
            >
              <View className="w-12 h-12 bg-orange-100 rounded-full items-center justify-center mr-4">
                <Feather name={feature.icon as any} size={20} color="#F97316" />
              </View>
              <View className="flex-1">
                <Text className="text-gray-800 font-semibold mb-1">
                  {feature.title}
                </Text>
                <Text className="text-gray-600 text-sm">
                  {feature.description}
                </Text>
              </View>
            </View>
          ))}
        </View>

        {/* Team */}
        <View className="bg-white mx-4 mt-4 rounded-xl shadow-sm">
          <Text className="text-lg font-bold text-gray-800 p-4 pb-2">
            Notre Équipe
          </Text>

          {teamMembers.map((member, index) => (
            <View key={index} className="flex-row p-4">
              <View className="w-12 h-12 bg-blue-100 rounded-full items-center justify-center mr-4">
                <Feather name="users" size={20} color="#3B82F6" />
              </View>
              <View className="flex-1">
                <Text className="text-gray-800 font-semibold mb-1">
                  {member.name}
                </Text>
                <Text className="text-orange-500 text-sm font-medium mb-1">
                  {member.role}
                </Text>
                <Text className="text-gray-600 text-sm">
                  {member.description}
                </Text>
              </View>
            </View>
          ))}
        </View>

        {/* Company Info */}
        <View className="bg-white mx-4 mt-4 rounded-xl shadow-sm">
          <Text className="text-lg font-bold text-gray-800 p-4 pb-2">
            Informations société
          </Text>

          <View className="px-4 pb-4">
            <View className="flex-row items-center mb-3">
              <Feather name="map-pin" size={16} color="#6B7280" />
              <Text className="text-gray-600 ml-2">Casablanca, Morocco</Text>
            </View>

            <TouchableOpacity
              className="flex-row items-center mb-3"
              onPress={openWebsite}
            >
              <Feather name="globe" size={16} color="#F97316" />
              <Text className="text-orange-500 ml-2">https://Afood.ma</Text>
            </TouchableOpacity>

            <TouchableOpacity
              className="flex-row items-center"
              onPress={openEmail}
            >
              <Feather name="mail" size={16} color="#F97316" />
              <Text className="text-orange-500 ml-2">oumzil@gmail.com</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Legal Links */}
        <View className="bg-white mx-4 mt-4 rounded-xl shadow-sm">
          <Text className="text-lg font-bold text-gray-800 p-4 pb-2">
            Mentions légales
          </Text>

          <TouchableOpacity
            className="flex-row items-center justify-between p-4 border-b border-gray-100"
            onPress={openPrivacyPolicy}
          >
            <View className="flex-row items-center">
              <Feather name="shield" size={20} color="#6B7280" />
              <Text className="text-gray-800 ml-3">
                Politique de confidentialité
              </Text>
            </View>
            <Feather name="external-link" size={16} color="#9CA3AF" />
          </TouchableOpacity>

          <TouchableOpacity
            className="flex-row items-center justify-between p-4 border-b border-gray-100"
            onPress={openTermsOfService}
          >
            <View className="flex-row items-center">
              <Feather name="file-text" size={20} color="#6B7280" />
              <Text className="text-gray-800 ml-3">
                Conditions d'utilisation
              </Text>
            </View>
            <Feather name="external-link" size={16} color="#9CA3AF" />
          </TouchableOpacity>

          <TouchableOpacity
            className="flex-row items-center justify-between p-4"
            onPress={() => router.push("/(app)/privacy-settings")}
          >
            <View className="flex-row items-center">
              <Feather name="settings" size={20} color="#6B7280" />
              <Text className="text-gray-800 ml-3">
                Paramètres de confidentialité
              </Text>
            </View>
            <Feather name="chevron-right" size={16} color="#9CA3AF" />
          </TouchableOpacity>
        </View>

        {/* Technology Stack */}
        <View className="bg-white mx-4 mt-4 mb-8 rounded-xl p-4 shadow-sm">
          <View className="flex-row items-center mb-3">
            <Feather name="code" size={24} color="#F97316" />
            <Text className="text-lg font-bold text-gray-800 ml-3">
              Technologies utilisées
            </Text>
          </View>
          <Text className="text-gray-600 text-sm leading-6">
            Application développée avec React Native et Expo. Utilise Firebase
            pour la base de données, Google Maps pour la géolocalisation, et
            Stripe pour les paiements. Conçue pour offrir une expérience native
            sur iOS et Android.
          </Text>

          <View className="mt-4 pt-4 border-t border-gray-100">
            <Text className="text-gray-500 text-xs text-center">
              © 2024 Afood. Tous droits réservés.
            </Text>
            <Text className="text-gray-500 text-xs text-center mt-1">
              Made with ❤️ in Morocco
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
