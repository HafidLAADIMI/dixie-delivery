// Updated profile screen with better error handling for missing data
import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    Image,
    ScrollView,
    StyleSheet,
    Switch,
    ActivityIndicator,
    Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Feather, Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS } from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import { getDeliverymanDetails, getDeliverymanByEmail } from '@/services/deliverymanService';

export default function ProfileScreen() {
    const { user, signOut } = useAuth();
    const [loading, setLoading] = useState(true);
    const [deliverymanData, setDeliverymanData] = useState(null);
    const [notificationsEnabled, setNotificationsEnabled] = useState(true);
    const [locationEnabled, setLocationEnabled] = useState(true);
    const [error, setError] = useState(null);

    // Fetch additional deliveryman details
    useEffect(() => {
        const fetchData = async () => {
            if (!user) {
                console.log('No user data available');
                setLoading(false);
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
                    setDeliverymanData(data);
                } else {
                    console.log('No deliveryman data found for this user');
                    // We'll just use the user data we have
                }
            } catch (error) {
                console.error('Error fetching deliveryman details:', error);
                setError('Failed to load deliveryman details');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [user]);

    const handleLogout = async () => {
        try {
            await signOut();
            router.replace('/(auth)/login');
        } catch (error) {
            console.error('Logout failed:', error);
            Alert.alert('Logout Failed', 'Unable to log out. Please try again.');
        }
    };

    const navigateToEditProfile = () => {
        router.push('/edit-profile');
    };

    const menuItems = [
        {
            id: 'personal',
            title: 'Informations Personnelles',
            icon: 'user',
            onPress: navigateToEditProfile,
        },
        {
            id: 'payments',
            title: 'Moyens de Paiement',
            icon: 'credit-card',
            onPress: () => router.push('/payment-methods'),
        },
        {
            id: 'history',
            title: 'Historique de Livraisons',
            icon: 'truck',
            onPress: () => router.push('/delivery-history'),
        },
        {
            id: 'support',
            title: 'Support',
            icon: 'headphones',
            onPress: () => router.push('/support'),
        },
        {
            id: 'about',
            title: 'À Propos',
            icon: 'info',
            onPress: () => router.push('/about'),
        },
    ];

    if (loading) {
        return (
            <View className="flex-1 justify-center items-center">
                <ActivityIndicator size="large" color={COLORS.primary.DEFAULT} />
            </View>
        );
    }

    // Use data from either source, preferring deliverymanData when available
    const userData = deliverymanData || user || {};

    // Build full name from various possible sources
    const fullName = (() => {
        // If we have firstName and lastName in deliverymanData
        if (deliverymanData?.firstName || deliverymanData?.lastName) {
            return `${deliverymanData.firstName || ''} ${deliverymanData.lastName || ''}`.trim();
        }

        // If we have firstName and lastName directly in user
        if (user?.firstName || user?.lastName) {
            return `${user.firstName || ''} ${user.lastName || ''}`.trim();
        }

        // If we have a name field
        if (userData.name) {
            return userData.name;
        }

        // Default
        return user?.email?.split('@')[0] || 'Utilisateur';
    })();

    // Get profile image URL from any of the possible fields
    const profileImageUrl =
        userData.profileImageUrl ||
        userData.avatarUrl ||
        `https://ui-avatars.com/api/?name=${encodeURIComponent(fullName)}&background=FFA500&color=fff`;

    // Get other user data with defaults
    const userRole = userData.deliverymanType || userData.role || 'Agent de Livraison';
    const userVehicle = userData.vehicle || 'Motorisé';
    const userPhone = userData.phone || 'Non fourni';
    const userEmail = userData.email || 'Non fourni';
    const userZone = userData.zone || 'Non spécifié';

    return (
        <SafeAreaView edges={['bottom']} className="flex-1 bg-gray-50">
            {/* Profile Header */}
            <LinearGradient
                colors={[COLORS.primary.DEFAULT, COLORS.primary.dark]}
                className="pt-4 pb-8 px-4"
            >
                <View className="flex-row items-center">
                    <Image
                        source={{ uri: profileImageUrl }}
                        className="w-20 h-20 rounded-full border-2 border-white"
                    />
                    <View className="ml-4">
                        <Text className="text-white text-lg font-bold">{fullName}</Text>
                        <Text className="text-white opacity-80">
                            {userRole} | {userVehicle}
                        </Text>
                        <View className="flex-row items-center mt-1">
                            <Ionicons name="star" size={16} color="#FFC107" />
                            <Text className="text-white ml-1">{userData?.rating || '4.5'}</Text>
                        </View>
                    </View>
                </View>
            </LinearGradient>

            {/* Contact Information */}
            <View className="bg-white mx-4 -mt-4 rounded-xl p-4" style={styles.cardShadow}>
                <Text className="text-gray-800 font-semibold mb-3">Coordonnées</Text>

                <View className="flex-row items-center mb-3">
                    <View className="w-8 h-8 bg-orange-100 rounded-full items-center justify-center mr-3">
                        <Feather name="phone" size={16} color={COLORS.primary.DEFAULT} />
                    </View>
                    <View>
                        <Text className="text-gray-500 text-xs">Numéro de Téléphone</Text>
                        <Text className="text-gray-800">{userPhone}</Text>
                    </View>
                </View>

                <View className="flex-row items-center">
                    <View className="w-8 h-8 bg-orange-100 rounded-full items-center justify-center mr-3">
                        <Feather name="mail" size={16} color={COLORS.primary.DEFAULT} />
                    </View>
                    <View>
                        <Text className="text-gray-500 text-xs">Email</Text>
                        <Text className="text-gray-800">{userEmail}</Text>
                    </View>
                </View>
            </View>

            <ScrollView className="flex-1 px-4 pt-4">
                {error && (
                    <View className="bg-red-100 p-3 rounded-xl mb-4">
                        <Text className="text-red-500">{error}</Text>
                    </View>
                )}

                {/* Settings Section */}
                <View className="bg-white rounded-xl mb-4" style={styles.cardShadow}>
                    <Text className="text-gray-800 font-semibold p-4 pb-2">Paramètres</Text>

                    <View className="px-4 py-3 border-b border-gray-100 flex-row justify-between items-center">
                        <View className="flex-row items-center">
                            <View className="w-8 h-8 bg-orange-100 rounded-full items-center justify-center mr-3">
                                <Feather name="bell" size={16} color={COLORS.primary.DEFAULT} />
                            </View>
                            <Text className="text-gray-800">Notifications</Text>
                        </View>
                        <Switch
                            value={notificationsEnabled}
                            onValueChange={setNotificationsEnabled}
                            trackColor={{ false: COLORS.gray.light, true: COLORS.primary.light }}
                            thumbColor={notificationsEnabled ? COLORS.primary.DEFAULT : COLORS.gray.DEFAULT}
                        />
                    </View>

                    <View className="px-4 py-3 flex-row justify-between items-center">
                        <View className="flex-row items-center">
                            <View className="w-8 h-8 bg-orange-100 rounded-full items-center justify-center mr-3">
                                <Feather name="map-pin" size={16} color={COLORS.primary.DEFAULT} />
                            </View>
                            <Text className="text-gray-800">Services de Localisation</Text>
                        </View>
                        <Switch
                            value={locationEnabled}
                            onValueChange={setLocationEnabled}
                            trackColor={{ false: COLORS.gray.light, true: COLORS.primary.light }}
                            thumbColor={locationEnabled ? COLORS.primary.DEFAULT : COLORS.gray.DEFAULT}
                        />
                    </View>
                </View>

                {/* Additional Stats */}
                <View className="bg-white rounded-xl mb-4" style={styles.cardShadow}>
                    <Text className="text-gray-800 font-semibold p-4 pb-2">Statistiques</Text>

                    <View className="flex-row">
                        <View className="flex-1 px-4 py-3 border-r border-gray-100">
                            <Text className="text-gray-500 text-xs">Livraisons</Text>
                            <Text className="text-lg font-bold text-gray-800">
                                {userData?.deliveriesCompleted || '0'}
                            </Text>
                        </View>

                        <View className="flex-1 px-4 py-3">
                            <Text className="text-gray-500 text-xs">Membre Depuis</Text>
                            <Text className="text-gray-800">
                                {userData?.createdAt ?
                                    new Date(userData.createdAt.seconds * 1000).toLocaleDateString() :
                                    userData?.birthdate || 'N/A'}
                            </Text>
                        </View>
                    </View>
                </View>

                {/* Zone Information */}
                <View className="bg-white rounded-xl mb-4" style={styles.cardShadow}>
                    <Text className="text-gray-800 font-semibold p-4 pb-2">Zone de Livraison</Text>
                    <View className="px-4 pb-4">
                        <Text className="text-gray-800">
                            {(() => {
                                // Match zone ID with name if possible
                                const zoneNames = {
                                    'zone1': 'Central Zone',
                                    'zone2': 'North Zone',
                                    'zone3': 'South Zone',
                                    'zone4': 'East Zone',
                                    'zone5': 'West Zone'
                                };
                                return zoneNames[userZone] || userZone;
                            })()}
                        </Text>
                    </View>
                </View>

                {/* Menu Items */}
                <View className="bg-white rounded-xl mb-4" style={styles.cardShadow}>
                    {menuItems.map((item, index) => (
                        <TouchableOpacity
                            key={item.id}
                            className={`px-4 py-3 flex-row items-center justify-between ${
                                index < menuItems.length - 1 ? 'border-b border-gray-100' : ''
                            }`}
                            onPress={item.onPress}
                        >
                            <View className="flex-row items-center">
                                <View className="w-8 h-8 bg-orange-100 rounded-full items-center justify-center mr-3">
                                    <Feather name={item.icon} size={16} color={COLORS.primary.DEFAULT} />
                                </View>
                                <Text className="text-gray-800">{item.title}</Text>
                            </View>
                            <Feather name="chevron-right" size={20} color={COLORS.gray.DEFAULT} />
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Logout Button */}
                <TouchableOpacity
                    className="bg-white rounded-xl p-4 mb-8 items-center"
                    style={styles.cardShadow}
                    onPress={handleLogout}
                >
                    <Text className="text-red-500 font-semibold">Déconnexion</Text>
                </TouchableOpacity>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    cardShadow: {
        shadowColor: '#000',
        shadowOffset: {width: 0, height: 1},
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    }
});