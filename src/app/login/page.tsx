
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
  
  // We still use useUser here to show a loading spinner while redirecting.
  const { user } = useUser();

  const auth = useAuth();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [isProcessingRedirect, setIsProcessingRedirect] = useState(true);

  // This effect handles the result from a Google Sign-In redirect.
  // It runs once on component mount.
  useEffect(() => {
    if (!auth || !firestore) return;

    const processRedirect = async () => {
        try {
            const result = await getRedirectResult(auth);
            if (result) {
                // User has successfully signed in via redirect.
                const user = result.user;
                const userDocRef = doc(firestore, "users", user.uid);
                const userDoc = await getDoc(userDocRef);

                if (!userDoc.exists()) {
                    // This is a new user, create their profile document
                    const [firstName, ...lastName] = (user.displayName || "").split(" ");
                    await setDoc(userDocRef, {
                        id: user.uid,
                        email: user.email,
                        firstName: firstName || '',
                        lastName: lastName.join(' ') || '',
                    });
                     toast({ title: 'Welcome!', description: 'Your account has been created.' });
                }
                // The FirebaseProvider will now handle the redirect to /dashboard
            }
        } catch (error) {
            const authError = error as AuthError;
            // 'auth/no-redirect-results' is expected if the page loads without a redirect action.
            // We only show a toast for actual errors.
            if (authError.code !== 'auth/no-redirect-results') {
              toast({
                  variant: 'destructive',
                  title: 'Google Sign-In Failed',
                  description: authError.message || 'An unexpected error occurred during sign-in.',
              });
            }
        } finally {
            // Finished processing, whether successful or not.
            setIsProcessingRedirect(false);
        }
    };
    
    processRedirect();
  }, [auth, firestore, toast]);

  // The loading screen is shown if we are processing a potential sign-in redirect
  // or if the user is already logged in (as the FirebaseProvider will be handling the redirect).
  if (isProcessingRedirect || user) {
    return (
       <div className="flex min-h-screen items-center justify-center p-4">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    )
  }

  // If we're done loading and there's no user, show the login/signup form.
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
