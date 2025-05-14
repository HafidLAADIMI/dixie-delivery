// Updated app/(auth)/_layout.tsx
import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { Redirect } from 'expo-router';

/**
 * Layout for authentication screens
 * This ensures that authenticated users can't access auth screens
 * and that users with inactive/suspended status are signed out
 */
export default function AuthLayout() {
    const { user, loading, refreshUserStatus } = useAuth();

    // Check user status on component mount
    useEffect(() => {
        const checkStatus = async () => {
            if (user) {
                await refreshUserStatus();
            }
        };

        checkStatus();
    }, [user]);

    // If loading, let the screens handle the loading state
    if (loading) {
        return <Stack screenOptions={{ headerShown: false }}/>;
    }

    // If user is already authenticated, redirect to app home
    // We don't need additional checks here as the AuthContext takes care of signing out invalid users
    if (user) {
        return <Redirect href="/(tabs)" />;
    }

    // User is not authenticated, show auth screens
    return (
        <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="login" />
            <Stack.Screen name="signup" options={{ animation: 'slide_from_right' }} />
            <Stack.Screen name="forgot-password" options={{ animation: 'slide_from_right' }} />
        </Stack>
    );
}