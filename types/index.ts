// types/index.ts

/**
 * Delivery status options
 */
export type DeliveryStatus = 'Delivered' | 'Pending' | 'Online' | 'Cancelled' | 'Returned';

/**
 * Payment method options
 */
export type PaymentMethod = 'COD' | 'Online' | 'Card' | 'Bank Transfer';

/**
 * Delivery priority levels
 */
export type PriorityLevel = 'Low' | 'Medium' | 'High' | 'Urgent';

/**
 * Driver status options
 */
export type DriverStatus = 'Available' | 'On Delivery' | 'Offline' | 'On Break';

/**
 * User roles in the system
 */
export type UserRole = 'Driver' | 'Admin' | 'Customer' | 'Manager';

/**
 * Main delivery information
 */
export interface Delivery {
    id: string;
    orderNumber?: string;
    name: string;
    phone: string;
    quantity: number;
    address: string;
    cod?: number;
    status: DeliveryStatus;
    coordinate: Coordinate;
    createdAt: string | Date;
    scheduledTime?: string | Date;
    deliveredTime?: string | Date;
    priority?: PriorityLevel;
    paymentMethod: PaymentMethod;
    notes?: string;
    items?: DeliveryItem[];
    assignedTo?: string;
    customerEmail?: string;
    distance?: number;
    estimatedTime?: number;
    customerSignature?: string;
    proofOfDelivery?: string;
}

/**
 * Individual items in a delivery
 */
export interface DeliveryItem {
    id: string;
    name: string;
    quantity: number;
    price: number;
    weight?: number;
    description?: string;
    imageUrl?: string;
}

/**
 * Geographic coordinate
 */
export interface Coordinate {
    latitude: number;
    longitude: number;
}

/**
 * Map marker location
 */
export interface LocationMarker {
    id: number | string;
    coordinate: Coordinate;
    title?: string;
    description?: string;
    iconType?: string;
    color?: string;
}

/**
 * Route coordinate point
 */
export type RouteCoordinate = Coordinate;

/**
 * Region on map
 */
export interface Region {
    id: string;
    name: string;
    coordinates: Coordinate[];
    fillColor: string;
    strokeColor: string;
    strokeWidth: number;
}

/**
 * Chat message
 */
export interface ChatMessage {
    id: string;
    sender: string;
    senderId: string;
    message: string;
    time: string | Date;
    isMe: boolean;
    isRead?: boolean;
    attachments?: Attachment[];
}

/**
 * Message attachment
 */
export interface Attachment {
    id: string;
    type: 'image' | 'document' | 'location' | 'voice';
    url: string;
    thumbnail?: string;
    name?: string;
    size?: number;
}

/**
 * Notification
 */
export interface Notification {
    id: string;
    title: string;
    message: string;
    time: string | Date;
    read: boolean;
    icon: string;
    type?: 'info' | 'warning' | 'error' | 'success';
    actionUrl?: string;
    relatedId?: string;
}

/**
 * User profile
 */
export interface UserProfile {
    id: string;
    name: string;
    email: string;
    phone: string;
    avatarUrl?: string;
    role: UserRole;
    status: DriverStatus;
    rating?: number;
    address?: string;
    joinDate: string | Date;
    lastActive?: string | Date;
    deliveriesCompleted?: number;
    settings?: UserSettings;
}

/**
 * User app settings
 */
export interface UserSettings {
    notificationsEnabled: boolean;
    darkMode: boolean;
    language: string;
    soundEnabled: boolean;
    locationSharing: boolean;
    defaultMapType: 'standard' | 'satellite' | 'hybrid';
}

/**
 * Statistics summary
 */
export interface DeliveryStats {
    completed: number;
    pending: number;
    cancelled: number;
    returned: number;
    totalEarnings: number;
    todaysDeliveries: number;
    averageTime: number;
    satisfactionRate: number;
}

/**
 * Authentication related types
 */
export interface AuthState {
    isLoggedIn: boolean;
    token?: string;
    refreshToken?: string;
    user?: UserProfile;
    expiresAt?: string | Date;
}

/**
 * Login credentials
 */
export interface LoginCredentials {
    email: string;
    password: string;
    rememberMe?: boolean;
}

/**
 * API response structure
 */
export interface ApiResponse<T> {
    success: boolean;
    data?: T;
    error?: string;
    message?: string;
    statusCode?: number;
}

/**
 * Pagination parameters
 */
export interface PaginationParams {
    page: number;
    limit: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    search?: string;
    filters?: Record<string, any>;
}

/**
 * Paginated response
 */
export interface PaginatedResponse<T> {
    items: T[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNext: boolean;
    hasPrevious: boolean;
}

/**
 * App navigation state
 */
export interface NavigationState {
    currentScreen: string;
    previousScreen?: string;
    params?: Record<string, any>;
}

/**
 * Delivery filter options
 */
export interface DeliveryFilter {
    status?: DeliveryStatus[];
    dateRange?: {
        startDate: string | Date;
        endDate: string | Date;
    };
    paymentMethod?: PaymentMethod[];
    priority?: PriorityLevel[];
    assignedTo?: string;
}

/**
 * Map view state
 */
export interface MapViewState {
    region: {
        latitude: number;
        longitude: number;
        latitudeDelta: number;
        longitudeDelta: number;
    };
    mapType: 'standard' | 'satellite' | 'hybrid';
    showTraffic: boolean;
    followsUserLocation: boolean;
    selectedMarker?: LocationMarker;
}

/**
 * Network state
 */
export interface NetworkState {
    isConnected: boolean;
    isInternetReachable: boolean;
    type?: string;
    lastChecked?: Date;
}

/**
 * Location permission state
 */
export interface LocationPermissionState {
    status: 'granted' | 'denied' | 'undetermined' | 'loading';
    errorMessage?: string;
}

/**
 * Global app state
 */
export interface AppState {
    auth: AuthState;
    deliveries?: Delivery[];
    selectedDelivery?: Delivery;
    notifications?: Notification[];
    unreadNotificationsCount: number;
    stats?: DeliveryStats;
    mapView: MapViewState;
    network: NetworkState;
    locationPermission: LocationPermissionState;
    isLoading: boolean;
    error?: string;
    navigation: NavigationState;
    settings: UserSettings;
}