
'use client';

import Image from 'next/image';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { LoginForm } from '@/components/login-form';
import { SignUpForm } from '@/components/signup-form';
import { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useUser, useAuth, useFirestore } from '@/firebase';
import { Loader2 } from 'lucide-react';
import { getRedirectResult, type AuthError } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';

export default function LoginPage() {
  const bgImage = PlaceHolderImages.find((p) => p.id === 'login-background');
  const [isLoginView, setIsLoginView] = useState(true);
  
  // This hook is used to determine when to show the main loading spinner.
  const { user } = useUser();

  const auth = useAuth();
  const firestore = useFirestore();
  const { toast } = useToast();
  // State to track if we're processing a sign-in redirect from Google.
  const [isProcessingRedirect, setIsProcessingRedirect] = useState(true);

  // This effect handles the result from a Google Sign-In redirect.
  // It runs once on mount to check if the user is returning from Google.
  useEffect(() => {
    // Don't run until Firebase is ready.
    if (!auth || !firestore) return;

    const processRedirect = async () => {
        try {
            const result = await getRedirectResult(auth);
            if (result) {
                // User has successfully signed in via redirect.
                const user = result.user;
                // Path is now correctly set to /users/{uid}
                const userDocRef = doc(firestore, "users", user.uid);
                const userDoc = await getDoc(userDocRef);

                // If the user's document doesn't exist, it's their first time signing in.
                if (!userDoc.exists()) {
                    // Create their profile document in Firestore.
                    const [firstName, ...lastNameParts] = (user.displayName || " ").split(" ");
                    const lastName = lastNameParts.join(' ');
                    await setDoc(userDocRef, {
                        id: user.uid, // Store the UID in the document as well
                        email: user.email,
                        firstName: firstName || '',
                        lastName: lastName || '',
                    });
                     toast({ title: 'Welcome!', description: 'Your account has been created.' });
                }
                // At this point, the user is signed in and has a profile document.
                // The FirebaseProvider will now see the authenticated user and handle
                // the redirect to the /dashboard.
            }
        } catch (error) {
            const authError = error as AuthError;
            // 'auth/no-redirect-results' is an expected code if the page loads without a redirect.
            // We only show a toast notification for actual, unexpected errors.
            if (authError.code !== 'auth/no-redirect-results') {
              toast({
                  variant: 'destructive',
                  title: 'Google Sign-In Failed',
                  description: authError.message || 'An unexpected error occurred during sign-in.',
              });
            }
        } finally {
            // We've finished processing the redirect, successful or not.
            setIsProcessingRedirect(false);
        }
    };
    
    processRedirect();
    // This effect should only run once.
  }, [auth, firestore, toast]);

  // Show a loading spinner if we are still processing a potential Google sign-in
  // OR if the user is already authenticated (and waiting for the provider to redirect them).
  if (isProcessingRedirect || user) {
    return (
       <div className="flex min-h-screen items-center justify-center p-4">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    )
  }

  // If we're done loading and there's no authenticated user, show the login/signup form.
  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      {bgImage && (
        <Image
          src={bgImage.imageUrl}
          alt={bgImage.description}
          fill
          className="object-cover -z-10 brightness-[0.4]"
          data-ai-hint={bgImage.imageHint}
        />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent -z-9" />
      
      <AnimatePresence mode="wait">
        <motion.div
          key={isLoginView ? 'login' : 'signup'}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
          className="w-full max-w-sm"
        >
          {isLoginView ? (
            <LoginForm 
              onSwitchToSignup={() => setIsLoginView(false)} 
            />
          ) : (
            <SignUpForm 
              onSwitchToLogin={() => setIsLoginView(true)} 
            />
          )}
        </motion.div>
      </AnimatePresence>
    </main>
  );
}
