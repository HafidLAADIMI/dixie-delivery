// NotFoundScreen.js
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { COLORS } from '@/constants/theme';
import { StatusBar } from 'expo-status-bar';

export default function NotFoundScreen({
                                           title = "Page Non Trouvée",
                                           message = "La page que vous recherchez n'existe pas ou a été déplacée.",
                                           buttonText = "Retour à l'accueil",
                                           onButtonPress = () => router.replace('/(tabs)'), // Default to home screen
                                           showBackButton = true,
                                           icon = "alert-circle" // Feather icon name
                                       }) {
    return (
        <SafeAreaView style={styles.container}>
            <StatusBar style="dark" />

            {/* Optional Back Button */}
            {showBackButton && (
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => router.back()}
                >
                    <Feather name="arrow-left" size={24} color={COLORS.gray.DEFAULT} />
                </TouchableOpacity>
            )}

            <View style={styles.content}>
                {/* Icon */}
                <View style={styles.iconContainer}>
                    <Feather name={icon} size={80} color={COLORS.primary.DEFAULT} />
                </View>

                {/* Text */}
                <Text style={styles.title}>{title}</Text>
                <Text style={styles.message}>{message}</Text>

                {/* Action Button */}
                <TouchableOpacity
                    style={styles.button}
                    onPress={onButtonPress}
                >
                    <Text style={styles.buttonText}>{buttonText}</Text>
                </TouchableOpacity>

                {/* Optional Illustration */}
                <Image
                    source={require('@/assets/not-found.jpg')} // Make sure to add this image to your assets
                    style={styles.illustration}
                    resizeMode="contain"
                />
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f9fafb',
    },
    backButton: {
        position: 'absolute',
        top: 20,
        left: 20,
        zIndex: 10,
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'white',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    content: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 30,
    },
    iconContainer: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: 'rgba(249, 115, 22, 0.1)', // Light orange background
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 30,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#1f2937',
        marginBottom: 10,
        textAlign: 'center',
    },
    message: {
        fontSize: 16,
        color: '#6b7280',
        textAlign: 'center',
        marginBottom: 30,
        lineHeight: 22,
    },
    button: {
        backgroundColor: COLORS.primary.DEFAULT,
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 3,
    },
    buttonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
    },
    illustration: {
        width: '100%',
        height: 200,
        marginTop: 40,
        opacity: 0.9,
    }
});