
'use client';

import { useMemo } from 'react';
import { useUser, useFirestore, useDoc } from '@/firebase';
import { doc, updateDoc, setDoc, DocumentReference } from 'firebase/firestore';
import { useToast } from './use-toast';

// Define the shape of the location data we will store
export interface WeatherLocation {
  latitude?: number;
  longitude?: number;
  city?: string;
  location?: string;
  pincode?: string;
}

// Define the shape of the user profile document in Firestore
export interface UserProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  lastWeatherLocation?: WeatherLocation;
}

/**
 * A hook to manage a user's profile data stored in Firestore.
 * It provides the profile data and a function to update it.
 */
export function useUserProfile() {
  const { user, loading: isUserLoading } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();

  // Create a memoized reference to the user's document in Firestore.
  // This ensures the path is always correct and stable.
  const userDocRef = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    // The path now strictly follows /users/{uid}
    return doc(firestore, 'users', user.uid) as DocumentReference<UserProfile>;
  }, [user, firestore]);

  // Use the useDoc hook to get real-time updates for the user profile.
  const { data: userProfile, isLoading: isProfileLoading, error } = useDoc<UserProfile>(userDocRef);

  /**
   * Updates the user's profile document in Firestore.
   * Can create the document if it doesn't exist.
   * @param data - The partial profile data to update.
   */
  const updateUserProfile = async (data: Partial<UserProfile>) => {
    // This check is crucial. No operation runs if the user/docRef is not ready.
    if (!userDocRef) {
      console.warn('User profile update skipped: user not authenticated or Firestore not ready.');
      return;
    }

    try {
      // Use setDoc with merge to safely update or create the document.
      await setDoc(userDocRef, data, { merge: true });
    } catch (e) {
      console.error('Error updating user profile:', e);
      // We don't emit a permission error here because it's handled by the global listener,
      // but we can still show a generic toast for other potential issues.
      toast({
        variant: 'destructive',
        title: 'Profile Update Failed',
        description: 'Could not save profile changes.',
      });
    }
  };
  
  if (error) {
    console.error("Error fetching user profile:", error);
    // The global FirebaseErrorListener will catch and display permission errors.
  }

  return {
    userProfile,
    updateUserProfile,
    isLoading: isUserLoading || isProfileLoading,
  };
}
