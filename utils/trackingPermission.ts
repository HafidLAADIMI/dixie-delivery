// utils/trackingPermission.ts
import * as TrackingTransparency from 'expo-tracking-transparency';
import { Platform } from 'react-native';

export const requestTrackingPermission = async (): Promise<boolean> => {
    try {
        // Only request on iOS
        if (Platform.OS !== 'ios') {
            console.log('Tracking permission not needed on Android');
            return true;
        }

        // Check if tracking is available
        const { status } = await TrackingTransparency.getTrackingPermissionsAsync();
        console.log('Current tracking permission status:', status);

        if (status === TrackingTransparency.PermissionStatus.UNDETERMINED) {
            console.log('Requesting tracking permission...');
            // Request permission
            const { status: newStatus } = await TrackingTransparency.requestTrackingPermissionsAsync();
            console.log('New tracking permission status:', newStatus);
            return newStatus === TrackingTransparency.PermissionStatus.GRANTED;
        }

        return status === TrackingTransparency.PermissionStatus.GRANTED;
    } catch (error) {
        console.error('Error requesting tracking permission:', error);
        return false;
    }
};

export const getTrackingPermissionStatus = async (): Promise<string> => {
    try {
        if (Platform.OS !== 'ios') {
            return 'not_applicable';
        }

        const { status } = await TrackingTransparency.getTrackingPermissionsAsync();

        switch (status) {
            case TrackingTransparency.PermissionStatus.GRANTED:
                return 'granted';
            case TrackingTransparency.PermissionStatus.DENIED:
                return 'denied';
            case TrackingTransparency.PermissionStatus.RESTRICTED:
                return 'restricted';
            case TrackingTransparency.PermissionStatus.UNDETERMINED:
                return 'undetermined';
            default:
                return 'unknown';
        }
    } catch (error) {
        console.error('Error getting tracking permission status:', error);
        return 'error';
    }
};

// Helper function to check if user has granted tracking permission
export const hasTrackingPermission = async (): Promise<boolean> => {
    const status = await getTrackingPermissionStatus();
    return status === 'granted' || status === 'not_applicable';
};

// Helper function to show a user-friendly status message
export const getTrackingStatusMessage = async (): Promise<string> => {
    const status = await getTrackingPermissionStatus();

    switch (status) {
        case 'granted':
            return 'Suivi autorisé pour améliorer votre expérience';
        case 'denied':
            return 'Suivi refusé - votre confidentialité est respectée';
        case 'restricted':
            return 'Suivi restreint par les paramètres de l\'appareil';
        case 'undetermined':
            return 'Statut de suivi non déterminé';
        case 'not_applicable':
            return 'Suivi non applicable sur cet appareil';
        default:
            return 'Statut de suivi inconnu';
    }
};