// services/orderService.js - Fixed with better error handling and debugging
import {
  collection,
  collectionGroup,
  getDocs,
  orderBy,
  query,
  doc,
  getDoc,
  updateDoc,
  serverTimestamp,
  where,
  documentId,
  Timestamp,
} from "firebase/firestore";
import { db } from "@/config/firebase";

// Helper function to extract coordinates from different possible formats
function _getCoordinates(orderData) {
  // Default coordinates (can be center of city or other default)
  let coords = { latitude: 32.3373, longitude: -6.3498 }; // Default to Beni Mellal

  // Try coordinates directly
  if (orderData.coordinates) {
    if (
      typeof orderData.coordinates.latitude === "number" &&
      typeof orderData.coordinates.longitude === "number"
    ) {
      return orderData.coordinates;
    }
  }

  // Try deliveryLocation (from createOrder in customer app)
  if (orderData.deliveryLocation) {
    if (
      typeof orderData.deliveryLocation.latitude === "number" &&
      typeof orderData.deliveryLocation.longitude === "number"
    ) {
      return {
        latitude: orderData.deliveryLocation.latitude,
        longitude: orderData.deliveryLocation.longitude,
      };
    }
  }

  // Try nested address object (from createOrder)
  if (orderData.address && typeof orderData.address === "object") {
    if (
      typeof orderData.address.latitude === "number" &&
      typeof orderData.address.longitude === "number"
    ) {
      return {
        latitude: orderData.address.latitude,
        longitude: orderData.address.longitude,
      };
    }
  }

  return coords;
}

// Helper function to standardize items format
function _standardizeItems(items) {
  if (!Array.isArray(items)) return [];

  return items.map((item) => {
    return {
      id: item.id || item.productId || "",
      name: item.name || "",
      price: Number(item.price || item.priceAtPurchase || 0),
      quantity: Number(item.quantity || 1),
      image:
        item.image?.uri || (typeof item.image === "string" ? item.image : ""),
      variations: Array.isArray(item.variations)
        ? item.variations
        : Array.isArray(item.selectedVariations)
        ? item.selectedVariations
        : [],
      addons: Array.isArray(item.addons)
        ? item.addons
        : Array.isArray(item.selectedAddons)
        ? item.selectedAddons
        : [],
      subtotal: Number(item.subtotal || item.price * item.quantity || 0),
    };
  });
}

// Order fields mapping
export const Order = {
  mapOrderFields(orderData) {
    return {
      // Basic fields
      id: orderData.id || "",
      userId: orderData.userId || "",
      driverId: orderData.driverId || null,

      // Customer details
      customerName: orderData.customerName || "",
      customerPhone: orderData.phoneNumber || orderData.customerPhone || "",

      // Address handling
      address:
        orderData.address?.address ||
        orderData.deliveryAddress ||
        (orderData.deliveryLocation
          ? orderData.deliveryLocation.address
          : "") ||
        "",

      // Delivery instructions
      deliveryInstructions:
        orderData.address?.instructions ||
        orderData.additionalNote ||
        orderData.deliveryLocation?.instructions ||
        orderData.notes ||
        "",

      // Coordinates
      coordinates: _getCoordinates(orderData),

      // Order status and payment
      status: orderData.status || "pending",
      paymentStatus: orderData.paymentStatus || "unpaid",
      paymentMethod: orderData.paymentMethod || "cash_on_delivery",

      // Financial details
      total: orderData.total || orderData.grandTotal || 0,
      subtotal: orderData.subtotal || 0,
      deliveryFee: orderData.deliveryFee || 0,
      tipAmount: orderData.tipAmount || 0,

      // Items
      items: _standardizeItems(orderData.items || []),

      // Additional info
      notes: orderData.notes || orderData.additionalNote || "",
      date: orderData.date || new Date(),
      createdAt: orderData.createdAt,
      updatedAt: orderData.updatedAt,

      // Restaurant info
      restaurantId: orderData.restaurantId || "",
      cuisineName: orderData.cuisineName || "",

      // Order type
      orderType: orderData.orderType || orderData.deliveryOption || "delivery",
    };
  },

  // Helper methods for display
  getStatusDisplay(status) {
    switch (status) {
      case "pending":
        return "En Attente";
      case "confirmed":
        return "Confirmée";
      case "progress":
        return "En Cours";
      case "completed":
        return "Terminée";
      case "delivered":
        return "Livrée";
      case "cancelled":
        return "Annulée";
      default:
        return status
          ? status.charAt(0).toUpperCase() + status.slice(1)
          : "Inconnu";
    }
  },
};

