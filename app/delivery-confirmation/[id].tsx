// app/(app)/delivery-confirmation/[id].jsx
import React, { useState, useRef, useEffect } from 'react';
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    TextInput,
    StyleSheet,
    Alert,
    ActivityIndicator,
    Image,
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import Signature from 'react-native-signature-canvas';
import { useAuth } from '@/contexts/AuthContext';

// Import des services
import { getOrderOnce, updateOrderStatus } from '@/services/orderService';
import { uploadImage } from '@/services/deliverymanService';

// Import ou définition des couleurs de thème
const COLORS = {
    primary: { DEFAULT: '#F97316', dark: '#EA580C' }, // Orange
    gray: { light: '#9CA3AF', dark: '#4B5563' }
};

export default function DeliveryConfirmationScreen() {
    const { id } = useLocalSearchParams();
    const { user } = useAuth();
    const router = useRouter();

    // États
    const [delivery, setDelivery] = useState(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [signature, setSignature] = useState(null);
    const [proofOfDelivery, setProofOfDelivery] = useState(null);
    const [receivedBy, setReceivedBy] = useState('');
    const [notes, setNotes] = useState('');
    const [amountCollected, setAmountCollected] = useState('');
    const [showSignaturePad, setShowSignaturePad] = useState(false);

    // Référence pour le composant de signature
    const signatureRef = useRef();

    // Récupérer les détails de la livraison
    useEffect(() => {
        const fetchDelivery = async () => {
            try {
                if (!id) {
                    throw new Error('Aucun ID de commande fourni');
                }

                const idParts = String(id).split('_');
                if (idParts.length !== 2) {
                    throw new Error('Format d\'ID de commande invalide');
                }

                const [userId, orderId] = idParts;

                // Obtenir la commande
                const data = await getOrderOnce(userId, orderId);
                if (!data) {
                    throw new Error('Commande non trouvée');
                }

                setDelivery(data);

                // Pré-remplir le montant collecté avec le total de la commande
                if (data.total && typeof data.total === 'number') {
                    setAmountCollected(data.total.toString());
                }
            } catch (error) {
                console.error('Erreur lors du chargement de la livraison:', error);
                Alert.alert('Erreur', 'Échec du chargement des détails de livraison');
                router.back();
            } finally {
                setLoading(false);
            }
        };

        fetchDelivery();
    }, [id]);

    // Prendre une photo avec la caméra
    const takePhoto = async () => {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();

        if (status !== 'granted') {
            Alert.alert(
                'Permission nécessaire',
                'Veuillez autoriser l\'accès à la caméra pour prendre des photos de livraison'
            );
            return;
        }

        try {
            const result = await ImagePicker.launchCameraAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                quality: 0.8,
                allowsEditing: true,
                aspect: [4, 3],
            });

            if (!result.canceled && result.assets && result.assets.length > 0) {
                setProofOfDelivery(result.assets[0].uri);
            }
        } catch (error) {
            console.error('Erreur lors de la prise de photo:', error);
            Alert.alert('Erreur', 'Échec de la capture de photo');
        }
    };

    // Gérer la signature
    const handleSignature = (signature) => {
        setSignature(signature);
        setShowSignaturePad(false);
    };

    // Effacer la signature
    const clearSignature = () => {
        if (signatureRef.current) {
            signatureRef.current.clearSignature();
        }
    };

    // Valider le formulaire avant soumission
    const validateForm = () => {
        if (!receivedBy.trim()) {
            Alert.alert('Erreur', 'Veuillez saisir qui a reçu le colis');
            return false;
        }

        if (delivery &&
            (delivery.paymentMethod === 'cash_on_delivery' || delivery.paymentMethod === 'Cash on Delivery') &&
            !amountCollected) {
            Alert.alert('Erreur', 'Veuillez saisir le montant collecté');
            return false;
        }

        if (!signature && !proofOfDelivery) {
            Alert.alert('Erreur', 'Veuillez fournir une signature ou une photo de preuve de livraison');
            return false;
        }

        return true;
    };

    // Soumettre la confirmation de livraison
    const handleSubmit = async () => {
        if (!validateForm()) return;

        setSubmitting(true);

        try {
            // Télécharger la signature et la preuve de livraison si disponibles
            let signatureUrl = null;
            let proofOfDeliveryUrl = null;

            if (signature) {
                signatureUrl = await uploadImage(
                    signature,
                    `deliveries/${delivery.userId}/${delivery.id}/signature`
                );
            }

            if (proofOfDelivery) {
                proofOfDeliveryUrl = await uploadImage(
                    proofOfDelivery,
                    `deliveries/${delivery.userId}/${delivery.id}/proof`
                );
            }

            // Préparer les données de confirmation de livraison
            const deliveryData = {
                receivedBy,
                notes: notes || '',
                amountCollected: amountCollected ? parseFloat(amountCollected) : 0,
                signatureUrl,
                proofOfDeliveryUrl,
                deliveredAt: new Date(),
                deliveredBy: user?.id || '',
                deliverymanName: user?.name || '',
            };

            // Mettre à jour le statut de la commande dans Firestore
            await updateOrderStatus(
                delivery.userId,
                delivery.id,
                'delivered',
                deliveryData
            );

            // Naviguer vers l'écran de succès
            router.replace('/delivery-success');
        } catch (error) {
            console.error('Erreur lors de la soumission de la confirmation de livraison:', error);
            Alert.alert(
                'Erreur',
                'Échec de la soumission de la confirmation de livraison. Veuillez réessayer.'
            );
        } finally {
            setSubmitting(false);
        }
    };

    // Formatage de la devise
    const formatCurrency = (amount) => {
        if (typeof amount !== 'number') return '0,00 MAD';
        return `${amount.toFixed(2).replace('.', ',')} MAD`;
    };

    // État de chargement
    if (loading) {
        return (
            <View className="flex-1 justify-center items-center bg-white">
                <ActivityIndicator size="large" color={COLORS.primary.DEFAULT} />
                <Text className="mt-4 text-gray-500">Chargement des détails...</Text>
            </View>
        );
    }

    // Si la commande n'est pas trouvée
    if (!delivery) {
        return (
            <View className="flex-1 justify-center items-center bg-white">
                <Feather name="alert-circle" size={50} color="#EF4444" />
                <Text className="mt-4 text-red-500 font-medium text-lg">Commande non trouvée</Text>
                <TouchableOpacity
                    onPress={() => router.back()}
                    className="mt-6 bg-orange-500 px-6 py-3 rounded-lg"
                >
                    <Text className="text-white font-semibold">Retour</Text>
                </TouchableOpacity>
            </View>
        );
    }

    // Affichage du pad de signature
    if (showSignaturePad) {
        return (
            <SafeAreaView className="flex-1 bg-white">
                <Stack.Screen
                    options={{
                        headerTitle: 'Signature du Client',
                        headerTintColor: '#fff',
                        headerStyle: { backgroundColor: COLORS.primary.DEFAULT },
                        headerLeft: () => (
                            <TouchableOpacity onPress={() => setShowSignaturePad(false)}>
                                <Feather name="x" size={24} color="#fff" />
                            </TouchableOpacity>
                        ),
                    }}
                />

                <View className="h-12 bg-white px-4 py-2 flex-row justify-between items-center border-b border-gray-200">
                    <TouchableOpacity onPress={clearSignature}>
                        <Text className="text-orange-500">Effacer</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        onPress={() => {
                            if (signatureRef.current) {
                                signatureRef.current.readSignature();
                            }
                        }}
                    >
                        <Text className="text-orange-500 font-semibold">Enregistrer</Text>
                    </TouchableOpacity>
                </View>

                <View className="flex-1 bg-gray-50">
                    <Signature
                        ref={signatureRef}
                        onOK={handleSignature}
                        descriptionText="Signez ci-dessus"
                        clearText="Effacer"
                        confirmText="Enregistrer"
                        imageType="image/jpeg"
                        backgroundColor="#F9FAFB"
                        penColor="#000000"
                        style={{ flex: 1 }}
                    />
                </View>
            </SafeAreaView>
        );
    }

    // Écran principal de confirmation
    return (
        <SafeAreaView edges={['bottom']} className="flex-1 bg-gray-50">
            <Stack.Screen
                options={{
                    headerTitle: 'Confirmation de Livraison',
                    headerTintColor: '#fff',
                    headerStyle: { backgroundColor: COLORS.primary.DEFAULT },
                }}
            />

            <ScrollView className="flex-1 p-4">
                {/* Résumé des détails de la commande */}
                <View className="bg-white rounded-xl p-4 mb-4 shadow-sm">
                    <Text className="text-lg font-bold text-gray-800 mb-2">
                        Commande #{delivery.id.substring(0, 8)}
                    </Text>
                    <Text className="text-gray-800 font-medium">{delivery.customerName || 'Client'}</Text>
                    <Text className="text-gray-500 text-sm mb-2">{delivery.address || 'Aucune adresse'}</Text>

                    {(delivery.paymentMethod === 'cash_on_delivery' ||
                        delivery.paymentMethod === 'Cash on Delivery' ||
                        delivery.total) && (
                        <View className="mt-2 p-3 bg-blue-50 rounded-lg">
                            <Text className="text-blue-800 font-medium">
                                Paiement : {
                                delivery.paymentMethod === 'cash_on_delivery' ||
                                delivery.paymentMethod === 'Cash on Delivery'
                                    ? 'Paiement à la livraison'
                                    : delivery.paymentMethod === 'card' || delivery.paymentMethod === 'online_payment'
                                        ? 'Paiement en ligne'
                                        : delivery.paymentMethod || 'Paiement à la livraison'
                            }
                            </Text>
                            <Text className="text-blue-600">
                                Montant : {
                                typeof delivery.total === 'number'
                                    ? formatCurrency(delivery.total)
                                    : '0,00 MD'
                            }
                            </Text>
                        </View>
                    )}
                </View>

                {/* Informations du destinataire */}
                <View className="bg-white rounded-xl p-4 mb-4 shadow-sm">
                    <Text className="text-lg font-bold text-gray-800 mb-3">Informations du Destinataire</Text>

                    <View className="mb-4">
                        <Text className="text-gray-700 mb-1">Reçu Par *</Text>
                        <TextInput
                            className="border border-gray-300 rounded-xl px-4 py-2.5 text-gray-800"
                            placeholder="Nom de la personne qui a reçu"
                            value={receivedBy}
                            onChangeText={setReceivedBy}
                        />
                    </View>

                    {(delivery.paymentMethod === 'cash_on_delivery' ||
                        delivery.paymentMethod === 'Cash on Delivery') && (
                        <View className="mb-4">
                            <Text className="text-gray-700 mb-1">Montant Collecté *</Text>
                            <View className="flex-row items-center">
                                <TextInput
                                    className="flex-1 border border-gray-300 rounded-xl px-4 py-2.5 text-gray-800"
                                    placeholder="Montant collecté"
                                    keyboardType="numeric"
                                    value={amountCollected}
                                    onChangeText={setAmountCollected}
                                />
                                <Text className="ml-2 text-gray-700">MAD</Text>
                            </View>
                        </View>
                    )}

                    <View>
                        <Text className="text-gray-700 mb-1">Notes de Livraison (Optionnel)</Text>
                        <TextInput
                            className="border border-gray-300 rounded-xl px-4 py-2.5 text-gray-800"
                            placeholder="Notes supplémentaires"
                            multiline
                            numberOfLines={3}
                            textAlignVertical="top"
                            value={notes}
                            onChangeText={setNotes}
                            style={{ minHeight: 80 }}
                        />
                    </View>
                </View>

                {/* Preuve de livraison */}
                <View className="bg-white rounded-xl p-4 mb-4 shadow-sm">
                    <Text className="text-lg font-bold text-gray-800 mb-3">Preuve de Livraison *</Text>

                    <View className="flex-row mb-4">
                        <TouchableOpacity
                            className="flex-1 py-4 mr-2 border border-gray-300 rounded-xl items-center justify-center"
                            onPress={() => setShowSignaturePad(true)}
                        >
                            <Feather name="edit-3" size={22} color={COLORS.gray.dark} />
                            <Text className="text-gray-800 mt-2">Signature</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            className="flex-1 py-4 ml-2 border border-gray-300 rounded-xl items-center justify-center"
                            onPress={takePhoto}
                        >
                            <Feather name="camera" size={22} color={COLORS.gray.dark} />
                            <Text className="text-gray-800 mt-2">Photo</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Aperçu de la signature si disponible */}
                    {signature && (
                        <View className="mb-4">
                            <View className="flex-row justify-between items-center mb-2">
                                <Text className="text-gray-700">Aperçu de la Signature:</Text>
                                <TouchableOpacity onPress={() => setSignature(null)}>
                                    <Feather name="trash-2" size={18} color="#EF4444" />
                                </TouchableOpacity>
                            </View>
                            <View className="border border-gray-300 rounded-xl overflow-hidden bg-white">
                                <Image
                                    source={{ uri: signature }}
                                    style={{ width: '100%', height: 120 }}
                                    resizeMode="contain"
                                />
                            </View>
                        </View>
                    )}

                    {/* Aperçu de la photo si disponible */}
                    {proofOfDelivery && (
                        <View className="mb-4">
                            <View className="flex-row justify-between items-center mb-2">
                                <Text className="text-gray-700">Aperçu de la Photo:</Text>
                                <TouchableOpacity onPress={() => setProofOfDelivery(null)}>
                                    <Feather name="trash-2" size={18} color="#EF4444" />
                                </TouchableOpacity>
                            </View>
                            <View className="border border-gray-300 rounded-xl overflow-hidden">
                                <Image
                                    source={{ uri: proofOfDelivery }}
                                    style={{ width: '100%', height: 200 }}
                                    resizeMode="cover"
                                />
                            </View>
                        </View>
                    )}
                </View>

                {/* Bouton de soumission */}
                <TouchableOpacity
                    className={`${
                        submitting ? 'bg-orange-400' : 'bg-orange-500'
                    } rounded-xl py-4 items-center mb-8 shadow-sm`}
                    onPress={handleSubmit}
                    disabled={submitting}
                >
                    {submitting ? (
                        <View className="flex-row items-center">
                            <ActivityIndicator color="#fff" size="small" />
                            <Text className="text-white font-bold text-lg ml-2">
                                Traitement...
                            </Text>
                        </View>
                    ) : (
                        <Text className="text-white font-bold text-lg">
                            Finaliser la Livraison
                        </Text>
                    )}
                </TouchableOpacity>
            </ScrollView>
        </SafeAreaView>
    );
}