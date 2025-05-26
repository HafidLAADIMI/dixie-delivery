import {
    collection,
    doc,
    setDoc,
    query,
    where,
    getDocs,
    getDoc,
    serverTimestamp,
    getFirestore,
} from 'firebase/firestore';
import {

    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut
} from 'firebase/auth';

import {auth} from "@/config/firebase";

// Image upload function to firestorage

export const uploadImage = async (uri, path) => {
    try {
        console.log('Starting direct upload to Cloudinary:', {uri, path});
        // Hardcoded Cloudinary credentials (same as your backend)
        const CLOUDINARY_CLOUD_NAME = 'dkg7na769';
        const CLOUDINARY_UPLOAD_PRESET = 'hafid_preset'; // You need to create this unsigned upload preset in Cloudinary dashboard
        // Create form data
        const formData = new FormData();
        // Get the filename from the URI
        const uriParts = uri.split('/');
        const fileName = uriParts[uriParts.length - 1];
        // Determine file type
        const fileType = fileName.endsWith('.jpg') || fileName.endsWith('.jpeg')
            ? 'image/jpeg'
            : fileName.endsWith('.png')
                ? 'image/png'
                : 'image/jpeg'; // Default to jpeg
        console.log('Preparing file for Cloudinary upload:', {fileName, fileType});
        // Append the file to form data
        formData.append('file', {
            uri: Platform.OS === 'ios' ? uri.replace('file://', '') : uri,
            name: fileName,
            type: fileType,
        });
        // Add Cloudinary specific parameters
        formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
        if (path) {
            formData.append('folder', path);
        }
        // Cloudinary upload URL
        const CLOUDINARY_URL = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`;
        console.log('Sending direct upload request to Cloudinary:', CLOUDINARY_URL);
        // Send the upload request directly to Cloudinary
        const response = await fetch(CLOUDINARY_URL, {
            method: 'POST',
            body: formData,
            headers: {
                'Accept': 'application/json',
            },
        });
        // Log the response status
        console.log('Cloudinary upload response status:', response.status);
        // Get the raw response text
        const responseText = await response.text();
        console.log('Raw Cloudinary response:', responseText.substring(0, 200) + (responseText.length > 200 ? '...' : ''));
        // Parse JSON response
        let data;
        try {
            data = JSON.parse(responseText);
        } catch (parseError) {
            console.error('JSON parse error:', parseError);
            throw new Error('Cloudinary response was not valid JSON');
        }
        // Check for errors
        if (!response.ok) {
            console.error('Cloudinary upload failed:', data);
            throw new Error(data.error?.message || 'Failed to upload image to Cloudinary');
        }
        console.log('Cloudinary upload successful:', {
            public_id: data.public_id,
            url: data.secure_url
        });
        // Return the secure URL from Cloudinary
        return data.secure_url;
    } catch (error) {
        console.error('Error in uploadImage function:', error);
        throw error;
    }
};


// services/uploadService.ts
import * as FileSystem from 'expo-file-system';

// Upload image to a service like Cloudinary or Uploadcare
import axios from 'axios';
import {Platform} from "react-native";

// In your deliverymanService.js file


// Modified uploadImage function to upload directly to Cloudinary


// Firebase Authentication Functions
export const signupWithEmail = async (email: string, password: string) => {
    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        return userCredential.user;
    } catch (error) {
        console.error('Error during signup:', error);
        throw error;
    }
};

export const loginWithEmail = async (email: string, password: string) => {
    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        return userCredential.user;
    } catch (error) {
        console.error('Error during login:', error);
        throw error;
    }
};

export const logoutUser = async () => {
    try {
        await signOut(auth);
    } catch (error) {
        console.error('Error during logout:', error);
        throw error;
    }
};

// Deliveryman Application Functions
export const createDeliverymanApplication = async (data: any) => {
    try {
        const db = getFirestore();
        const applicationsRef = collection(db, 'deliverymen_applications');
        const newDocRef = doc(applicationsRef);

        await setDoc(newDocRef, {
            ...data,
            id: newDocRef.id,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
        });

        return newDocRef.id;
    } catch (error) {
        console.error('Error creating deliveryman application:', error);
        throw error;
    }
};

export const getDeliverymanByEmail = async (email: string) => {
    try {
        const db = getFirestore();
        const deliverymenRef = collection(db, 'deliverymen');
        const q = query(deliverymenRef, where('email', '==', email));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
            return null;
        }

        return {
            id: querySnapshot.docs[0].id,
            ...querySnapshot.docs[0].data()
        };
    } catch (error) {
        console.error('Error getting deliveryman:', error);
        throw error;
    }
};

// Add this function to get deliveryman details
export const getDeliverymanDetails = async (deliverymanId) => {
    try {
        // Check if deliverymanId is provided
        if (!deliverymanId) {
            console.warn('getDeliverymanDetails called without a deliverymanId');
            return null;
        }

        const db = getFirestore();
        const deliverymanRef = doc(db, 'deliverymen', deliverymanId);
        const docSnap = await getDoc(deliverymanRef);

        if (!docSnap.exists()) {
            console.warn(`No deliveryman found with ID: ${deliverymanId}`);
            return null;
        }

        // Get the data and add the id
        const data = docSnap.data();

        console.log(`Successfully retrieved deliveryman data for ID: ${deliverymanId}`, data);

        return {
            id: docSnap.id,
            ...data
        };
    } catch (error) {
        console.error('Error getting deliveryman details:', error);
        // Return null instead of throwing an error
        return null;
    }
};