/**
 * Get all orders from user subcollections
 */
/**
 * Get orders from BOTH locations (subcollections AND main collection)
 */
export const getOrders = async () => {
  try {
    console.log("[getOrders] Loading orders from both locations...");

    // Get orders from user subcollections
    const subcollectionQuery = query(collectionGroup(db, "orders"));
    const subcollectionSnapshot = await getDocs(subcollectionQuery);

    // Get orders from main collection
    const mainCollectionQuery = query(collection(db, "orders"));
    const mainCollectionSnapshot = await getDocs(mainCollectionQuery);

    const allOrders = [];

    // Process subcollection orders
    subcollectionSnapshot.docs.forEach((doc) => {
      const data = doc.data();
      const pathSegments = doc.ref.path.split("/");
      const userId = pathSegments[1];

      allOrders.push(
        Order.mapOrderFields({
          ...data,
          id: doc.id,
          userId: userId,
          source: "subcollection",
        })
      );
    });

    // Process main collection orders
    mainCollectionSnapshot.docs.forEach((doc) => {
      const data = doc.data();

      // Skip if we already have this order from subcollection
      const existingOrder = allOrders.find((order) => order.id === doc.id);
      if (!existingOrder) {
        allOrders.push(
          Order.mapOrderFields({
            ...data,
            id: doc.id,
            userId: data.userId || doc.id, // Use stored userId or fallback to doc.id
            source: "main_collection",
          })
        );
      }
    });

    console.log(
      `[getOrders] ${allOrders.length} orders loaded from both sources`
    );
    return allOrders;
  } catch (error) {
    console.error("Error getting orders:", error);
    return [];
  }
};

/**
 * Get a specific order by user ID and order ID with enhanced debugging
 */
export const getOrderOnce = async (userId, orderId) => {
  try {
    console.log(
      `[getOrderOnce] Looking for order - userId: "${userId}", orderId: "${orderId}"`
    );

    if (!userId || !orderId) {
      console.error("[getOrderOnce] Missing user ID or order ID");
      return null;
    }

    // Check if userId and orderId are the same (indicates wrong ID format)
    if (userId === orderId) {
      console.error(
        `[getOrderOnce] userId and orderId are the same: "${userId}". This suggests wrong ID format.`
      );

      // Try to find the order in any user's collection
      const allOrders = await getOrders();
      const foundOrder = allOrders.find((order) => order.id === orderId);

      if (foundOrder) {
        console.log(
          `[getOrderOnce] Found order ${orderId} under user ${foundOrder.userId}`
        );
        return foundOrder;
      }

      console.error(
        `[getOrderOnce] Order ${orderId} not found in any user collection`
      );
      return null;
    }

    // Get from user's orders collection
    const orderRef = doc(db, "users", userId, "orders", orderId);
    console.log(
      `[getOrderOnce] Attempting to fetch from path: users/${userId}/orders/${orderId}`
    );

    const orderSnap = await getDoc(orderRef);

    if (!orderSnap.exists()) {
      console.error(
        `[getOrderOnce] Order ${orderId} not found for user ${userId}`
      );

      // Try to find the order in other user collections
      console.log(
        `[getOrderOnce] Searching for order ${orderId} in all user collections...`
      );
      const allOrders = await getOrders();
      const foundOrder = allOrders.find((order) => order.id === orderId);

      if (foundOrder) {
        console.log(
          `[getOrderOnce] Found order ${orderId} under user ${foundOrder.userId} instead of ${userId}`
        );
        return foundOrder;
      }

      console.error(`[getOrderOnce] Order ${orderId} not found anywhere`);
      return null;
    }

    const data = orderSnap.data();
    console.log(
      `[getOrderOnce] Successfully loaded order ${orderId} for user ${userId}`
    );

    return Order.mapOrderFields({
      ...data,
      id: orderId,
      userId,
    });
  } catch (error) {
    console.error(`[getOrderOnce] Error loading order:`, error);
    return null;
  }
};

