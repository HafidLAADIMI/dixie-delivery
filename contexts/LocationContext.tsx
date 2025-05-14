// contexts/LocationContext.tsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import * as Location from 'expo-location';

// Types
type Coordinate = {
    latitude: number;
    longitude: number;
};

type LocationContextType = {
    currentLocation: Coordinate | null;
    isLocationEnabled: boolean;
    permissionStatus: 'granted' | 'denied' | 'undetermined' | 'loading';
    errorMessage: string | null;
    requestPermission: () => Promise<void>;
    startLocationTracking: () => Promise<void>;
    stopLocationTracking: () => void;
};

// Create context
const LocationContext = createContext<LocationContextType | undefined>(undefined);

// Default location (fallback) - would be configured based on your app's needs
const DEFAULT_LOCATION: Coordinate = {
    latitude: 23.7808,
    longitude: 90.3852,
};

// Provider component
export function LocationProvider({ children }: { children: React.ReactNode }) {
    const [currentLocation, setCurrentLocation] = useState<Coordinate | null>(null);
    const [isLocationEnabled, setIsLocationEnabled] = useState(false);
    const [permissionStatus, setPermissionStatus] = useState<'granted' | 'denied' | 'undetermined' | 'loading'>('loading');
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [locationSubscription, setLocationSubscription] = useState<Location.LocationSubscription | null>(null);

    // Check location permission on mount
    useEffect(() => {
        checkLocationPermission();
        return () => {
            // Clean up any active subscriptions
            if (locationSubscription) {
                locationSubscription.remove();
            }
        };
    }, []);

    const checkLocationPermission = async () => {
        try {
            const { status } = await Location.getForegroundPermissionsAsync();
            setPermissionStatus(status);

            if (status === 'granted') {
                const enabled = await Location.hasServicesEnabledAsync();
                setIsLocationEnabled(enabled);

                if (enabled) {
                    await getCurrentLocation();
                } else {
                    setErrorMessage('Location services are disabled. Please enable them in your device settings.');
                }
            }
        } catch (error) {
            console.error('Error checking location permission:', error);
            setErrorMessage('Failed to check location permission');
        }
    };

    const requestPermission = async () => {
        try {
            setPermissionStatus('loading');

            const { status } = await Location.requestForegroundPermissionsAsync();
            setPermissionStatus(status);

            if (status === 'granted') {
                const enabled = await Location.hasServicesEnabledAsync();
                setIsLocationEnabled(enabled);

                if (enabled) {
                    await getCurrentLocation();
                } else {
                    setErrorMessage('Location services are disabled. Please enable them in your device settings.');
                }
            } else {
                setErrorMessage('Location permission denied. Some features may be unavailable.');
            }
        } catch (error) {
            console.error('Error requesting location permission:', error);
            setErrorMessage('Failed to request location permission');
            setPermissionStatus('undetermined');
        }
    };

    const getCurrentLocation = async () => {
        try {
            const location = await Location.getCurrentPositionAsync({
                accuracy: Location.Accuracy.High,
            });

            setCurrentLocation({
                latitude: location.coords.latitude,
                longitude: location.coords.longitude,
            });

            setErrorMessage(null);
        } catch (error) {
            console.error('Error getting current location:', error);
            setErrorMessage('Failed to get current location');

            // Fallback to default location
            setCurrentLocation(DEFAULT_LOCATION);
        }
    };

    const startLocationTracking = async () => {
        try {
            if (permissionStatus !== 'granted') {
                await requestPermission();
                // @ts-ignore
                if (permissionStatus !== 'granted') {
                    return;
                }
            }

            // Stop any existing subscription
            stopLocationTracking();

            // Start a new subscription
            const subscription = await Location.watchPositionAsync(
                {
                    accuracy: Location.Accuracy.High,
                    distanceInterval: 10, // Minimum change (in meters) between updates
                    timeInterval: 5000, // Minimum time (in ms) between updates
                },
                (location) => {
                    setCurrentLocation({
                        latitude: location.coords.latitude,
                        longitude: location.coords.longitude,
                    });
                }
            );

            setLocationSubscription(subscription);
        } catch (error) {
            console.error('Error starting location tracking:', error);
            setErrorMessage('Failed to start location tracking');
        }
    };

    const stopLocationTracking = () => {
        if (locationSubscription) {
            locationSubscription.remove();
            setLocationSubscription(null);
        }
    };

    const value = {
        currentLocation,
        isLocationEnabled,
        permissionStatus,
        requestPermission,
        startLocationTracking,
        stopLocationTracking,
    };

    return <LocationContext.Provider value={value}>{children}</LocationContext.Provider>;
}

// Custom hook for using location context
export function useLocation() {
    const context = useContext(LocationContext);
    if (context === undefined) {
        throw new Error('useLocation must be used within a LocationProvider');
    }
    return context;
}