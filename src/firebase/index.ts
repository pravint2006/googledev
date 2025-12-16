
import { getApps, initializeApp, type FirebaseOptions } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

export const firebaseConfig: FirebaseOptions = {
  projectId: "studio-9781884869-4d982",
  appId: "1:325810737238:web:e3460f5bf36cdf10f2ebf7",
  apiKey: "AIzaSyAsX9NgE2I_DKnfKXDl3k75GH4L2dLgRFg",
  authDomain: "studio-9781884869-4d982.firebaseapp.com",
  messagingSenderId: "325810737238",
  storageBucket: "studio-9781884869-4d982.appspot.com"
};

export const initializeFirebase = () => {
  const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
  const auth = getAuth(app);
  const firestore = getFirestore(app);
  return { app, auth, firestore };
};

export {
  useUser,
  type User,
} from '@/firebase/auth/use-user';
export { FirebaseProvider, useFirebase, useFirebaseApp, useAuth, useFirestore } from '@/firebase/provider';
export { FirebaseClientProvider } from '@/firebase/client-provider';
