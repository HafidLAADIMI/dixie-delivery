// app/(app)/delivery-success.jsx
import React, { useEffect } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import LottieView from 'lottie-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';

// Import ou définition des couleurs de thème
const COLORS = {
    primary: { DEFAULT: '#F97316', dark: '#EA580C' }, // Orange
};

export default function DeliverySuccessScreen() {
    const fadeAnim = new Animated.Value(0);
    const translateY = new Animated.Value(20);

    // Récupérer la date d'aujourd'hui en format français
    const getFormattedDate = () => {
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        const today = new Date();
        // Première lettre en majuscule et reste en minuscule
        const formattedDate = today.toLocaleDateString('fr-FR', options);
        return formattedDate.charAt(0).toUpperCase() + formattedDate.slice(1);
    };

    useEffect(() => {
        // Séquence d'animation
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 800,
                useNativeDriver: true,
            }),
            Animated.timing(translateY, {
                toValue: 0,
                duration: 800,
                useNativeDriver: true,
            }),
        ]).start();
    }, []);

    const handleGoHome = () => {
        router.replace('/(tabs)');
    };

    const handleViewDeliveries = () => {
        router.replace('/(tabs)/deliveries');
    };

    return (
        <SafeAreaView className="flex-1">
            <LinearGradient
                colors={[COLORS.primary.DEFAULT, COLORS.primary.dark]}
                className="flex-1 items-center justify-center px-6"
            >
                <Animated.View
                    className="items-center"
                    style={{
                        opacity: fadeAnim,
                        transform: [{ translateY }]
                    }}
                >
                    {/* Animation de Succès */}
                    <View className="w-40 h-40 mb-6 items-center justify-center">
                        {typeof LottieView !== 'undefined' ? (
                            <LottieView
                                source={require('@/assets/success-check.png')}
                                autoPlay
                                loop={false}
                                style={{ width: 140, height: 140 }}
                            />
                        ) : (
                            <View className="w-32 h-32 bg-white rounded-full items-center justify-center">
                                <Text className="text-6xl text-green-500">✓</Text>
                            </View>
                        )}
                    </View>

                    {/* Message de Succès */}
                    <Text className="text-white text-3xl font-bold mb-3 text-center">
                        Livraison Terminée !
                    </Text>
                    <Text className="text-white text-center mb-8 opacity-90">
                        La livraison a été terminée et confirmée avec succès.
                    </Text>

                    {/* Carte de Détails */}
                    <View className="bg-white w-full rounded-xl p-5 mb-8" style={styles.cardShadow}>
                        <View className="flex-row justify-between items-center mb-4">
                            <Text className="text-gray-800 font-semibold text-lg">Statistiques du Jour</Text>
                            <View className="bg-green-100 px-3 py-1 rounded-full">
                                <Text className="text-green-700 font-medium text-xs">Mis à jour</Text>
                            </View>
                        </View>

                        <Text className="text-gray-500 text-sm mb-3">{getFormattedDate()}</Text>

                        <View className="flex-row">
                            <View className="flex-1 border-r border-gray-200 pr-4">
                                <Text className="text-gray-500 mb-1">Livraisons</Text>
                                <Text className="text-xl font-bold text-gray-800">6</Text>
                            </View>
                            <View className="flex-1 pl-4">
                                <Text className="text-gray-500 mb-1">Gains</Text>
                                <Text className="text-xl font-bold text-orange-500">89,50 MAD</Text>
                            </View>
                        </View>

                        {/* Dernière Livraison */}
                        <View className="mt-4 pt-4 border-t border-gray-200">
                            <View className="flex-row items-center mb-2">
                                <Feather name="check-circle" size={16} color="#10B981" />
                                <Text className="ml-2 text-gray-800 font-medium">Dernière Livraison</Text>
                            </View>
                            <View className="flex-row justify-between">
                                <Text className="text-gray-500">Montant Collecté:</Text>
                                <Text className="text-gray-800 font-semibold">22,50 MAD</Text>
                            </View>
                        </View>
                    </View>

                    {/* Boutons d'Action */}
                    <View className="w-full">
                        <TouchableOpacity
                            className="bg-white rounded-xl py-3 mb-3 items-center"
                            onPress={handleGoHome}
                        >
                            <Text className="text-orange-500 font-bold text-lg">Tableau de Bord</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            className="text-orange-500 font-bold text-lg"
                            onPress={handleViewDeliveries}
                        >
                            <Text className="text-white font-bold text-lg">Toutes les Livraisons</Text>
                        </TouchableOpacity>
                    </View>
                </Animated.View>
            </LinearGradient>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    cardShadow: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
});