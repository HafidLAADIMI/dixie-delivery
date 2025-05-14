// app/index.tsx
import React from 'react';
import { View, ActivityIndicator, Text } from 'react-native';
import { Redirect } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { COLORS } from '@/constants/theme';

/**
 * This is the entry point of the app.
 * It checks authentication status and redirects accordingly.
 */
export default function AppEntry() {
    const { user, loading } = useAuth();

    // Show loading indicator while authentication state is being determined
    if (loading) {
        return (
            <View style={{
                flex: 1,
                justifyContent: 'center',
                alignItems: 'center',
                backgroundColor: COLORS.primary.DEFAULT
            }}>
                <ActivityIndicator size="large" color="white" />
                <Text style={{ marginTop: 20, color: 'white', fontSize: 16 }}>
                    Chargement de l'application...
                </Text>
            </View>
        );
    }

    // If auth is loaded, redirect based on auth state
    if (user) {
        // User is authenticated, redirect to the main app
        return <Redirect href="/(tabs)" />;
    } else {
        // User is not authenticated, redirect to login
        return <Redirect href="/(auth)/login" />;
    }
}