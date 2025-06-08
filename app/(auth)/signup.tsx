// app/(auth)/signup.tsx - Complete version with privacy
import React, {useState, useEffect} from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    Image,
    ScrollView,
    Alert, ActivityIndicator, KeyboardAvoidingView, Platform, StyleSheet,
} from 'react-native';

import {Feather} from '@expo/vector-icons';
import {router} from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import {COLORS} from '@/constants/theme';
import {
    uploadImage,
    createDeliverymanApplication,
    signupWithEmail
} from '@/services/deliverymanService';
import {SafeAreaView} from "react-native-safe-area-context";
import {StatusBar} from "expo-status-bar";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { PrivacyDisclosure } from '@/components/PrivacyDisclosure';
import { requestTrackingPermission } from '@/utils/trackingPermission';

// Storage keys
const STORAGE_KEYS = {
    PRIVACY_ACCEPTED: '@privacy_accepted',
    TRACKING_PERMISSION: '@tracking_permission'
};

// Zones data
const ZONES = [
    {id: 'zone1', name: 'Central Zone'},
    {id: 'zone2', name: 'North Zone'},
    {id: 'zone3', name: 'South Zone'},
    {id: 'zone4', name: 'East Zone'},
    {id: 'zone5', name: 'West Zone'},
];

// Vehicle types
const VEHICLE_TYPES = [
    {id: 'motorcycle', name: 'Motorcycle'},
    {id: 'bicycle', name: 'Bicycle'},
    {id: 'car', name: 'Car'},
    {id: 'van', name: 'Van'},
];

// Identity types
const IDENTITY_TYPES = [
    {id: 'id_card', name: 'ID Card'},
    {id: 'passport', name: 'Passport'},
    {id: 'driver_license', name: 'Driver\'s License'},
];

