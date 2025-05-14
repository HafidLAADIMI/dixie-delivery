// app/_layout.tsx
import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { Stack, Redirect } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as SplashScreen from 'expo-splash-screen';
import * as Font from 'expo-font';
import {
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold,
    Poppins_700Bold
} from '@expo-google-fonts/poppins';
import { COLORS } from '@/constants/theme';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { LocationProvider } from '@/contexts/LocationContext';
import { View, ActivityIndicator, Text } from 'react-native';

// Keep splash screen visible while loading resources
SplashScreen.preventAutoHideAsync();

// Main authentication-aware layout wrapper component
function RootLayoutNav() {
    const { user, loading } = useAuth();

    // Show loading indicator while authentication state is being determined
    if (loading) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.primary.DEFAULT }}>
                <ActivityIndicator size="large" color="white" />
                <Text style={{ marginTop: 20, color: 'white', fontSize: 16 }}>Chargement...</Text>
            </View>
        );
    }

    return (
        <>
            <StatusBar style="light" />
            <Stack screenOptions={{ headerShown: false }}>
                {/* Auth group - accessible when not logged in */}
                {!user ? (
                    <>
                        {/* Redirect to login as the default route when not authenticated */}
                        <Stack.Screen name="index" options={{ headerShown: false }}>
                            {() => <Redirect href="/(auth)/login" />}
                        </Stack.Screen>

                        <Stack.Screen name="(auth)" options={{ animation: 'fade' }} />
                    </>
                ) : (
                    <>
                        {/* Redirect to app as the default route when authenticated */}
                        <Stack.Screen name="index" options={{ headerShown: false }}>
                            {() => <Redirect href="/(tabs)" />}
                        </Stack.Screen>

                        {/* Main app screens - protected routes */}
                        <Stack.Screen name="(tabs)" options={{ animation: 'fade_from_bottom' }} />

                        {/* Modal screens */}
                        <Stack.Screen
                            name="delivery/[id]"
                            options={{
                                presentation: 'card',
                                headerShown: true,
                                headerTitle: 'Détails de Livraison',
                                headerTintColor: COLORS.white,
                                headerStyle: { backgroundColor: COLORS.primary.DEFAULT }
                            }}
                        />
                        <Stack.Screen
                            name="delivery-confirmation/[id]"
                            options={{
                                presentation: 'modal',
                                headerShown: true,
                                headerTitle: 'Confirmation de Livraison',
                                headerTintColor: COLORS.white,
                                headerStyle: { backgroundColor: COLORS.primary.DEFAULT }
                            }}
                        />
                        <Stack.Screen
                            name="delivery-success"
                            options={{
                                presentation: 'transparentModal',
                                headerShown: false
                            }}
                        />
                    </>
                )}
            </Stack>
        </>
    );
}

export default function RootLayout() {
    const [fontsLoaded, setFontsLoaded] = React.useState(false);

    useEffect(() => {
        async function loadResources() {
            try {
                // Load fonts
                await Font.loadAsync({
                    Poppins_400Regular,
                    Poppins_500Medium,
                    Poppins_600SemiBold,
                    Poppins_700Bold,
                });
                setFontsLoaded(true);
            } catch (e) {
                console.warn(e);
            } finally {
                await SplashScreen.hideAsync();
            }
        }

        loadResources();
    }, []);

    if (!fontsLoaded) {
        return null;
    }

    return (
        <GestureHandlerRootView style={{ flex: 1 }}>
            <SafeAreaProvider>
                <AuthProvider>
                    <LocationProvider>
                        <RootLayoutNav />
                    </LocationProvider>
                </AuthProvider>
            </SafeAreaProvider>
        </GestureHandlerRootView>
    );
}