import { initializeApp, getApps, getApp, type FirebaseOptions } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig: FirebaseOptions = {
  apiKey: "AIzaSyAsX9NgE2I_DKnfKXDl3k75GH4L2dLgRFg",
  authDomain: "studio-9781884869-4d982.firebaseapp.com",
  projectId: "studio-9781884869-4d982",
  storageBucket: "studio-9781884869-4d982.appspot.com",
  messagingSenderId: "325810737238",
  appId: "1:325810737238:web:e3460f5bf36cdf10f2ebf7",
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);

export { app, auth, db };
