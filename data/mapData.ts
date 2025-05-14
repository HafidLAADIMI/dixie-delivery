// data/mapData.ts
import { LocationMarker, RouteCoordinate } from "../types";

// Delivery locations for map markers
export const deliveryLocations: LocationMarker[] = [
    {
        id: 1,
        coordinate: { latitude: 23.7808, longitude: 90.3782 },
    },
    {
        id: 2,
        coordinate: { latitude: 23.7768, longitude: 90.3842 },
    },
    {
        id: 3,
        coordinate: { latitude: 23.7748, longitude: 90.3902 },
    },
    {
        id: 4,
        coordinate: { latitude: 23.7718, longitude: 90.3792 },
    },
    {
        id: 5,
        coordinate: { latitude: 23.7798, longitude: 90.3962 },
    },
    {
        id: 7,
        coordinate: { latitude: 23.7858, longitude: 90.3852 },
    },
];

// Route coordinates for delivery path
export const routeCoordinates: RouteCoordinate[] = [
    { latitude: 23.7748, longitude: 90.3902 },
    { latitude: 23.7728, longitude: 90.3892 },
    { latitude: 23.7718, longitude: 90.3872 },
    { latitude: 23.7708, longitude: 90.3852 },
    { latitude: 23.7698, longitude: 90.3832 },
    { latitude: 23.7718, longitude: 90.3792 },
];

// Delivery regions with custom styling
export const deliveryRegions = [
    {
        id: 'region-1',
        name: 'Central Dhaka',
        coordinates: [
            { latitude: 23.7810, longitude: 90.3780 },
            { latitude: 23.7850, longitude: 90.3880 },
            { latitude: 23.7750, longitude: 90.3950 },
            { latitude: 23.7710, longitude: 90.3850 },
        ],
        fillColor: 'rgba(0, 71, 171, 0.1)',
        strokeColor: '#0047AB',
        strokeWidth: 2,
    },
    {
        id: 'region-2',
        name: 'North Dhaka',
        coordinates: [
            { latitude: 23.7860, longitude: 90.3780 },
            { latitude: 23.7910, longitude: 90.3880 },
            { latitude: 23.7890, longitude: 90.4050 },
            { latitude: 23.7840, longitude: 90.3950 },
        ],
        fillColor: 'rgba(255, 193, 7, 0.1)',
        strokeColor: '#FFC107',
        strokeWidth: 2,
    },
];

// Initial map region
export const initialMapRegion = {
    latitude: 23.7808,
    longitude: 90.3852,
    latitudeDelta: 0.02,
    longitudeDelta: 0.02,
};

// Driver current location (for tracking)
export const driverLocation = {
    latitude: 23.7728,
    longitude: 90.3872,
};

// Custom map markers with metadata
export const mapMarkers = {
    deliveryPoint: {
        icon: 'location',
        color: '#0047AB',
    },
    restaurant: {
        icon: 'restaurant',
        color: '#F59E0B',
    },
    customer: {
        icon: 'person',
        color: '#10B981',
    },
    depot: {
        icon: 'business',
        color: '#6366F1',
    },
};

// Helper functions for map calculations
export const mapHelpers = {
    // Calculate distance between two points in kilometers
    calculateDistance: (lat1: number, lon1: number, lat2: number, lon2: number): number => {
        const R = 6371; // Radius of the earth in km
        const dLat = deg2rad(lat2 - lat1);
        const dLon = deg2rad(lon2 - lon1);
        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const d = R * c; // Distance in km
        return Math.round(d * 100) / 100;
    },

    // Calculate estimated travel time based on distance and average speed
    calculateTravelTime: (distanceInKm: number, averageSpeedKmh: number = 30): number => {
        return (distanceInKm / averageSpeedKmh) * 60; // Time in minutes
    },

    // Get center point from multiple coordinates
    getCenterPoint: (coordinates: RouteCoordinate[]): RouteCoordinate => {
        if (!coordinates.length) {
            return { latitude: 0, longitude: 0 };
        }

        let latSum = 0;
        let lonSum = 0;

        coordinates.forEach(coord => {
            latSum += coord.latitude;
            lonSum += coord.longitude;
        });

        return {
            latitude: latSum / coordinates.length,
            longitude: lonSum / coordinates.length,
        };
    }
};

// Helper function to convert degrees to radians
function deg2rad(deg: number): number {
    return deg * (Math.PI / 180);
}