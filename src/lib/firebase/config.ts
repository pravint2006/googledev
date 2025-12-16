import { initializeApp, getApps, getApp, type FirebaseOptions } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig: FirebaseOptions = {
  apiKey: 'YOUR_API_KEY_HERE',
  authDomain: 'YOUR_AUTH_DOMAIN_HERE',
  projectId: 'YOUR_PROJECT_ID_HERE',
  storageBucket: 'YOUR_STORAGE_BUCKET_HERE',
  messagingSenderId: 'YOUR_MESSAGING_SENDER_ID_HERE',
  appId: 'YOUR_APP_ID_HERE',
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);

export { app, auth, db };
