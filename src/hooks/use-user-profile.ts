
'use client';

import { useMemo } from 'react';
import { useUser, useFirestore, useDoc, type User } from '@/firebase';
import { doc, updateDoc, setDoc, getDoc, DocumentReference } from 'firebase/firestore';
import { useToast } from './use-toast';
import { type WeatherInput } from '@/ai/flows/weather-flow';

// Define the shape of the user profile document in Firestore
export interface UserProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  lastWeatherLocation?: WeatherInput;
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
  // This prevents re-creating the reference on every render.
  const userDocRef = useMemo(() => {
    if (!user || !firestore) return null;
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
    if (!userDocRef) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'User is not authenticated.',
      });
      return;
    }

    try {
      // Use updateDoc with merge: true to update or create the document.
      await setDoc(userDocRef, data, { merge: true });
    } catch (e) {
      console.error('Error updating user profile:', e);
      toast({
        variant: 'destructive',
        title: 'Profile Update Failed',
        description: 'Could not save profile changes.',
      });
    }
  };
  
    // Handle potential errors from fetching the document.
  if (error) {
    console.error("Error fetching user profile:", error);
    // You could optionally show a toast here, but it might be noisy.
  }

  return {
    userProfile,
    updateUserProfile,
    isLoading: isUserLoading || isProfileLoading,
  };
}