/**
 * Alternative method to find order by ID across all users
 */
export const findOrderById = async (orderId) => {
  try {
    console.log(
      `[findOrderById] Searching for order ${orderId} across all users...`
    );

    const allOrders = await getOrders();
    const foundOrder = allOrders.find((order) => order.id === orderId);

    if (foundOrder) {
      console.log(
        `[findOrderById] Found order ${orderId} under user ${foundOrder.userId}`
      );
      return foundOrder;
    }

    console.error(`[findOrderById] Order ${orderId} not found`);
    return null;
  } catch (error) {
    console.error(`[findOrderById] Error searching for order:`, error);
    return null;
  }
};

/**
 * Update order status
 */
export const updateOrderStatus = async (
  userId,
  orderId,
  newStatus,
  additionalData = {}
) => {
  try {
    if (!orderId || !newStatus) {
      console.error("[updateOrderStatus] Missing orderId or newStatus");
      return false;
    }

    console.log(
      `[updateOrderStatus] Updating order ${orderId} to status: ${newStatus}`
    );

    const updateData = {
      status: newStatus,
      updatedAt: serverTimestamp(),
      ...additionalData,
    };

    let updated = false;

    // Try to update in user subcollection first (if userId is provided and different from orderId)
    if (userId && userId !== orderId) {
      try {
        const userOrderRef = doc(db, "users", userId, "orders", orderId);
        await updateDoc(userOrderRef, updateData);
        console.log(
          `[updateOrderStatus] Updated in user subcollection: users/${userId}/orders/${orderId}`
        );
        updated = true;
      } catch (error) {
        console.log(
          `[updateOrderStatus] Failed to update in subcollection:`,
          error.message
        );
      }
    }

    // Try to update in main collection
    try {
      const mainOrderRef = doc(db, "orders", orderId);
      await updateDoc(mainOrderRef, updateData);
      console.log(
        `[updateOrderStatus] Updated in main collection: orders/${orderId}`
      );
      updated = true;
    } catch (error) {
      console.log(
        `[updateOrderStatus] Failed to update in main collection:`,
        error.message
      );
    }

    if (!updated) {
      console.error(
        `[updateOrderStatus] Failed to update order ${orderId} in any location`
      );
      return false;
    }

    console.log(
      `[updateOrderStatus] Order status updated successfully to ${newStatus}`
    );
    return true;
  } catch (error) {
    console.error(`[updateOrderStatus] Error updating order status:`, error);
    return false;
  }
};

/**
 * Mark an order as in-progress (driver started delivery)
 */
export const startDelivery = async (userId, orderId) => {
  return updateOrderStatus(userId, orderId, "in-progress", {
    startedAt: serverTimestamp(),
  });
};

/**
 * Mark an order as delivered
 */
export const markOrderAsDelivered = async (userId, orderId, deliveryData) => {
  return updateOrderStatus(userId, orderId, "delivered", {
    deliveredAt: serverTimestamp(),
    ...deliveryData,
  });
};

/**
 * Accept an order for delivery
 */
export const acceptOrder = async (userId, orderId) => {
  return updateOrderStatus(userId, orderId, "confirmed", {
    acceptedAt: serverTimestamp(),
  });
};
