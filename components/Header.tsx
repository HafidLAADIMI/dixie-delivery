// components/Header.jsx
import { Text, View, Pressable } from "react-native";
import { Feather } from "@expo/vector-icons";

export default function Header({ title = "Accueil", onMenuPress }) {
    return (
        <View className="flex-row items-center px-4 py-3 bg-orange-500">
            <Pressable className="p-1" onPress={onMenuPress}>
                <Feather name="menu" size={24} color="white" />
            </Pressable>
            <Text className="text-white text-lg font-semibold mx-auto">{title}</Text>
        </View>
    );
}