export default function DeliverymanSignupScreen() {
    // Privacy states
    const [showPrivacyDisclosure, setShowPrivacyDisclosure] = useState(false);
    const [privacyAccepted, setPrivacyAccepted] = useState(false);
    const [isCheckingPrivacy, setIsCheckingPrivacy] = useState(true);

    // Form state
    const [currentStep, setCurrentStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [termsAccepted, setTermsAccepted] = useState(false);

    // Step 1: General Info
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [email, setEmail] = useState('');
    const [zone, setZone] = useState('');
    const [profileImage, setProfileImage] = useState(null);

    // Step 2: Additional Data
    const [age, setAge] = useState('');
    const [day, setDay] = useState('');
    const [month, setMonth] = useState('');
    const [year, setYear] = useState('');

    // Step 3: Account Info
    const [phone, setPhone] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    // Step 4: Identification Info
    const [vehicle, setVehicle] = useState('motorcycle');
    const [identityType, setIdentityType] = useState('id_card');
    const [identityNumber, setIdentityNumber] = useState('');
    const [identityImage, setIdentityImage] = useState(null);

    // Dropdown state
    const [showZoneDropdown, setShowZoneDropdown] = useState(false);
    const [showVehicleDropdown, setShowVehicleDropdown] = useState(false);
    const [showIdentityTypeDropdown, setShowIdentityTypeDropdown] = useState(false);

    // Check privacy acceptance status on mount
    useEffect(() => {
        const checkPrivacyStatus = async () => {
            try {
                const accepted = await AsyncStorage.getItem(STORAGE_KEYS.PRIVACY_ACCEPTED);
                if (accepted === 'true') {
                    setPrivacyAccepted(true);
                } else {
                    setShowPrivacyDisclosure(true);
                }
            } catch (error) {
                console.error('Error checking privacy status:', error);
                setShowPrivacyDisclosure(true);
            } finally {
                setIsCheckingPrivacy(false);
            }
        };

        checkPrivacyStatus();
    }, []);

    // Handle privacy acceptance
    const handlePrivacyAccept = async () => {
        try {
            await AsyncStorage.setItem(STORAGE_KEYS.PRIVACY_ACCEPTED, 'true');
            setPrivacyAccepted(true);
            setShowPrivacyDisclosure(false);

            const hasTrackingPermission = await requestTrackingPermission();
            await AsyncStorage.setItem(STORAGE_KEYS.TRACKING_PERMISSION, hasTrackingPermission.toString());

            console.log('Privacy accepted for delivery signup, tracking permission:', hasTrackingPermission);
        } catch (error) {
            console.error('Error saving privacy acceptance:', error);
            Alert.alert('Erreur', 'Impossible de sauvegarder vos préférences');
        }
    };

    // Handle privacy decline
    const handlePrivacyDecline = async () => {
        try {
            await AsyncStorage.setItem(STORAGE_KEYS.PRIVACY_ACCEPTED, 'false');
            await AsyncStorage.setItem(STORAGE_KEYS.TRACKING_PERMISSION, 'false');
            setShowPrivacyDisclosure(false);
            setPrivacyAccepted(true);

            console.log('Privacy declined for delivery signup, no tracking permission');
        } catch (error) {
            console.error('Error saving privacy decline:', error);
            Alert.alert('Erreur', 'Impossible de sauvegarder vos préférences');
        }
    };

    // Calculate age from date inputs
    const calculateAge = (birthYear, birthMonth, birthDay) => {
        if (!birthYear || !birthMonth || !birthDay) return '';

        const today = new Date();
        let age = today.getFullYear() - parseInt(birthYear);
        const m = today.getMonth() + 1 - parseInt(birthMonth);

        if (m < 0 || (m === 0 && today.getDate() < parseInt(birthDay))) {
            age--;
        }

        return age.toString();
    };

    // Format date from individual fields
    const formatDate = () => {
        if (!day || !month || !year) return '';
        return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    };

    // Validation functions
    const validateStep1 = () => {
        if (!firstName.trim()) return 'First name is required';
        if (!lastName.trim()) return 'Last name is required';
        if (!email.trim()) return 'Email is required';
        if (!/\S+@\S+\.\S+/.test(email)) return 'Email is invalid';
        if (!zone) return 'Zone is required';
        return null;
    };

    const validateStep2 = () => {
        if (!day || !month || !year) return 'Birthdate is required';

        const birthYear = parseInt(year);
        const birthMonth = parseInt(month);
        const birthDay = parseInt(day);

        if (isNaN(birthYear) || isNaN(birthMonth) || isNaN(birthDay)) {
            return 'Please enter a valid date';
        }

        if (birthMonth < 1 || birthMonth > 12) {
            return 'Month must be between 1 and 12';
        }

        const daysInMonth = new Date(birthYear, birthMonth, 0).getDate();
        if (birthDay < 1 || birthDay > daysInMonth) {
            return `Day must be between 1 and ${daysInMonth} for the selected month`;
        }

        const calculatedAge = calculateAge(year, month, day);
        if (parseInt(calculatedAge) < 18) {
            return 'You must be at least 18 years old';
        }

        setAge(calculatedAge);
        return null;
    };

    const validateStep3 = () => {
        if (!phone.trim()) return 'Phone number is required';
        if (!password.trim()) return 'Password is required';
        if (password.length < 8) return 'Password must be at least 8 characters';
        if (password !== confirmPassword) return 'Passwords do not match';
        return null;
    };

    const validateStep4 = () => {
        if (!identityNumber.trim()) return 'Identity number is required';
        if (!identityImage) return 'Identity image is required';
        if (!termsAccepted) return 'You must accept the terms and conditions';
        return null;
    };

    // Handle next step button
    const handleNextStep = () => {
        if (!privacyAccepted) {
            setShowPrivacyDisclosure(true);
            return;
        }

        let error = null;

        switch (currentStep) {
            case 1:
                error = validateStep1();
                break;
            case 2:
                error = validateStep2();
                break;
            case 3:
                error = validateStep3();
                break;
            default:
                break;
        }

        if (error) {
            Alert.alert('Validation Error', error);
            return;
        }

        setCurrentStep(currentStep + 1);
    };

    // Handle previous step button
    const handlePrevStep = () => {
        setCurrentStep(currentStep - 1);
    };

    // Navigate to login
    const navigateToLogin = () => {
        if (!privacyAccepted) {
            setShowPrivacyDisclosure(true);
            return;
        }
        router.push('/(auth)/login');
    };

    // Image picker functions
    const pickProfileImage = async () => {
        try {
            const {status} = await ImagePicker.requestMediaLibraryPermissionsAsync();

            if (status !== 'granted') {
                Alert.alert('Permission Required', 'Please allow access to your photo library to upload a profile image.');
                return;
            }

            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [1, 1],
                quality: 0.8,
            });

            if (!result.canceled && result.assets && result.assets.length > 0) {
                setProfileImage(result.assets[0].uri);
            }
        } catch (error) {
            console.error('Error picking image:', error);
            Alert.alert('Error', 'Failed to pick an image. Please try again.');
        }
    };

    const pickIdentityImage = async () => {
        try {
            const {status} = await ImagePicker.requestMediaLibraryPermissionsAsync();

            if (status !== 'granted') {
                Alert.alert('Permission Required', 'Please allow access to your photo library to upload your identity document.');
                return;
            }

            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [4, 3],
                quality: 0.8,
            });

            if (!result.canceled && result.assets && result.assets.length > 0) {
                setIdentityImage(result.assets[0].uri);
            }
        } catch (error) {
            console.error('Error picking image:', error);
            Alert.alert('Error', 'Failed to pick an image. Please try again.');
        }
    };

    // Submit form
    const handleSubmit = async () => {
        if (!privacyAccepted) {
            setShowPrivacyDisclosure(true);
            return;
        }

        const error = validateStep4();
        if (error) {
            Alert.alert('Validation Error', error);
            return;
        }

        setLoading(true);
        try {
            let profileImageUrl = null;
            let identityImageUrl = null;

            if (profileImage) {
                profileImageUrl = await uploadImage(
                    profileImage,
                    'deliverymen_applications/profiles'
                );
            }

            if (identityImage) {
                identityImageUrl = await uploadImage(
                    identityImage,
                    'deliverymen_applications/identity_documents'
                );
            }

            const applicationData = {
                firstName,
                lastName,
                email,
                phone,
                zone,
                vehicle,
                identityType,
                identityNumber,
                age: parseInt(age),
                birthdate: formatDate(),
                profileImageUrl,
                identityImageUrl,
                status: 'inactive',
            };

            await createDeliverymanApplication(applicationData);
            await signupWithEmail(email, password);

            Alert.alert(
                'Application Submitted',
                'Your application has been submitted for review. You will be notified once your application has been processed.',
                [{ text: 'OK', onPress: () => router.replace('/(auth)/login') }]
            );
        } catch (error) {
            console.error('Error during application submission:', error);

            let errorMessage = 'An unexpected error occurred. Please try again.';

            if (error.code === 'auth/email-already-in-use') {
                errorMessage = 'This email is already registered. Please use another email or try logging in.';
            } else if (error.code === 'auth/invalid-email') {
                errorMessage = 'Please enter a valid email address.';
            } else if (error.code === 'auth/weak-password') {
                errorMessage = 'The password is too weak. Please use a stronger password.';
            } else if (error.message && error.message.includes('upload')) {
                errorMessage = 'Failed to upload images. Please check your internet connection and try again.';
            } else if (error.message) {
                errorMessage = error.message;
            }

            Alert.alert('Registration Error', errorMessage);
        } finally {
            setLoading(false);
        }
    };

    // Render dropdown
    const renderDropdown = (
        items,
        selectedValue,
        setSelectedValue,
        showDropdown,
        setShowDropdown,
        placeholder
    ) => {
        return (
            <View className="relative">
                <TouchableOpacity
                    className="flex-row items-center border border-gray-300 rounded-xl px-4 py-2"
                    onPress={() => setShowDropdown(!showDropdown)}
                >
                    <Text className={`flex-1 ${selectedValue ? 'text-gray-800' : 'text-gray-400'}`}>
                        {selectedValue ? items.find(item => item.id === selectedValue)?.name : placeholder}
                    </Text>
                    <Feather name={showDropdown ? "chevron-up" : "chevron-down"} size={20} color="#9CA3AF"/>
                </TouchableOpacity>

                {showDropdown && (
                    <View
                        className="absolute top-12 left-0 right-0 bg-white border border-gray-300 rounded-xl z-10 max-h-40">
                        <ScrollView className="p-2">
                            {items.map(item => (
                                <TouchableOpacity
                                    key={item.id}
                                    className="py-2 px-3 border-b border-gray-100"
                                    onPress={() => {
                                        setSelectedValue(item.id);
                                        setShowDropdown(false);
                                    }}
                                >
                                    <Text
                                        className={`${item.id === selectedValue ? 'text-orange-500 font-medium' : 'text-gray-800'}`}>
                                        {item.name}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>
                )}
            </View>
        );
    };

    // Render steps
    const renderStep1 = () => {
        return (
            <View className="p-4 bg-white rounded-xl shadow mb-4">
                <View className="flex-row items-center mb-4">
                    <Feather name="user" size={20} color={COLORS.primary.DEFAULT}/>
                    <Text className="text-lg font-semibold ml-2">General Info</Text>
                </View>

                {/* First Name */}
                <View className="mb-4">
                    <Text className="text-gray-700 mb-2 font-medium">First Name</Text>
                    <View className="flex-row items-center border border-gray-300 rounded-xl px-4 py-2">
                        <TextInput
                            className="flex-1 text-gray-800"
                            placeholder="First name"
                            placeholderTextColor="#9CA3AF"
                            value={firstName}
                            onChangeText={setFirstName}
                        />
                    </View>
                </View>

                {/* Last Name */}
                <View className="mb-4">
                    <Text className="text-gray-700 mb-2 font-medium">Last Name</Text>
                    <View className="flex-row items-center border border-gray-300 rounded-xl px-4 py-2">
                        <TextInput
                            className="flex-1 text-gray-800"
                            placeholder="Last name"
                            placeholderTextColor="#9CA3AF"
                            value={lastName}
                            onChangeText={setLastName}
                        />
                    </View>
                </View>

                {/* Email */}
                <View className="mb-4">
                    <Text className="text-gray-700 mb-2 font-medium">Email</Text>
                    <View className="flex-row items-center border border-gray-300 rounded-xl px-4 py-2">
                        <Feather name="mail" size={20} color="#9CA3AF"/>
                        <TextInput
                            className="flex-1 ml-2 text-gray-800"
                            placeholder="your@email.com"
                            placeholderTextColor="#9CA3AF"
                            keyboardType="email-address"
                            autoCapitalize="none"
                            value={email}
                            onChangeText={setEmail}
                        />
                    </View>
                </View>

                {/* Zone */}
                <View className="mb-4">
                    <Text className="text-gray-700 mb-2 font-medium">Zone</Text>
                    {renderDropdown(
                        ZONES,
                        zone,
                        setZone,
                        showZoneDropdown,
                        setShowZoneDropdown,
                        "Select zone"
                    )}
                </View>

                {/* Profile Image */}
                <View className="mb-4">
                    <Text className="text-gray-700 mb-2 font-medium">Profile Image</Text>
                    <TouchableOpacity
                        className="bg-blue-50 border border-dashed border-blue-300 rounded-xl p-4 items-center justify-center"
                        onPress={pickProfileImage}
                        style={{height: 160}}
                    >
                        {profileImage ? (
                            <Image
                                source={{uri: profileImage}}
                                className="w-full h-full rounded-lg"
                                resizeMode="cover"
                            />
                        ) : (
                            <View className="items-center">
                                <Feather name="upload" size={40} color={COLORS.primary.DEFAULT}/>
                                <Text className="text-gray-600 mt-2 text-center">
                                    Tap to upload{'\n'}PNG, JPG, WEBP up to 5MB
                                </Text>
                            </View>
                        )}
                    </TouchableOpacity>
                </View>
            </View>
        );
    };

    const renderStep2 = () => {
        return (
            <View className="p-4 bg-white rounded-xl shadow mb-4">
                <View className="flex-row items-center mb-4">
                    <Feather name="file-text" size={20} color={COLORS.primary.DEFAULT}/>
                    <Text className="text-lg font-semibold ml-2">Additional Data</Text>
                </View>

                {/* Age (calculated) */}
                <View className="mb-4">
                    <Text className="text-gray-700 mb-2 font-medium">Age</Text>
                    <View className="flex-row items-center border border-gray-300 rounded-xl px-4 py-2 bg-gray-100">
                        <TextInput
                            className="flex-1 text-gray-800"
                            value={age}
                            editable={false}
                            placeholder="Age is calculated from birthdate"
                            placeholderTextColor="#9CA3AF"
                        />
                    </View>
                </View>

                {/* Birthdate */}
                <View className="mb-4">
                    <Text className="text-gray-700 mb-2 font-medium">Birthdate</Text>
                    <View className="flex-row space-x-2">
                        <View className="flex-1">
                            <Text className="text-gray-600 text-xs mb-1">Day</Text>
                            <TextInput
                                className="border border-gray-300 rounded-xl px-4 py-2 text-gray-800"
                                placeholder="DD"
                                keyboardType="number-pad"
                                maxLength={2}
                                value={day}
                                onChangeText={(text) => {
                                    setDay(text);
                                    if (text && month && year) {
                                        setAge(calculateAge(year, month, text));
                                    }
                                }}
                            />
                        </View>

                        <View className="flex-1">
                            <Text className="text-gray-600 text-xs mb-1">Month</Text>
                            <TextInput
                                className="border border-gray-300 rounded-xl px-4 py-2 text-gray-800"
                                placeholder="MM"
                                keyboardType="number-pad"
                                maxLength={2}
                                value={month}
                                onChangeText={(text) => {
                                    setMonth(text);
                                    if (day && text && year) {
                                        setAge(calculateAge(year, text, day));
                                    }
                                }}
                            />
                        </View>

                        <View className="flex-1">
                            <Text className="text-gray-600 text-xs mb-1">Year</Text>
                            <TextInput
                                className="border border-gray-300 rounded-xl px-4 py-2 text-gray-800"
                                placeholder="YYYY"
                                keyboardType="number-pad"
                                maxLength={4}
                                value={year}
                                onChangeText={(text) => {
                                    setYear(text);
                                    if (day && month && text) {
                                        setAge(calculateAge(text, month, day));
                                    }
                                }}
                            />
                        </View>
                    </View>
                </View>
            </View>
        );
    };

    const renderStep3 = () => {
        return (
            <View className="p-4 bg-white rounded-xl shadow mb-4">
                <View className="flex-row items-center mb-4">
                    <Feather name="lock" size={20} color={COLORS.primary.DEFAULT}/>
                    <Text className="text-lg font-semibold ml-2">Account Info</Text>
                </View>

                {/* Phone */}
                <View className="mb-4">
                    <Text className="text-gray-700 mb-2 font-medium">Phone</Text>
                    <View className="flex-row items-center border border-gray-300 rounded-xl px-4 py-2">
                        <Feather name="phone" size={20} color="#9CA3AF"/>
                        <TextInput
                            className="flex-1 ml-2 text-gray-800"
                            placeholder="Phone number"
                            placeholderTextColor="#9CA3AF"
                            keyboardType="phone-pad"
                            value={phone}
                            onChangeText={setPhone}
                        />
                    </View>
                </View>

                {/* Password */}
                <View className="mb-4">
                    <Text className="text-gray-700 mb-2 font-medium">Password</Text>
                    <View className="flex-row items-center border border-gray-300 rounded-xl px-4 py-2">
                        <Feather name="lock" size={20} color="#9CA3AF"/>
                        <TextInput
                            className="flex-1 ml-2 text-gray-800"
                            placeholder="At least 8 characters"
                            placeholderTextColor="#9CA3AF"
                            secureTextEntry={!showPassword}
                            value={password}
                            onChangeText={setPassword}
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

                {/* Confirm Password */}
                <View className="mb-4">
                    <Text className="text-gray-700 mb-2 font-medium">Confirm Password</Text>
                    <View className="flex-row items-center border border-gray-300 rounded-xl px-4 py-2">
                        <Feather name="lock" size={20} color="#9CA3AF"/>
                        <TextInput
                            className="flex-1 ml-2 text-gray-800"
                            placeholder="Confirm your password"
                            placeholderTextColor="#9CA3AF"
                            secureTextEntry={!showConfirmPassword}
                            value={confirmPassword}
                            onChangeText={setConfirmPassword}
                        />
                        <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
                            <Feather
                                name={showConfirmPassword ? "eye-off" : "eye"}
                                size={20}
                                color="#9CA3AF"
                            />
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        );
    };

    const renderStep4 = () => {
        return (
            <View className="p-4 bg-white rounded-xl shadow mb-4">
                <View className="flex-row items-center mb-4">
                    <Feather name="shield" size={20} color={COLORS.primary.DEFAULT}/>
                    <Text className="text-lg font-semibold ml-2">Identification Information</Text>
                </View>

                {/* Vehicle */}
                <View className="mb-4">
                    <Text className="text-gray-700 mb-2 font-medium">Vehicle</Text>
                    {renderDropdown(
                        VEHICLE_TYPES,
                        vehicle,
                        setVehicle,
                        showVehicleDropdown,
                        setShowVehicleDropdown,
                        "Select vehicle"
                    )}
                </View>

                {/* Identity Type */}
                <View className="mb-4">
                    <Text className="text-gray-700 mb-2 font-medium">Identity Type</Text>
                    {renderDropdown(
                        IDENTITY_TYPES,
                        identityType,
                        setIdentityType,
                        showIdentityTypeDropdown,
                        setShowIdentityTypeDropdown,
                        "Select ID type"
                    )}
                </View>

                {/* Identity Number */}
                <View className="mb-4">
                    <Text className="text-gray-700 mb-2 font-medium">Identity Number</Text>
                    <View className="flex-row items-center border border-gray-300 rounded-xl px-4 py-2">
                        <TextInput
                            className="flex-1 text-gray-800"
                            placeholder="Identity Number"
                            placeholderTextColor="#9CA3AF"
                            value={identityNumber}
                            onChangeText={setIdentityNumber}
                        />
                    </View>
                </View>

                {/* Identity Image */}
                <View className="mb-4">
                    <Text className="text-gray-700 mb-2 font-medium">Identity Image</Text>
                    <TouchableOpacity
                        className="bg-blue-50 border border-dashed border-blue-300 rounded-xl p-4 items-center justify-center"
                        onPress={pickIdentityImage}
                        style={{height: 160}}
                    >
                        {identityImage ? (
                            <Image
                                source={{uri: identityImage}}
                                className="w-full h-full rounded-lg"
                                resizeMode="cover"
                            />
                        ) : (
                            <View className="items-center">
                                <Feather name="upload" size={40} color={COLORS.primary.DEFAULT}/>
                                <Text className="text-gray-600 mt-2 text-center">
                                    Tap to upload{'\n'}PNG, JPG, WEBP up to 5MB
                                </Text>
                            </View>
                        )}
                    </TouchableOpacity>
                </View>

                {/* Terms and Conditions */}
                <View className="mb-4">
                    <TouchableOpacity
                        className="flex-row items-start"
                        onPress={() => setTermsAccepted(!termsAccepted)}
                    >
                        <View className={`w-5 h-5 border rounded flex items-center justify-center mr-2 mt-1 ${
                            termsAccepted ? 'bg-orange-500 border-orange-500' : 'border-gray-300'
                        }`}>
                            {termsAccepted && (
                                <Feather name="check" size={14} color="white"/>
                            )}
                        </View>
                        <Text className="text-gray-700 flex-1">
                            I agree to the Terms and Conditions and understand that my information will be reviewed by
                            administrators before my account is activated.
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    };

    // Show privacy disclosure if not accepted
    if (showPrivacyDisclosure) {
        return (
            <PrivacyDisclosure
                visible={showPrivacyDisclosure}
                onAccept={handlePrivacyAccept}
                onDecline={handlePrivacyDecline}
            />
        );
    }

    // Show loading while checking privacy status
    if (isCheckingPrivacy) {
        return (
            <SafeAreaView className="flex-1 bg-gray-50 justify-center items-center">
                <ActivityIndicator size="large" color={COLORS.primary.DEFAULT} />
                <Text className="text-gray-500 mt-4">Chargement...</Text>
            </SafeAreaView>
        );
    }

    // Only show signup form after privacy is accepted
    if (!privacyAccepted) {
        return null;
    }

    return (
        <SafeAreaView className="flex-1 bg-gray-50">
            <StatusBar style="dark"/>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                className="flex-1"
            >
                <ScrollView className="flex-1 p-4">
                    <View className="flex-row items-center justify-between mb-6">
                        <TouchableOpacity
                            className="w-10 h-10 rounded-full bg-white shadow items-center justify-center"
                            onPress={() => router.back()}
                        >
                            <Feather name="arrow-left" size={20} color="#333"/>
                        </TouchableOpacity>
                        <Text className="text-xl font-bold text-gray-800">Deliveryman Registration</Text>
                        <View style={{width: 40}}/>
                    </View>

                    {/* Progress Bar */}
                    <View className="flex-row justify-between mb-6">
                        {[1, 2, 3, 4].map((step) => (
                            <View key={step} className="items-center flex-1">
                                <View
                                    className={`w-10 h-10 rounded-full ${
                                        step <= currentStep ? 'bg-orange-500' : 'bg-gray-300'
                                    } items-center justify-center`}
                                >
                                    {step < currentStep ? (
                                        <Feather name="check" size={20} color="white"/>
                                    ) : (
                                        <Text className="text-white font-medium">{step}</Text>
                                    )}
                                </View>
                                {step < 4 && (
                                    <View
                                        className={`h-1 flex-1 mx-2 mt-5 ${
                                            step < currentStep ? 'bg-orange-500' : 'bg-gray-300'
                                        }`}
                                        style={{position: 'absolute', left: '50%', width: '100%', zIndex: -1}}
                                    />
                                )}
                            </View>
                        ))}
                    </View>

                    {/* Render current step */}
                    {currentStep === 1 && renderStep1()}
                    {currentStep === 2 && renderStep2()}
                    {currentStep === 3 && renderStep3()}
                    {currentStep === 4 && renderStep4()}

                    {/* Navigation buttons */}
                    <View className="flex-row justify-between mt-4 mb-8">
                        {currentStep > 1 && (
                            <TouchableOpacity
                                className="flex-row items-center bg-white py-3 px-5 rounded-xl border border-gray-300"
                                onPress={handlePrevStep}
                            >
                                <Feather name="arrow-left" size={20} color={COLORS.primary.DEFAULT}/>
                                <Text className="text-gray-800 font-medium ml-2">Previous</Text>
                            </TouchableOpacity>
                        )}

                        <View style={{width: currentStep > 1 ? 0 : 'auto'}}/>

                        {currentStep < 4 ? (
                            <TouchableOpacity
                                className="flex-row items-center bg-orange-500 py-3 px-5 rounded-xl"
                                onPress={handleNextStep}
                            >
                                <Text className="text-white font-medium mr-2">Next</Text>
                                <Feather name="arrow-right" size={20} color="white"/>
                            </TouchableOpacity>
                        ) : (
                            <TouchableOpacity
                                className="flex-row items-center bg-orange-500 py-3 px-5 rounded-xl"
                                onPress={handleSubmit}
                                disabled={loading}
                            >
                                {loading ? (
                                    <ActivityIndicator color="white"/>
                                ) : (
                                    <>
                                        <Text className="text-white font-medium mr-2">Submit</Text>
                                        <Feather name="check-circle" size={20} color="white"/>
                                    </>
                                )}
                            </TouchableOpacity>
                        )}
                    </View>

                    {/* Login link */}
                    <View className="flex-row justify-center mb-4">
                        <Text className="text-gray-600">Already have an account? </Text>
                        <TouchableOpacity onPress={navigateToLogin}>
                            <Text className="text-orange-500 font-medium">Sign In</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Privacy Settings Link */}
                    <View className="items-center pb-8">
                        <TouchableOpacity
                            onPress={() => setShowPrivacyDisclosure(true)}
                            className="flex-row items-center"
                        >
                            <Feather name="shield" size={16} color="#9CA3AF" />
                            <Text className="text-gray-500 text-sm ml-2">
                                Paramètres de confidentialité
                            </Text>
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    cardShadow: {
        shadowColor: '#000',
        shadowOffset: {width: 0, height: 1},
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
});