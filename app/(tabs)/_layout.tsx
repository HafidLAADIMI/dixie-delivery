// app/(app)/_layout.tsx
import React from 'react';
import {Redirect, Tabs} from 'expo-router';
import { Ionicons, Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS } from '@/constants/theme';
import {useAuth} from "@/contexts/AuthContext";
import {ActivityIndicator, Text, View} from "react-native";

export default function AppLayout() {
    const insets = useSafeAreaInsets();
    const { user, loading } = useAuth();

    // If still loading auth state, show loading indicator
    if (loading) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f9fafb' }}>
                <ActivityIndicator size="large" color={COLORS.primary.DEFAULT} />
                <Text style={{ marginTop: 10, color: '#6b7280' }}>Vérification de l'authentification...</Text>
            </View>
        );
    }

    // If no user is authenticated, redirect to login
    if (!user) {
        return <Redirect href="/(auth)/login" />;
    }

    return (
        <Tabs
            screenOptions={{
                headerShown: true,
                headerStyle: {
                    backgroundColor: COLORS.primary.DEFAULT,
                },
                headerTintColor: COLORS.white,
                tabBarActiveTintColor: COLORS.primary.DEFAULT,
                tabBarInactiveTintColor: COLORS.gray.DEFAULT,
                tabBarStyle: {
                    backgroundColor: COLORS.white,
                    borderTopColor: COLORS.gray.light,
                    height: 60 + insets.bottom,
                    paddingBottom: insets.bottom,
                    paddingTop: 10,
                },
                tabBarLabelStyle: {
                    fontFamily: 'Poppins_500Medium',
                    fontSize: 12,
                    marginTop: -5,
                },
            }}
        >
            <Tabs.Screen
                name="index"
                options={{
                    title: 'Tableau de Bord',
                    tabBarLabel: 'Accueil',
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="home" size={size} color={color} />
                    ),
                }}
            />
            <Tabs.Screen
                name="deliveries"
                options={{
                    title: 'Livraisons',
                    tabBarIcon: ({ color, size }) => (
                        <Feather name="truck" size={size} color={color} />
                    ),
                }}
            />

            <Tabs.Screen
                name="profile"
                options={{
                    title: 'Mon Compte',
                    tabBarLabel: 'Profil',
                    tabBarIcon: ({ color, size }) => (
                        <Feather name="user" size={size} color={color} />
                    ),
                }}
            />
            <Tabs.Screen
                name="notifications"
                options={{
                    title: 'Notifications',
                    tabBarLabel: 'Notifications',
                    tabBarIcon: ({ color, size }) => (
                        <Feather name="bell" size={size} color={color} />
                    ),
                }}
            />
        </Tabs>
    );
}