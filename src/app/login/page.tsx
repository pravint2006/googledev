
'use client';

import Image from 'next/image';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { LoginForm } from '@/components/login-form';
import { SignUpForm } from '@/components/signup-form';
import { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useUser, useAuth, useFirestore } from '@/firebase';
import { Loader2 } from 'lucide-react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';

export default function LoginPage() {
  const bgImage = PlaceHolderImages.find((p) => p.id === 'login-background');
  const [isLoginView, setIsLoginView] = useState(true);
  
  // This hook is used to determine when to show the main loading spinner.
  const { user, loading: isUserLoading } = useUser();

  const auth = useAuth();
  const firestore = useFirestore();
  const { toast } = useToast();
  
  // State to track if we're processing user profile creation
  const [isProcessingProfile, setIsProcessingProfile] = useState(false);

  // This effect handles creating the user profile in Firestore when a new user signs in
  useEffect(() => {
    if (!user || !firestore || isProcessingProfile) return;

    const createUserProfile = async () => {
      try {
        setIsProcessingProfile(true);
        console.log('[Login] Creating user profile for:', user.email);
        
        const userDocRef = doc(firestore, "users", user.uid);
        const userDoc = await getDoc(userDocRef);

        // If the user's document doesn't exist, it's their first time signing in.
        if (!userDoc.exists()) {
          console.log('[Login] New user detected, creating profile...');
          
          // Create their profile document in Firestore.
          const [firstName, ...lastNameParts] = (user.displayName || " ").split(" ");
          const lastName = lastNameParts.join(' ');
          
          await setDoc(userDocRef, {
            id: user.uid,
            email: user.email,
            firstName: firstName || '',
            lastName: lastName || '',
            createdAt: new Date(),
            isProfileComplete: false, // Mark as incomplete - user needs to fill preferences
          });
          
          console.log('[Login] User profile created successfully');
          toast({ 
            title: 'Welcome!', 
            description: 'Your account has been created.' 
          });
        } else {
          console.log('[Login] Existing user logged in');
        }
      } catch (error: any) {
        console.error('[Login] Error creating user profile:', error);
        toast({
          variant: 'destructive',
          title: 'Profile Error',
          description: error.message || 'Failed to create user profile.',
        });
      } finally {
        setIsProcessingProfile(false);
      }
    };

    createUserProfile();
  }, [user, firestore, toast, isProcessingProfile]);

  // Show loading spinner while processing auth state or profile creation
  if (isUserLoading || isProcessingProfile || user) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
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
