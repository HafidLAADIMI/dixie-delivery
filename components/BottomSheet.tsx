// components/BottomSheet.tsx
import { Animated, Dimensions, Pressable, View } from "react-native";
import { useEffect, useRef } from "react";

export default function BottomSheet({ children, onDismiss }) {
    const translateY = useRef(new Animated.Value(300)).current;
    const { height } = Dimensions.get("window");

    useEffect(() => {
        Animated.timing(translateY, {
            toValue: 0,
            duration: 250,
            useNativeDriver: true,
        }).start();
    }, []);

    return (
        <View
            className="absolute inset-0 bg-black/40 justify-end"
            pointerEvents="box-none"
        >
            <Pressable className="flex-1" onPress={onDismiss} />

            <Animated.View
                style={{ transform: [{ translateY }] }}
                className="bg-white rounded-t-3xl p-4"
            >
                {children}
            </Animated.View>
        </View>
    );
}