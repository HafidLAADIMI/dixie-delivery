// components/PrivacyDisclosure.tsx
import React, { useState } from 'react';
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    Modal,
    SafeAreaView,
    Linking,
} from 'react-native';
import { Feather } from '@expo/vector-icons';

interface PrivacyDisclosureProps {
    visible: boolean;
    onAccept: () => void;
    onDecline: () => void;
}

export const PrivacyDisclosure: React.FC<PrivacyDisclosureProps> = ({
                                                                        visible,
                                                                        onAccept,
                                                                        onDecline,
                                                                    }) => {
    const [showFullPolicy, setShowFullPolicy] = useState(false);

    const openFullPolicy = () => {
        Linking.openURL('https://dixie.ma');
    };

    if (showFullPolicy) {
        return (
            <Modal visible={visible} animationType="slide" presentationStyle="fullScreen">
                <SafeAreaView className="flex-1 bg-gray-900">
                    <View className="flex-row items-center justify-between p-6 border-b border-gray-800">
                        <TouchableOpacity
                            onPress={() => setShowFullPolicy(false)}
                            className="p-2 -ml-2"
                        >
                            <Feather name="arrow-left" size={24} color="white" />
                        </TouchableOpacity>
                        <Text className="text-white text-lg font-bold">Politique de Confidentialité</Text>
                        <View className="w-8" />
                    </View>

                    <ScrollView className="flex-1 p-6" showsVerticalScrollIndicator={false}>
                        <Text className="text-white text-base leading-6 mb-4">
                            <Text className="font-bold">Dernière mise à jour :</Text> 24 mai 2025
                        </Text>

                        <Text className="text-gray-300 text-sm leading-6 mb-6">
                            Cette Politique de Confidentialité décrit nos politiques et procédures concernant la collecte,
                            l'utilisation et la divulgation de vos informations lorsque vous utilisez le Service et vous
                            informe de vos droits à la confidentialité et de la façon dont la loi vous protège.
                        </Text>

                        <Text className="text-orange-500 text-lg font-bold mb-4">
                            Données Collectées
                        </Text>

                        <View className="mb-6">
                            <Text className="text-white text-base font-semibold mb-2">
                                📧 Informations Personnelles
                            </Text>
                            <Text className="text-gray-300 text-sm leading-5 mb-4">
                                • Adresse e-mail{'\n'}
                                • Numéro de téléphone{'\n'}
                                • Adresse, État, Province, Code postal, Ville{'\n'}
                                • Données d'utilisation
                            </Text>
                        </View>

                        <View className="mb-6">
                            <Text className="text-white text-base font-semibold mb-2">
                                📍 Informations de Localisation
                            </Text>
                            <Text className="text-gray-300 text-sm leading-5 mb-4">
                                Avec votre permission préalable, nous pouvons collecter des informations
                                concernant votre localisation pour fournir les fonctionnalités de notre application.
                            </Text>
                        </View>

                        <View className="mb-6">
                            <Text className="text-white text-base font-semibold mb-2">
                                📊 Données d'Utilisation
                            </Text>
                            <Text className="text-gray-300 text-sm leading-5 mb-4">
                                Collectées automatiquement, incluant :{'\n'}
                                • Adresse IP de votre appareil{'\n'}
                                • Type et version du navigateur{'\n'}
                                • Pages visitées et temps passé{'\n'}
                                • Identifiants uniques de l'appareil{'\n'}
                                • Données de diagnostic
                            </Text>
                        </View>

                        <Text className="text-orange-500 text-lg font-bold mb-4">
                            Utilisation de Vos Données
                        </Text>

                        <Text className="text-gray-300 text-sm leading-6 mb-6">
                            Nous utilisons vos données personnelles pour :{'\n'}
                            • Fournir et maintenir notre Service{'\n'}
                            • Gérer votre compte utilisateur{'\n'}
                            • Exécuter des contrats d'achat{'\n'}
                            • Vous contacter avec des mises à jour{'\n'}
                            • Vous fournir des offres spéciales{'\n'}
                            • Gérer vos demandes{'\n'}
                            • Analyser l'utilisation et améliorer le Service
                        </Text>

                        <Text className="text-orange-500 text-lg font-bold mb-4">
                            Partage de Vos Données
                        </Text>

                        <Text className="text-gray-300 text-sm leading-6 mb-6">
                            Nous pouvons partager vos informations :{'\n'}
                            • Avec des prestataires de services{'\n'}
                            • Lors de transferts d'entreprise{'\n'}
                            • Avec des affiliés et partenaires{'\n'}
                            • Avec votre consentement{'\n'}
                            • Pour des exigences légales
                        </Text>

                        <Text className="text-orange-500 text-lg font-bold mb-4">
                            Vos Droits
                        </Text>

                        <Text className="text-gray-300 text-sm leading-6 mb-6">
                            Vous avez le droit de :{'\n'}
                            • Accéder à vos données personnelles{'\n'}
                            • Corriger ou mettre à jour vos informations{'\n'}
                            • Supprimer vos données{'\n'}
                            • Retirer votre consentement{'\n'}
                            • Désactiver l'accès à la localisation
                        </Text>

                        <View className="bg-gray-800 p-4 rounded-lg mb-6">
                            <Text className="text-white font-semibold mb-2">
                                📞 Contact
                            </Text>
                            <Text className="text-gray-300 text-sm">
                                Email: oumzil@gmail.com{'\n'}
                                Site web: https://dixie.ma
                            </Text>
                        </View>
                    </ScrollView>

                    <View className="flex-row space-x-3 p-6 border-t border-gray-800">
                        <TouchableOpacity
                            onPress={onDecline}
                            className="flex-1 bg-gray-700 py-4 rounded-lg"
                        >
                            <Text className="text-white text-center font-semibold">
                                Refuser
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            onPress={onAccept}
                            className="flex-1 bg-orange-500 py-4 rounded-lg"
                        >
                            <Text className="text-white text-center font-semibold">
                                Accepter et Continuer
                            </Text>
                        </TouchableOpacity>
                    </View>
                </SafeAreaView>
            </Modal>
        );
    }

    return (
        <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
            <SafeAreaView className="flex-1 bg-gray-900">
                <View className="flex-1 p-6">
                    <View className="flex-row items-center mb-6">
                        <Feather name="shield" size={24} color="#F97316" />
                        <Text className="text-white text-xl font-bold ml-3">
                            Confidentialité et Données
                        </Text>
                    </View>

                    <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
                        <Text className="text-white text-lg font-semibold mb-4">
                            Bienvenue chez Dixie
                        </Text>

                        <Text className="text-gray-300 text-base leading-6 mb-6">
                            Nous respectons votre vie privée et sommes transparents sur la façon dont nous utilisons vos données pour vous offrir la meilleure expérience de livraison de nourriture.
                        </Text>

                        <View className="mb-6">
                            <Text className="text-orange-500 text-base font-semibold mb-2">
                                📍 Localisation
                            </Text>
                            <Text className="text-gray-300 text-sm leading-5 mb-4">
                                • Trouvez les restaurants les plus proches de vous{'\n'}
                                • Calculez les frais de livraison précis{'\n'}
                                • Optimisez les temps de livraison{'\n'}
                                • Suivez vos commandes en temps réel
                            </Text>
                        </View>

                        <View className="mb-6">
                            <Text className="text-orange-500 text-base font-semibold mb-2">
                                👤 Informations Personnelles
                            </Text>
                            <Text className="text-gray-300 text-sm leading-5 mb-4">
                                • Email et nom pour votre compte{'\n'}
                                • Adresse de livraison{'\n'}
                                • Numéro de téléphone pour vous contacter{'\n'}
                                • Historique des commandes pour personnaliser votre expérience
                            </Text>
                        </View>

                        <View className="mb-6">
                            <Text className="text-orange-500 text-base font-semibold mb-2">
                                📊 Données d'Utilisation
                            </Text>
                            <Text className="text-gray-300 text-sm leading-5 mb-4">
                                • Améliorer les performances de l'application{'\n'}
                                • Personnaliser vos recommandations{'\n'}
                                • Résoudre les problèmes techniques{'\n'}
                                • Analyser les tendances pour de meilleures offres
                            </Text>
                        </View>

                        <View className="bg-gray-800 p-4 rounded-lg mb-6">
                            <Text className="text-white font-semibold mb-2">
                                🔒 Vos Droits et Contrôles
                            </Text>
                            <Text className="text-gray-300 text-sm leading-5 mb-3">
                                • Vous pouvez modifier vos préférences à tout moment{'\n'}
                                • Désactiver la localisation dans les paramètres{'\n'}
                                • Supprimer votre compte et vos données{'\n'}
                                • Contacter notre équipe pour toute question
                            </Text>

                            <TouchableOpacity
                                onPress={() => setShowFullPolicy(true)}
                                className="flex-row items-center"
                            >
                                <Text className="text-orange-500 text-sm font-medium">
                                    Lire la politique complète
                                </Text>
                                <Feather name="external-link" size={16} color="#F97316" className="ml-2" />
                            </TouchableOpacity>
                        </View>

                        <View className="bg-blue-900/30 p-4 rounded-lg mb-6">
                            <View className="flex-row items-center mb-2">
                                <Feather name="info" size={16} color="#3B82F6" />
                                <Text className="text-blue-400 font-semibold ml-2">
                                    Conformité Apple
                                </Text>
                            </View>
                            <Text className="text-gray-300 text-sm leading-5">
                                Cette demande respecte les exigences d'Apple pour la transparence du suivi des applications (ATT).
                                Votre choix sera respecté et peut être modifié dans les paramètres iOS.
                            </Text>
                        </View>

                        <View className="bg-gray-800 p-4 rounded-lg mb-6">
                            <Text className="text-white font-semibold mb-2">
                                📞 Nous Contacter
                            </Text>
                            <Text className="text-gray-300 text-sm">
                                Email: oumzil@gmail.com{'\n'}
                                Site: https://dixie.ma{'\n'}
                                {'\n'}
                                Pour toute question sur vos données ou cette politique de confidentialité.
                            </Text>
                        </View>
                    </ScrollView>

                    <View className="flex-row space-x-3 mt-4">
                        <TouchableOpacity
                            onPress={onDecline}
                            className="flex-1 bg-gray-700 py-4 rounded-lg"
                        >
                            <Text className="text-white text-center font-semibold">
                                Refuser le Suivi
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            onPress={onAccept}
                            className="flex-1 bg-orange-500 py-4 rounded-lg"
                        >
                            <Text className="text-white text-center font-semibold">
                                Accepter et Continuer
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </SafeAreaView>
        </Modal>
    );
};