// app/(auth)/login.tsx
import React, { useState, useEffect } from 'react';
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
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '@/contexts/AuthContext';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { getFirestore } from 'firebase/firestore';

// Add this function to check application status
const checkApplicationStatus = async (email) => {
    try {
        if (!email) {
            console.warn('checkApplicationStatus called without an email');
            return null;
        }

        const db = getFirestore();
        const applicationsRef = collection(db, 'deliverymen_applications');
        const q = query(applicationsRef, where('email', '==', email));
        const appSnapshot = await getDocs(q);

        if (appSnapshot.empty) {
            console.log(`No application found with email: ${email}`);
            return null;
        }

        const application = appSnapshot.docs[0];
        return {
            id: application.id,
            ...application.data()
        };
    } catch (error) {
        console.error('Error checking application status:', error);
        // Return null instead of throwing an error to prevent crashes
        return null;
    }
};

export default function LoginScreen() {
    const { signIn } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');

    // Check for stored error reasons on component mount
    useEffect(() => {
        const checkForErrorReason = async () => {
            try {
                const errorReason = await AsyncStorage.getItem('authErrorReason');
                if (errorReason) {
                    setErrorMessage(errorReason);
                    // Clear the error once displayed
                    await AsyncStorage.removeItem('authErrorReason');
                }
            } catch (error) {
                console.error('Error checking for stored error reasons:', error);
            }
        };

        checkForErrorReason();
    }, []);

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

    const handleLogin = async () => {
        if (!validateForm()) return;

        setLoading(true);
        setErrorMessage('');

        try {
            // Sign in with Firebase Auth
            let user;
            try {
                user = await loginWithEmail(email, password);

                // Check if user exists
                if (!user) {
                    throw new Error('Erreur de connexion: Données utilisateur non disponibles');
                }
            } catch (authError) {
                console.error('Firebase auth error:', authError);
                throw authError; // Rethrow to be caught by the outer catch block
            }

            // Check if this user is a deliveryman
            const deliveryman = await getDeliverymanByEmail(email);

            if (!deliveryman) {
                // Check if this is a pending application
                const applicationStatus = await checkApplicationStatus(email);

                if (applicationStatus) {
                    if (applicationStatus.status === 'inactive') {
                        throw new Error('Votre candidature est toujours en cours d\'examen. Veuillez attendre l\'approbation.');
                    } else if (applicationStatus.status === 'suspended') {
                        throw new Error('Votre candidature a été rejetée. Veuillez contacter l\'assistance pour plus d\'informations.');
                    }
                }

                throw new Error('Compte non trouvé. Veuillez vous inscrire d\'abord.');
            }

            // Check if the deliveryman account is active
            if (deliveryman.status !== 'active') {
                throw new Error('Votre compte est actuellement ' + (deliveryman.status || 'inactif') + '. Veuillez contacter l\'assistance pour obtenir de l\'aide.');
            }

            // User is authenticated and has an active deliveryman account
            // Make sure all required fields exist and prepare user data object
            const userData = {
                id: user.uid,
                email: user.email || email, // Fallback to entered email
                deliverymanId: deliveryman.id,
                name: `${deliveryman.firstName || ''} ${deliveryman.lastName || ''}`.trim(),
                firstName: deliveryman.firstName || '',
                lastName: deliveryman.lastName || '',
                avatarUrl: deliveryman.profileImageUrl || null,
                profileImageUrl: deliveryman.profileImageUrl || null,
                phone: deliveryman.phone || '',
                zone: deliveryman.zone || '',
                vehicle: deliveryman.vehicle || '',
                role: 'deliveryman',
                status: deliveryman.status || 'active'
            };

            // Log user data before signing in
            console.log('User data to be saved:', JSON.stringify(userData));

            // Sign in with the Auth context
            await signIn(userData);

            // Navigate to the main app
            router.replace('/(tabs)');
        } catch (error) {
            console.error('Login error:', error);

            // Clear, user-friendly error messages
            let errorMsg = 'Échec de la connexion. Veuillez réessayer.';

            if (error?.code) {
                // Handle specific Firebase Auth error codes
                switch (error.code) {
                    case 'auth/user-not-found':
                        errorMsg = 'Compte non trouvé. Veuillez vérifier votre email ou créer un compte.';
                        break;
                    case 'auth/wrong-password':
                        errorMsg = 'Mot de passe incorrect. Veuillez réessayer.';
                        break;
                    case 'auth/invalid-email':
                        errorMsg = 'Format d\'email invalide. Veuillez entrer un email valide.';
                        break;
                    case 'auth/too-many-requests':
                        errorMsg = 'Trop de tentatives de connexion échouées. Veuillez réessayer plus tard ou réinitialiser votre mot de passe.';
                        break;
                    case 'auth/network-request-failed':
                        errorMsg = 'Problème de connexion internet. Veuillez vérifier votre connexion et réessayer.';
                        break;
                    case 'auth/invalid-credential':
                        errorMsg = 'Email ou mot de passe incorrect. Veuillez réessayer.';
                        break;
                    case 'auth/account-exists-with-different-credential':
                        errorMsg = 'Un compte existe déjà avec une autre méthode de connexion.';
                        break;
                    case 'auth/operation-not-allowed':
                        errorMsg = 'Cette opération n\'est pas autorisée. Veuillez contacter l\'assistance.';
                        break;
                    case 'auth/requires-recent-login':
                        errorMsg = 'Cette action nécessite une connexion récente. Veuillez vous reconnecter.';
                        break;
                    default:
                        // If it's another Firebase auth error but not one we've explicitly handled
                        errorMsg = 'Erreur d\'authentification. Veuillez réessayer.';
                }
            } else if (error instanceof TypeError) {
                // Handle TypeError specifically (like the uid undefined issue)
                errorMsg = 'Erreur technique: Données utilisateur inaccessibles. Veuillez réessayer ou contacter l\'assistance.';
            } else if (error?.message) {
                // Use custom error messages we've thrown ourselves
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
                <TouchableOpacity
                    className="items-end mb-6"
                    onPress={() => router.push('/(auth)/forgot-password')}
                >
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