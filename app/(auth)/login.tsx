// app/(auth)/login.tsx
import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    Image,
    ActivityIndicator,
    StyleSheet,
    Alert,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { COLORS } from '@/constants/theme';
import { loginWithEmail, getDeliverymanByEmail } from '@/services/deliverymanService';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/config/firebase';
import { useAuth } from '@/contexts/AuthContext';

export default function LoginScreen() {
    const { signIn } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');

    const validateForm = () => {
        if (!email.trim()) {
            setErrorMessage('L\'email est requis');
            return false;
        }
        if (!/\S+@\S+\.\S+/.test(email)) {
            setErrorMessage('Veuillez entrer un email valide');
            return false;
        }
        if (!password.trim()) {
            setErrorMessage('Le mot de passe est requis');
            return false;
        }
        return true;
    };

    // Updated login function to correctly handle user data
    // Updated login function to properly handle user status
    // Updated login function to properly handle user status
    // Simple fix for the handleLogin function with proper error messages
    const handleLogin = async () => {
        if (!validateForm()) return;

        setLoading(true);
        setErrorMessage('');

        try {
            // Sign in with Firebase Auth
            const userCredential = await loginWithEmail(email, password);

            // Check if this user is a deliveryman
            const deliveryman = await getDeliverymanByEmail(email);

            if (!deliveryman) {
                // Check if this is a pending application
                const applicationsRef = collection(db, 'deliverymen_applications');
                const q = query(applicationsRef, where('email', '==', email));
                const appSnapshot = await getDocs(q);

                if (!appSnapshot.empty) {
                    const application = appSnapshot.docs[0].data();

                    if (application.status === 'inactive') {
                        throw new Error('Votre candidature est toujours en cours d\'examen. Veuillez attendre l\'approbation.');
                    } else if (application.status === 'suspended') {
                        throw new Error('Votre candidature a été rejetée. Veuillez contacter l\'assistance pour plus d\'informations.');
                    }
                }

                throw new Error('Compte non trouvé. Veuillez vous inscrire d\'abord.');
            }

            // Check if the deliveryman account is active
            if (deliveryman.status !== 'active') {
                throw new Error('Votre compte est actuellement ' + deliveryman.status + '. Veuillez contacter l\'assistance pour obtenir de l\'aide.');
            }

            // User is authenticated and has an active deliveryman account
            signIn({
                id: userCredential.user.uid,
                email: userCredential.user.email,
                deliverymanId: deliveryman.id,
                name: `${deliveryman.firstName || ''} ${deliveryman.lastName || ''}`.trim(),
                firstName: deliveryman.firstName,
                lastName: deliveryman.lastName,
                avatarUrl: deliveryman.profileImageUrl,
                profileImageUrl: deliveryman.profileImageUrl,
                phone: deliveryman.phone,
                zone: deliveryman.zone,
                vehicle: deliveryman.vehicle,
                role: 'deliveryman'
            });

            // Navigate to the main app
            router.replace('/(tabs)');
        } catch (error) {
            console.error('Login error:', error);

            // Clear, user-friendly error messages
            let errorMsg = 'Échec de la connexion. Veuillez réessayer.';

            if (error.code === 'auth/user-not-found') {
                errorMsg = 'Compte non trouvé. Veuillez vérifier votre email ou créer un compte.';
            } else if (error.code === 'auth/wrong-password') {
                errorMsg = 'Mot de passe incorrect. Veuillez réessayer.';
            } else if (error.code === 'auth/invalid-email') {
                errorMsg = 'Format d\'email invalide. Veuillez entrer un email valide.';
            } else if (error.code === 'auth/too-many-requests') {
                errorMsg = 'Trop de tentatives de connexion échouées. Veuillez réessayer plus tard ou réinitialiser votre mot de passe.';
            } else if (error.code === 'auth/network-request-failed') {
                errorMsg = 'Problème de connexion internet. Veuillez vérifier votre connexion et réessayer.';
            } else if (error.message) {
                // Use the actual error message if it exists and isn't a technical Firebase message
                errorMsg = error.message;
            }

            setErrorMessage(errorMsg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView className="flex-1 bg-white">
            <StatusBar style="dark" />
            <View className="flex-1 p-6 justify-center">
                {/* Logo and Header */}
                <View className="items-center mb-10">
                    <Image
                        source={require('@/assets/logo.png')}
                        style={{ width: 120, height: 120 }}
                        resizeMode="contain"
                    />
                    <Text className="text-2xl font-bold text-gray-800 mt-4">Bon Retour</Text>
                    <Text className="text-gray-500 text-center mt-2">
                        Connectez-vous pour continuer en tant que livreur
                    </Text>
                </View>

                {/* Error Message */}
                {errorMessage ? (
                    <View className="bg-red-100 p-3 rounded-lg mb-4">
                        <Text className="text-red-500">{errorMessage}</Text>
                    </View>
                ) : null}

                {/* Email Field */}
                <View className="mb-4">
                    <Text className="text-gray-700 mb-2 font-medium">Email</Text>
                    <View className="flex-row items-center border border-gray-300 rounded-xl px-4 py-3">
                        <Feather name="mail" size={20} color="#9CA3AF" />
                        <TextInput
                            className="flex-1 ml-2 text-gray-800"
                            placeholder="votre@email.com"
                            placeholderTextColor="#9CA3AF"
                            keyboardType="email-address"
                            autoCapitalize="none"
                            value={email}
                            onChangeText={(text) => {
                                setEmail(text);
                                setErrorMessage('');
                            }}
                        />
                    </View>
                </View>

                {/* Password Field */}
                <View className="mb-6">
                    <Text className="text-gray-700 mb-2 font-medium">Mot de passe</Text>
                    <View className="flex-row items-center border border-gray-300 rounded-xl px-4 py-3">
                        <Feather name="lock" size={20} color="#9CA3AF" />
                        <TextInput
                            className="flex-1 ml-2 text-gray-800"
                            placeholder="Entrez votre mot de passe"
                            placeholderTextColor="#9CA3AF"
                            secureTextEntry={!showPassword}
                            value={password}
                            onChangeText={(text) => {
                                setPassword(text);
                                setErrorMessage('');
                            }}
                        />
                        <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                            <Feather
                                name={showPassword ? "eye-off" : "eye"}
                                size={20}
                                color="#9CA3AF"
                            />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Forgot Password */}
                <TouchableOpacity className="items-end mb-6">
                    <Text className="text-orange-500">Mot de passe oublié?</Text>
                </TouchableOpacity>

                {/* Login Button */}
                <TouchableOpacity
                    className={`bg-orange-500 py-3 rounded-xl items-center ${loading ? 'opacity-70' : ''}`}
                    onPress={handleLogin}
                    disabled={loading}
                >
                    {loading ? (
                        <ActivityIndicator color="white" />
                    ) : (
                        <Text className="text-white font-bold text-lg">Connexion</Text>
                    )}
                </TouchableOpacity>

                {/* Register Link */}
                <View className="flex-row justify-center mt-8">
                    <Text className="text-gray-600">Vous n'avez pas de compte? </Text>
                    <TouchableOpacity onPress={() => router.push('/(auth)/signup')}>
                        <Text className="text-orange-500 font-medium">S'inscrire</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </SafeAreaView>
    );
}