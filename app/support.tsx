// app/(app)/support.tsx
import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Linking,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Feather } from "@expo/vector-icons";

export default function SupportScreen() {
  const [selectedFAQ, setSelectedFAQ] = useState(null);
  const [contactForm, setContactForm] = useState({
    subject: "",
    message: "",
    email: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const contactMethods = [
    {
      id: "email",
      title: "Email",
      subtitle: "oumzil@gmail.com",
      icon: "mail",
      description: "Réponse sous 24h",
      action: () =>
        Linking.openURL(
          "mailto:oumzil@gmail.com?subject=Support Afood Delivery"
        ),
    },
    {
      id: "website",
      title: "Site Web",
      subtitle: "Afood.ma",
      icon: "globe",
      description: "Centre d'aide en ligne",
      action: () => Linking.openURL("https://Afood.ma/support"),
    },
    {
      id: "whatsapp",
      title: "WhatsApp",
      subtitle: "Chat en direct",
      icon: "message-circle",
      description: "Support instantané",
      action: () =>
        Linking.openURL(
          "https://wa.me/212600000000?text=Bonjour, j'ai besoin d'aide avec l'app Afood Delivery"
        ),
    },
  ];

  const faqData = [
    {
      id: 1,
      question: "Comment commencer à livrer avec Afood ?",
      answer:
        "Pour commencer à livrer, vous devez d'abord créer un compte dans l'application, puis soumettre vos documents (pièce d'identité, véhicule). Notre équipe examinera votre candidature sous 24-48h. Une fois approuvé, vous pourrez commencer à recevoir des commandes.",
    },
    {
      id: 2,
      question: "Comment sont calculés mes gains ?",
      answer:
        'Vos gains sont calculés en fonction du nombre de livraisons effectuées, de la distance parcourue, et des pourboires reçus. Vous pouvez consulter le détail de vos gains dans la section "Historique" de l\'application.',
    },
    {
      id: 3,
      question: "Quand suis-je payé ?",
      answer:
        "Les paiements sont effectués chaque semaine, le vendredi, pour toutes les livraisons de la semaine précédente. Les fonds sont virés directement sur votre compte bancaire enregistré.",
    },
    {
      id: 4,
      question: "Que faire si j'ai un problème avec une commande ?",
      answer:
        "En cas de problème avec une commande, contactez immédiatement le support via l'application ou par téléphone. Nous vous aiderons à résoudre le problème et à contacter le client si nécessaire.",
    },
    {
      id: 5,
      question: "Comment changer ma zone de livraison ?",
      answer:
        "Vous pouvez modifier votre zone de livraison dans les paramètres de votre profil. Notez que certaines zones peuvent nécessiter une nouvelle validation de notre équipe.",
    },
    {
      id: 6,
      question: "L'application ne fonctionne pas, que faire ?",
      answer:
        "Essayez d'abord de redémarrer l'application. Si le problème persiste, vérifiez votre connexion internet et assurez-vous d'avoir la dernière version de l'app. Contactez le support si le problème continue.",
    },
  ];

  const issueCategories = [
    { id: "technical", name: "Problème technique", icon: "smartphone" },
    { id: "payment", name: "Problème de paiement", icon: "credit-card" },
    { id: "order", name: "Problème de commande", icon: "package" },
    { id: "account", name: "Problème de compte", icon: "user" },
    { id: "other", name: "Autre", icon: "help-circle" },
  ];

  const handleFAQToggle = (faqId) => {
    setSelectedFAQ(selectedFAQ === faqId ? null : faqId);
  };

  const handleSubmitContactForm = async () => {
    if (!contactForm.subject.trim() || !contactForm.message.trim()) {
      Alert.alert("Erreur", "Veuillez remplir tous les champs obligatoires");
      return;
    }

    setIsSubmitting(true);

    try {
      // In a real app, you would send this to your support system
      const emailBody = `
Sujet: ${contactForm.subject}

Message:
${contactForm.message}

Email de contact: ${contactForm.email || "Non fourni"}

---
Envoyé depuis l'app Afood Delivery
            `.trim();

      const mailtoUrl = `mailto:oumzil@gmail.com?subject=${encodeURIComponent(
        contactForm.subject
      )}&body=${encodeURIComponent(emailBody)}`;

      await Linking.openURL(mailtoUrl);

      Alert.alert(
        "Message envoyé",
        "Votre message a été préparé dans votre application email. Envoyez-le pour que nous puissions vous aider.",
        [
          {
            text: "OK",
            onPress: () => {
              setContactForm({ subject: "", message: "", email: "" });
            },
          },
        ]
      );
    } catch (error) {
      Alert.alert(
        "Erreur",
        "Impossible d'ouvrir l'application email. Veuillez nous contacter directement à oumzil@gmail.com"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="flex-row items-center justify-between p-4 bg-white border-b border-gray-200">
        <TouchableOpacity onPress={() => router.back()} className="p-2">
          <Feather name="arrow-left" size={24} color="#374151" />
        </TouchableOpacity>

        <Text className="text-lg font-bold text-gray-800">Support</Text>

        <View className="w-8" />
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Quick Contact Methods */}
        <View className="bg-white mx-4 mt-4 rounded-xl shadow-sm">
          <Text className="text-lg font-bold text-gray-800 p-4 pb-2">
            Contactez-nous
          </Text>

          {contactMethods.map((method, index) => (
            <TouchableOpacity
              key={method.id}
              className={`flex-row items-center p-4 ${
                index < contactMethods.length - 1
                  ? "border-b border-gray-100"
                  : ""
              }`}
              onPress={method.action}
            >
              <View className="w-12 h-12 bg-orange-100 rounded-full items-center justify-center mr-4">
                <Feather name={method.icon as any} size={20} color="#F97316" />
              </View>
              <View className="flex-1">
                <Text className="text-gray-800 font-semibold">
                  {method.title}
                </Text>
                <Text className="text-orange-500 text-sm font-medium">
                  {method.subtitle}
                </Text>
                <Text className="text-gray-500 text-xs">
                  {method.description}
                </Text>
              </View>
              <Feather name="external-link" size={16} color="#9CA3AF" />
            </TouchableOpacity>
          ))}
        </View>

        {/* FAQ Section */}
        <View className="bg-white mx-4 mt-4 rounded-xl shadow-sm">
          <Text className="text-lg font-bold text-gray-800 p-4 pb-2">
            Questions fréquentes
          </Text>

          {faqData.map((faq, index) => (
            <View key={faq.id}>
              <TouchableOpacity
                className={`flex-row items-center justify-between p-4 ${
                  index < faqData.length - 1 || selectedFAQ === faq.id
                    ? "border-b border-gray-100"
                    : ""
                }`}
                onPress={() => handleFAQToggle(faq.id)}
              >
                <Text className="text-gray-800 font-medium flex-1 pr-4">
                  {faq.question}
                </Text>
                <Feather
                  name={selectedFAQ === faq.id ? "chevron-up" : "chevron-down"}
                  size={20}
                  color="#9CA3AF"
                />
              </TouchableOpacity>

              {selectedFAQ === faq.id && (
                <View className="px-4 pb-4">
                  <Text className="text-gray-600 text-sm leading-6">
                    {faq.answer}
                  </Text>
                </View>
              )}
            </View>
          ))}
        </View>

        {/* Contact Form */}
        <View className="bg-white mx-4 mt-4 rounded-xl p-4 shadow-sm">
          <Text className="text-lg font-bold text-gray-800 mb-4">
            Envoyer un message
          </Text>

          {/* Issue Categories */}
          <Text className="text-gray-700 font-medium mb-2">
            Type de problème
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            className="mb-4"
          >
            <View className="flex-row space-x-3">
              {issueCategories.map((category) => (
                <TouchableOpacity
                  key={category.id}
                  className={`flex-row items-center px-3 py-2 rounded-full border ${
                    contactForm.subject.includes(category.name)
                      ? "bg-orange-100 border-orange-300"
                      : "bg-gray-100 border-gray-300"
                  }`}
                  onPress={() =>
                    setContactForm({
                      ...contactForm,
                      subject: category.name,
                    })
                  }
                >
                  <Feather
                    name={category.icon as any}
                    size={16}
                    color={
                      contactForm.subject.includes(category.name)
                        ? "#F97316"
                        : "#6B7280"
                    }
                  />
                  <Text
                    className={`ml-2 text-sm ${
                      contactForm.subject.includes(category.name)
                        ? "text-orange-700 font-medium"
                        : "text-gray-700"
                    }`}
                  >
                    {category.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>

          {/* Subject */}
          <Text className="text-gray-700 font-medium mb-2">Sujet *</Text>
          <TextInput
            className="border border-gray-300 rounded-lg p-3 text-gray-800 mb-4"
            placeholder="Décrivez brièvement votre problème"
            placeholderTextColor="#9CA3AF"
            value={contactForm.subject}
            onChangeText={(text) =>
              setContactForm({
                ...contactForm,
                subject: text,
              })
            }
          />

          {/* Message */}
          <Text className="text-gray-700 font-medium mb-2">Message *</Text>
          <TextInput
            className="border border-gray-300 rounded-lg p-3 text-gray-800 mb-4"
            placeholder="Décrivez votre problème en détail..."
            placeholderTextColor="#9CA3AF"
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            value={contactForm.message}
            onChangeText={(text) =>
              setContactForm({
                ...contactForm,
                message: text,
              })
            }
          />

          {/* Email (optional) */}
          <Text className="text-gray-700 font-medium mb-2">
            Email de contact (optionnel)
          </Text>
          <TextInput
            className="border border-gray-300 rounded-lg p-3 text-gray-800 mb-4"
            placeholder="votre@email.com"
            placeholderTextColor="#9CA3AF"
            keyboardType="email-address"
            autoCapitalize="none"
            value={contactForm.email}
            onChangeText={(text) =>
              setContactForm({
                ...contactForm,
                email: text,
              })
            }
          />

          {/* Submit Button */}
          <TouchableOpacity
            className="bg-orange-500 py-3 rounded-lg items-center"
            onPress={handleSubmitContactForm}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <ActivityIndicator color="white" />
            ) : (
              <View className="flex-row items-center">
                <Feather name="send" size={18} color="white" />
                <Text className="text-white font-semibold ml-2">
                  Envoyer le message
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Emergency Contact */}
        <View className="bg-red-50 border border-red-200 mx-4 mt-4 mb-8 rounded-xl p-4">
          <View className="flex-row items-center mb-2">
            <Feather name="alert-circle" size={20} color="#EF4444" />
            <Text className="text-red-800 font-bold ml-2">Urgence</Text>
          </View>
          <Text className="text-red-700 text-sm mb-3">
            En cas d'urgence pendant une livraison (accident, agression, etc.),
            contactez immédiatement les services d'urgence.
          </Text>
          <TouchableOpacity
            className="bg-red-500 py-2 px-4 rounded-lg self-start"
            onPress={() => Linking.openURL("tel:190")}
          >
            <Text className="text-white font-semibold">📞 Appeler 190</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
