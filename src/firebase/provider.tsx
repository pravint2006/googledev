
'use client';

import React, { DependencyList, createContext, useContext, ReactNode, useMemo, useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { FirebaseApp } from 'firebase/app';
import { Firestore } from 'firebase/firestore';
import { Auth, User, onAuthStateChanged } from 'firebase/auth';
import { FirebaseErrorListener } from '@/components/FirebaseErrorListener';
import { Loader2 } from 'lucide-react';

interface FirebaseProviderProps {
  children: ReactNode;
  firebaseApp: FirebaseApp;
  firestore: Firestore;
  auth: Auth;
}

export interface FirebaseContextState {
  firebaseApp: FirebaseApp | null;
  firestore: Firestore | null;
  auth: Auth | null;
  user: User | null;
  isUserLoading: boolean;
}

export const FirebaseContext = createContext<FirebaseContextState | undefined>(undefined);

// Define which paths are considered "public" and don't require authentication.
const PUBLIC_PATHS = ['/login', '/signup', '/verify-email']; // Add any other public paths here

/**
 * Provides Firebase services and manages user authentication state and routing logic.
 */
export const FirebaseProvider: React.FC<FirebaseProviderProps> = ({
  children,
  firebaseApp,
  firestore,
  auth,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [isUserLoading, setIsUserLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setIsUserLoading(false);
    });
    return () => unsubscribe(); // Cleanup on unmount
  }, [auth]);

  useEffect(() => {
    if (isUserLoading) return; // Don't do anything until auth state is resolved

    const isPublicPath = PUBLIC_PATHS.some(path => pathname.startsWith(path));

    if (user) {
      // USER IS LOGGED IN
      if (!user.emailVerified && user.providerData.some(p => p.providerId === 'password')) {
         if (pathname !== '/verify-email') {
          router.push('/verify-email');
        }
      } else if (isPublicPath || pathname === '/') {
        // If logged-in & verified user is on a public page or root, send to dashboard.
        router.push('/dashboard');
      }
    } else {
      // NO USER LOGGED IN
      if (!isPublicPath) {
        // If trying to access a protected route, redirect to login.
        router.push('/login');
      }
    }
  }, [user, isUserLoading, pathname, router]);


  const contextValue = useMemo((): FirebaseContextState => ({
    firebaseApp,
    firestore,
    auth,
    user,
    isUserLoading,
  }), [firebaseApp, firestore, auth, user, isUserLoading]);

  // Determine if the content should be rendered.
  // We render if:
  // 1. We are still loading the auth state (which shows a global spinner).
  // 2. The user is authenticated.
  // 3. The user is not authenticated, but is on a public path.
  const isPublicPath = PUBLIC_PATHS.some(path => pathname.startsWith(path));
  const canRenderContent = isUserLoading || user || isPublicPath;


  if (!canRenderContent) {
    // If none of the conditions are met (e.g. unauthenticated user on protected route),
    // we show a spinner while the redirect from the useEffect above is happening.
    return (
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
    );
  }

  return (
    <FirebaseContext.Provider value={contextValue}>
      <FirebaseErrorListener />
      {children}
    </FirebaseContext.Provider>
  );
};

/**
 * Hook to access core Firebase services and user authentication state.
 */
export const useFirebase = (): FirebaseContextState => {
  const context = useContext(FirebaseContext);
  if (context === undefined) {
    throw new Error('useFirebase must be used within a FirebaseProvider.');
  }
  return context;
};

/** Hook to access Firebase Auth instance. */
export const useAuth = (): Auth => {
  const { auth } = useFirebase();
  if (!auth) throw new Error("Auth service not available.");
  return auth;
};

/** Hook to access Firestore instance. */
export const useFirestore = (): Firestore => {
  const { firestore } = useFirebase();
  if (!firestore) throw new Error("Firestore service not available.");
  return firestore;
};

/** Hook to access Firebase App instance. */
export const useFirebaseApp = (): FirebaseApp => {
  const { firebaseApp } = useFirebase();
  if (!firebaseApp) throw new Error("FirebaseApp not available.");
  return firebaseApp;
};

type MemoFirebase <T> = T & {__memo?: boolean};

export function useMemoFirebase<T>(factory: () => T, deps: DependencyList): T | (MemoFirebase<T>) {
  const memoized = useMemo(factory, deps);
  
  if(typeof memoized !== 'object' || memoized === null) return memoized;
  (memoized as MemoFirebase<T>).__memo = true;
  
  return memoized;
}
