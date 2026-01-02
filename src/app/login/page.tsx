
'use client';

import Image from 'next/image';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { LoginForm } from '@/components/login-form';
import { SignUpForm } from '@/components/signup-form';
import { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useUser, useAuth, useFirestore } from '@/firebase';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { getRedirectResult, type AuthError } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';

export default function LoginPage() {
  const bgImage = PlaceHolderImages.find((p) => p.id === 'login-background');
  const [isLoginView, setIsLoginView] = useState(true);
  const { user, loading: userLoading } = useUser();
  const router = useRouter();
  const auth = useAuth();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [isGoogleLoading, setIsGoogleLoading] = useState(true); // Start true to handle initial redirect check


  // This effect handles the result from a Google Sign-In redirect
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
                // Existing users will be handled by the main redirect logic below.
            }
        } catch (error) {
            const authError = error as AuthError;
            // A 'no-redirect-results' error is expected if the page is loaded without a redirect.
            if (authError.code !== 'auth/no-redirect-results') {
              toast({
                  variant: 'destructive',
                  title: 'Google Sign-In Failed',
                  description: authError.message || 'An unexpected error occurred.',
              });
            }
        } finally {
            setIsGoogleLoading(false); // We're done processing the redirect
        }
    };
    
    processRedirect();
  }, [auth, firestore, toast]);


  useEffect(() => {
    // Wait until both user loading and Google redirect processing are complete
    if (userLoading || isGoogleLoading) return;

    if (user) {
      if (user.emailVerified) {
        router.push('/dashboard');
      } else {
        // This handles email signups that need verification.
        // Google signups are always verified.
        router.push('/verify-email');
      }
    }
  }, [user, userLoading, isGoogleLoading, router]);
  
  // Show a loading spinner while auth state is being determined or a redirect is processed
  if (userLoading || isGoogleLoading || user) {
    return (
       <main className="flex min-h-screen items-center justify-center p-4">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </main>
    )
  }

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
              isGoogleLoading={isGoogleLoading}
              setIsGoogleLoading={setIsGoogleLoading}
            />
          ) : (
            <SignUpForm 
              onSwitchToLogin={() => setIsLoginView(true)} 
              isGoogleLoading={isGoogleLoading}
              setIsGoogleLoading={setIsGoogleLoading}
            />
          )}
        </motion.div>
      </AnimatePresence>
    </main>
  );
}
