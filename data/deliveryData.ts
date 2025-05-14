// data/deliveryData.ts
export type Delivery = {
    id: string;
    name: string;
    phone: string;
    quantity: number;
    address: string;
    cod?: number;
    status: 'Delivered' | 'Pending' | 'Online';
    coordinate: {
        latitude: number;
        longitude: number;
    };
};

// Mock data for deliveries
export const deliveries: Delivery[] = [
    {
        id: 'B182441',
        name: 'Alex Gratereux',
        phone: '+880 1500 000 000',
        quantity: 3,
        address: 'H#15, R#1/B, Banani, PO-1229, Dhaka, BD',
        cod: 4437.00,
        status: 'Delivered',
        coordinate: { latitude: 23.7748, longitude: 90.3902 },
    },
    {
        id: 'B182430',
        name: 'Abdullah',
        phone: '+880 1300 000 012',
        quantity: 1,
        address: '430/B Mirpur 13, Dhaka 1216, BD',
        status: 'Online',
        coordinate: { latitude: 23.7798, longitude: 90.3962 },
    },
    {
        id: 'B182427',
        name: 'Alex Gratereux',
        phone: '+880 1500 000 456',
        quantity: 2,
        address: 'H#15, R#1/B, Banani, PO-1229, Dhaka, BD',
        cod: 3120.00,
        status: 'Pending',
        coordinate: { latitude: 23.7718, longitude: 90.3792 },
    },
];

// Function to get delivery by ID
export const getDeliveryById = (id: string): Delivery | null => {
    return deliveries.find(delivery => delivery.id === id) || null;
};

// data/mapData.ts
// Delivery locations for map markers
export const deliveryLocations = [
    { id: 1, coordinate: { latitude: 23.7808, longitude: 90.3782 } },
    { id: 2, coordinate: { latitude: 23.7768, longitude: 90.3842 } },
    { id: 3, coordinate: { latitude: 23.7748, longitude: 90.3902 } },
    { id: 4, coordinate: { latitude: 23.7718, longitude: 90.3792 } },
    { id: 5, coordinate: { latitude: 23.7798, longitude: 90.3962 } },
    { id: 7, coordinate: { latitude: 23.7858, longitude: 90.3852 } },
];

// Route coordinates for delivery path
export const routeCoordinates = [
    { latitude: 23.7748, longitude: 90.3902 },
    { latitude: 23.7728, longitude: 90.3892 },
    { latitude: 23.7718, longitude: 90.3872 },
    { latitude: 23.7708, longitude: 90.3852 },
    { latitude: 23.7698, longitude: 90.3832 },
    { latitude: 23.7718, longitude: 90.3792 },
];