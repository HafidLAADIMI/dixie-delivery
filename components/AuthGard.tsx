// components/AuthGuard.tsx
import React, { useEffect } from 'react';
import { View, ActivityIndicator, Text } from 'react-native';
import { Redirect } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { COLORS } from '@/constants/theme';

interface AuthGuardProps {
    children: React.ReactNode;
}

/**
 * AuthGuard component that can be used on individual screens
 * to protect them from unauthorized access
 */
const AuthGuard: React.FC<AuthGuardProps> = ({ children }) => {
    const { user, loading } = useAuth();

    if (loading) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f9fafb' }}>
                <ActivityIndicator size="large" color={COLORS.primary.DEFAULT} />
                <Text style={{ marginTop: 10, color: '#6b7280' }}>Vérification de l'authentification...</Text>
            </View>
        );
    }

    if (!user) {
        // Redirect to login if not authenticated
        return <Redirect href="/(auth)/login" />;
    }

    // User is authenticated, render children
    return <>{children}</>;
};

export default AuthGuard;