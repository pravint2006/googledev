
'use client';

import { getApps, initializeApp, type FirebaseOptions } from 'firebase/app';
import { getAuth } from 'firebase/auth';

// This is the complete and correct Firebase configuration.
export const firebaseConfig: FirebaseOptions = {
  projectId: 'studio-9781884869-4d982',
  appId: '1:325810737238:web:e3460f5bf36cdf10f2ebf7',
  apiKey: 'AIzaSyAsX9NgE2I_DKnfKXDl3k75GH4L2dLgRFg',
  authDomain: 'studio-9781884869-4d982.firebaseapp.com',
  storageBucket: 'studio-9781884869-4d982.appspot.com',
  messagingSenderId: '325810737238',
};

// A single function to initialize and return all Firebase services.
export const initializeFirebase = () => {
  const app =
    getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
  const auth = getAuth(app);
  // Firestore is no longer used, so we don't initialize it.
  return { app, auth };
};

// Export the necessary hooks and providers for use in the application.
export { type User, useUser } from '@/firebase/auth/use-user';
export {
  FirebaseProvider,
  useFirebase,
  useFirebaseApp,
  useAuth,
} from '@/firebase/provider';
export { FirebaseClientProvider } from '@/firebase/client-provider';
