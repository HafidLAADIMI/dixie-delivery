// Updated AuthContext.tsx
import React, { createContext, useState, useContext, useEffect } from 'react';
import { auth } from '@/config/firebase';
import { logoutUser, getDeliverymanByEmail } from '@/services/deliverymanService';
import { onAuthStateChanged } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';

type User = {
    id: string;
    email: string | null;
    deliverymanId?: string;
    name?: string;
    avatarUrl?: string;
    role: 'deliveryman' | 'admin';
    status?: string; // Add status field to track account status
} | null;

type AuthContextType = {
    user: User;
    loading: boolean;
    signIn: (userData: User) => Promise<void>;
    signOut: () => Promise<void>;
    refreshUserStatus: () => Promise<void>; // New function to check user status
};

const AuthContext = createContext<AuthContextType>({
    user: null,
    loading: true,
    signIn: async () => {},
    signOut: async () => {},
    refreshUserStatus: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState<User>(null);
    const [loading, setLoading] = useState(true);

    // New function to verify user's status from Firestore
    const verifyUserStatus = async (firebaseUser) => {
        if (!firebaseUser || !firebaseUser.email) return null;

        try {
            // Check the user's current status in Firestore
            const deliveryman = await getDeliverymanByEmail(firebaseUser.email);

            // If no deliveryman found or status isn't active, return null (forcing logout)
            if (!deliveryman) {
                console.log(`User ${firebaseUser.email} not found in deliverymen collection`);
                return null;
            }

            if (deliveryman.status !== 'active') {
                console.log(`User ${firebaseUser.email} has inactive status: ${deliveryman.status}`);

                // Store specific status message for better user feedback
                if (deliveryman.status === 'inactive') {
                    await AsyncStorage.setItem('authErrorReason', 'Votre compte est actuellement inactif. Veuillez attendre l\'approbation de votre compte.');
                } else if (deliveryman.status === 'suspended') {
                    await AsyncStorage.setItem('authErrorReason', 'Votre compte a été suspendu. Veuillez contacter l\'assistance pour plus d\'informations.');
                } else {
                    await AsyncStorage.setItem('authErrorReason', `Votre compte est actuellement ${deliveryman.status}. Veuillez contacter l\'assistance.`);
                }

                return null;
            }

            return deliveryman;
        } catch (error) {
            console.error('Error verifying user status:', error);
            return null;
        }
    };

    // Function to refresh user status - can be called periodically or on app resume
    const refreshUserStatus = async () => {
        if (!user || !user.email) return;

        try {
            const deliveryman = await verifyUserStatus(auth.currentUser);

            if (!deliveryman) {
                // User no longer has active status, sign them out
                console.log('User status is no longer active, signing out');

                // We don't need to set error reason here as verifyUserStatus already does that

                await signOut();
            }
        } catch (error) {
            console.error('Error refreshing user status:', error);

            // Store generic error message
            await AsyncStorage.setItem('authErrorReason', 'Une erreur s\'est produite lors de la vérification de votre compte. Veuillez réessayer.');

            // On error, sign user out
            await signOut();
        }
    };

    useEffect(() => {
        // Listen for Firebase auth state changes
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            if (firebaseUser) {
                try {
                    // First verify the user's current status in Firestore
                    const deliveryman = await verifyUserStatus(firebaseUser);

                    if (!deliveryman) {
                        console.log(`User ${firebaseUser.email} has invalid status or account not found. Signing out.`);

                        // Store a reason message that the login screen can display
                        await AsyncStorage.setItem('authErrorReason', 'Votre compte a été suspendu ou désactivé. Veuillez contacter l\'assistance.');

                        // User doesn't have active status, sign them out
                        await logoutUser();
                        await AsyncStorage.removeItem('userData');
                        setUser(null);
                        setLoading(false);
                        return;
                    }

                    // Clear any stored error message since user is valid
                    await AsyncStorage.removeItem('authErrorReason');

                    // Get stored user data from AsyncStorage
                    const storedUserData = await AsyncStorage.getItem('userData');
                    if (storedUserData) {
                        const userData = JSON.parse(storedUserData);
                        // Update with latest status from Firestore
                        userData.status = deliveryman.status;
                        await AsyncStorage.setItem('userData', JSON.stringify(userData));
                        setUser(userData);
                    } else {
                        // Only have basic Firebase auth data
                        setUser({
                            id: firebaseUser.uid,
                            email: firebaseUser.email,
                            role: 'deliveryman', // Default role
                            status: deliveryman.status,
                        });
                    }
                } catch (error) {
                    console.error('Error retrieving user data:', error);

                    // Store error reason for login screen
                    await AsyncStorage.setItem('authErrorReason', 'Une erreur s\'est produite lors de la vérification de votre compte. Veuillez réessayer.');

                    // On error, safest to sign user out
                    await logoutUser();
                    await AsyncStorage.removeItem('userData');
                    setUser(null);
                }
            } else {
                setUser(null);
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const signIn = async (userData: User) => {
        try {
            // Ensure the user status is included in the userData
            if (!userData.status) {
                userData.status = 'active'; // Default to active if not provided
            }

            // Save user data to AsyncStorage
            await AsyncStorage.setItem('userData', JSON.stringify(userData));
            setUser(userData);
        } catch (error) {
            console.error('Error saving user data:', error);
            throw error;
        }
    };

    const signOut = async () => {
        try {
            await logoutUser();
            await AsyncStorage.removeItem('userData');
            setUser(null);
        } catch (error) {
            console.error('Error signing out:', error);
            throw error;
        }
    };

    return (
        <AuthContext.Provider value={{ user, loading, signIn, signOut, refreshUserStatus }}>
            {children}
        </AuthContext.Provider>
    );
};