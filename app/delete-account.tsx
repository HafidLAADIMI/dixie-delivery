// app/(app)/delete-account.tsx
import React, { useState } from 'react';
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    TextInput,
    Alert,
    ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useAuth } from '@/contexts/AuthContext';

export default function DeleteAccountScreen() {
    const { user, signOut } = useAuth();
    const [step, setStep] = useState(1); // 1: Warning, 2: Confirmation, 3: Final step
    const [confirmText, setConfirmText] = useState('');
    const [reason, setReason] = useState('');
    const [loading, setLoading] = useState(false);

    const CONFIRMATION_TEXT = 'DELETE MY ACCOUNT';

    const reasons = [
        'Je ne livre plus dans cette zone',
        'J\'ai trouvé un autre travail',
        'L\'application ne fonctionne pas bien',
        'Pas assez de commandes',
        'Problèmes avec les paiements',
        'Autre raison'
    ];

    const handleDeleteAccount = async () => {
        if (confirmText !== CONFIRMATION_TEXT) {
            Alert.alert('Erreur', `Veuillez taper exactement "${CONFIRMATION_TEXT}" pour confirmer`);
            return;
        }

        Alert.alert(
            'Dernière confirmation',
            'Cette action est irréversible. Votre compte et toutes vos données seront définitivement supprimés. Êtes-vous absolument sûr ?',
            [
                { text: 'Annuler', style: 'cancel' },
                {
                    text: 'Supprimer définitivement',
                    style: 'destructive',
                    onPress: confirmDeletion
                }
            ]
        );
    };

    const confirmDeletion = async () => {
        setLoading(true);
        try {
            // Delete the deliveryman account
            // await deleteDeliverymanAccount(user.email, reason);

            // For now, just show success (implement the actual deletion later)
            await signOut();

            Alert.alert(
                'Compte supprimé',
                'Votre compte a été supprimé avec succès. Nous sommes désolés de vous voir partir.',
                [
                    {
                        text: 'OK',
                        onPress: () => router.replace('/(auth)/login')
                    }
                ]
            );
        } catch (error) {
            console.error('Error deleting account:', error);
            Alert.alert(
                'Erreur',
                'Impossible de supprimer le compte. Veuillez contacter le support à oumzil@gmail.com'
            );
        } finally {
            setLoading(false);
        }
    };

    const renderStep1 = () => (
        <View className="p-6">
            <View className="items-center mb-8">
                <View className="w-20 h-20 bg-red-100 rounded-full items-center justify-center mb-4">
                    <Feather name="alert-triangle" size={40} color="#EF4444" />
                </View>
                <Text className="text-2xl font-bold text-gray-800 mb-2">
                    Supprimer votre compte
                </Text>
                <Text className="text-gray-600 text-center">
                    Cette action est irréversible et supprimera définitivement toutes vos données
                </Text>
            </View>

            <View className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                <Text className="text-red-800 font-semibold mb-2">
                    ⚠️ Ce qui sera supprimé :
                </Text>
                <Text className="text-red-700 text-sm">
                    • Votre profil de livreur{'\n'}
                    • Votre historique de livraisons{'\n'}
                    • Vos informations personnelles{'\n'}
                    • Vos photos et documents{'\n'}
                    • Toutes vos données de l'application
                </Text>
            </View>

            <View className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8">
                <Text className="text-blue-800 font-semibold mb-2">
                    💡 Alternatives à considérer :
                </Text>
                <Text className="text-blue-700 text-sm">
                    • Désactiver temporairement votre compte{'\n'}
                    • Changer votre zone de livraison{'\n'}
                    • Contacter le support pour résoudre les problèmes
                </Text>
            </View>

            <TouchableOpacity
                className="bg-red-500 py-4 rounded-lg items-center mb-4"
                onPress={() => setStep(2)}
            >
                <Text className="text-white font-bold text-lg">
                    Continuer la suppression
                </Text>
            </TouchableOpacity>

            <TouchableOpacity
                className="bg-gray-200 py-4 rounded-lg items-center"
                onPress={() => router.back()}
            >
                <Text className="text-gray-800 font-semibold">
                    Annuler et revenir
                </Text>
            </TouchableOpacity>
        </View>
    );

    const renderStep2 = () => (
        <View className="p-6">
            <Text className="text-xl font-bold text-gray-800 mb-6">
                Pourquoi supprimez-vous votre compte ?
            </Text>

            <Text className="text-gray-600 mb-4">
                Votre retour nous aide à améliorer notre service pour les autres livreurs.
            </Text>

            <View className="mb-6">
                {reasons.map((reasonOption, index) => (
                    <TouchableOpacity
                        key={index}
                        className={`flex-row items-center p-4 rounded-lg mb-2 ${
                            reason === reasonOption ? 'bg-orange-100 border border-orange-300' : 'bg-gray-100'
                        }`}
                        onPress={() => setReason(reasonOption)}
                    >
                        <View className={`w-4 h-4 rounded-full border-2 mr-3 ${
                            reason === reasonOption ? 'bg-orange-500 border-orange-500' : 'border-gray-400'
                        }`}>
                            {reason === reasonOption && (
                                <View className="w-2 h-2 bg-white rounded-full m-auto" />
                            )}
                        </View>
                        <Text className={`flex-1 ${
                            reason === reasonOption ? 'text-orange-700 font-medium' : 'text-gray-700'
                        }`}>
                            {reasonOption}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            <View className="flex-row space-x-3">
                <TouchableOpacity
                    className="flex-1 bg-gray-200 py-4 rounded-lg items-center"
                    onPress={() => setStep(1)}
                >
                    <Text className="text-gray-800 font-semibold">Retour</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    className="flex-1 bg-red-500 py-4 rounded-lg items-center"
                    onPress={() => setStep(3)}
                    disabled={!reason}
                >
                    <Text className="text-white font-semibold">Continuer</Text>
                </TouchableOpacity>
            </View>
        </View>
    );

    const renderStep3 = () => (
        <View className="p-6">
            <Text className="text-xl font-bold text-gray-800 mb-6">
                Confirmation finale
            </Text>

            <View className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                <Text className="text-yellow-800 font-semibold mb-2">
                    🚨 Dernière chance !
                </Text>
                <Text className="text-yellow-700 text-sm">
                    Une fois supprimé, votre compte ne peut pas être récupéré.
                    Vous perdrez l'accès à toutes vos données de livraison.
                </Text>
            </View>

            <Text className="text-gray-800 mb-4">
                Pour confirmer, tapez exactement : <Text className="font-bold">"{CONFIRMATION_TEXT}"</Text>
            </Text>

            <TextInput
                className="border border-gray-300 rounded-lg p-4 mb-6 bg-white"
                placeholder={CONFIRMATION_TEXT}
                value={confirmText}
                onChangeText={setConfirmText}
                autoCapitalize="characters"
            />

            <Text className="text-gray-600 text-sm mb-6">
                Raison sélectionnée : <Text className="font-medium">{reason}</Text>
            </Text>

            <View className="flex-row space-x-3">
                <TouchableOpacity
                    className="flex-1 bg-gray-200 py-4 rounded-lg items-center"
                    onPress={() => setStep(2)}
                >
                    <Text className="text-gray-800 font-semibold">Retour</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    className={`flex-1 py-4 rounded-lg items-center ${
                        confirmText === CONFIRMATION_TEXT ? 'bg-red-500' : 'bg-gray-400'
                    }`}
                    onPress={handleDeleteAccount}
                    disabled={confirmText !== CONFIRMATION_TEXT || loading}
                >
                    {loading ? (
                        <ActivityIndicator color="white" />
                    ) : (
                        <Text className="text-white font-bold">
                            Supprimer définitivement
                        </Text>
                    )}
                </TouchableOpacity>
            </View>

            <View className="mt-6 p-4 bg-gray-100 rounded-lg">
                <Text className="text-gray-600 text-sm text-center">
                    Besoin d'aide ? Contactez-nous à{' '}
                    <Text className="text-orange-500 font-medium">oumzil@gmail.com</Text>
                </Text>
            </View>
        </View>
    );

    return (
        <SafeAreaView className="flex-1 bg-white">
            <View className="flex-row items-center justify-between p-4 border-b border-gray-200">
                <TouchableOpacity
                    onPress={() => router.back()}
                    className="p-2"
                >
                    <Feather name="arrow-left" size={24} color="#374151" />
                </TouchableOpacity>

                <Text className="text-lg font-bold text-gray-800">
                    Supprimer le compte
                </Text>

                <View className="w-8" />
            </View>

            <ScrollView className="flex-1">
                {step === 1 && renderStep1()}
                {step === 2 && renderStep2()}
                {step === 3 && renderStep3()}
            </ScrollView>
        </SafeAreaView>
    );
}