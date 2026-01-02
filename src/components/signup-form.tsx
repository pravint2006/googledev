
'use client';

import { useRouter } from 'next/navigation';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { AppLogo } from '@/components/app-logo';
import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { 
  createUserWithEmailAndPassword, 
  updateProfile, 
  type AuthError, 
  sendEmailVerification,
  signInWithRedirect,
  GoogleAuthProvider,
  getRedirectResult,
} from 'firebase/auth';
import { useAuth, useFirestore } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { Separator } from './ui/separator';

const GoogleIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="24px" height="24px" {...props}>
        <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12s5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24s8.955,20,20,20s20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z" />
        <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z" />
        <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.222,0-9.619-3.317-11.28-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z" />
        <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571l6.19,5.238C42.022,35.244,44,30.036,44,24C44,22.659,43.862,21.35,43.611,20.083z" />
    </svg>
);

interface SignUpFormProps {
  onSwitchToLogin: () => void;
}

export function SignUpForm({ onSwitchToLogin }: SignUpFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const auth = useAuth();
  const firestore = useFirestore();
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');

  // Handle redirect result
  useEffect(() => {
    if (!auth || !firestore) return;
    
    // Set loading true when the component mounts to handle the redirect check
    setIsGoogleLoading(true);

    const processRedirect = async () => {
        try {
            const result = await getRedirectResult(auth);
            if (result) {
                // User signed in.
                const user = result.user;
                const userDocRef = doc(firestore, "users", user.uid);
                const userDoc = await getDoc(userDocRef);

                if (!userDoc.exists()) {
                    // New user, create their document
                    const [firstName, ...lastName] = (user.displayName || "").split(" ");
                    await setDoc(userDocRef, {
                        id: user.uid,
                        email: user.email,
                        firstName: firstName || '',
                        lastName: lastName.join(' ') || '',
                    });
                }
                
                // Redirect logic is handled by the main layout/page now.
                // The useUser hook will pick up the signed-in state.
            }
        } catch (error) {
            const authError = error as AuthError;
            // Don't show toast for "no-redirect-results"
            if (authError.code !== 'auth/no-redirect-results') {
              toast({
                  variant: 'destructive',
                  title: 'Google Sign-In Failed',
                  description: authError.message || 'An unexpected error occurred during redirect.',
              });
            }
        } finally {
            setIsGoogleLoading(false); // Stop loading indicator
        }
    };
    
    processRedirect();
  }, [auth, firestore, toast]);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth || !firestore) return;
    setIsLoading(true);

    if (password.length < 6) {
        toast({
            variant: 'destructive',
            title: 'Sign Up Failed',
            description: 'Password must be at least 6 characters long.',
        });
        setIsLoading(false);
        return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );

      if (userCredential.user) {
        const user = userCredential.user;
        const [firstName, ...lastName] = displayName.split(' ');
        
        // 1. Update auth profile
        await updateProfile(user, {
          displayName: displayName,
        });

        // 2. Create user document in Firestore
        const userDocRef = doc(firestore, 'users', user.uid);
        await setDoc(userDocRef, {
          id: user.uid,
          email: user.email,
          firstName: firstName || '',
          lastName: lastName.join(' ') || '',
        });
        
        // 3. Send verification email
        await sendEmailVerification(user);
      }
      
      toast({
        title: 'Account Created!',
        description: "We've sent a verification link to your email address.",
      });
      // Redirect to the verification page instead of the dashboard
      router.push('/verify-email');
    } catch (error) {
      let errorMessage = 'An unknown error occurred.';
      const authError = error as AuthError;
      if (authError.code) {
        switch (authError.code) {
          case 'auth/email-already-in-use':
            errorMessage =
              'This email is already in use. Please try another one.';
            break;
          case 'auth/invalid-email':
            errorMessage = 'Please enter a valid email address.';
            break;
          case 'auth/weak-password':
            errorMessage = 'The password is too weak. Please use a stronger one.';
            break;
          case 'auth/operation-not-allowed':
             errorMessage = 'Email/Password sign up is not enabled.';
             break;
          default:
            errorMessage = authError.message || 'Failed to sign up. Please try again later.';
            break;
        }
      }
      toast({
        variant: 'destructive',
        title: 'Sign Up Failed',
        description: errorMessage,
      });
    } finally {
        setIsLoading(false);
    }
  };

  const handleGoogleSignUp = async () => {
    if (!auth || !firestore) return;
    setIsGoogleLoading(true);
    const provider = new GoogleAuthProvider();

    try {
        // This will redirect the user to Google's sign-in page
        await signInWithRedirect(auth, provider);
    } catch (error) {
      const authError = error as AuthError;
      toast({
        variant: 'destructive',
        title: 'Google Sign-Up Failed',
        description: authError.message || 'An unexpected error occurred.',
      });
      setIsGoogleLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-sm bg-card/80 backdrop-blur-sm">
      <CardHeader className="text-center">
        <div className="mx-auto mb-4">
          <AppLogo className="text-foreground" />
        </div>
        <CardTitle className="font-headline">Create an Account</CardTitle>
        <CardDescription>
          Join and start managing your farm today.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button variant="outline" className="w-full" onClick={handleGoogleSignUp} disabled={isLoading || isGoogleLoading}>
          {isGoogleLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <GoogleIcon className="mr-2" />}
          {isGoogleLoading ? 'Signing in...' : 'Sign Up with Google'}
        </Button>

        <div className="flex items-center gap-2 py-2">
          <Separator className="flex-1" />
          <span className="text-xs text-muted-foreground">OR CONTINUE WITH</span>
          <Separator className="flex-1" />
        </div>

        <form onSubmit={handleSignUp} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="displayName">Full Name</Label>
            <Input
              id="displayName"
              type="text"
              placeholder="John Doe"
              required
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              disabled={isLoading || isGoogleLoading}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email-signup">Email</Label>
            <Input
              id="email-signup"
              type="email"
              placeholder="farmer@example.com"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading || isGoogleLoading}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password-signup">Password</Label>
            <Input
              id="password-signup"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading || isGoogleLoading}
            />
          </div>
          <Button
            type="submit"
            className="w-full bg-primary hover:bg-primary/90"
            disabled={isLoading || isGoogleLoading}
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isLoading ? 'Creating Account...' : 'Sign Up'}
          </Button>
        </form>
      </CardContent>
      <CardFooter className="flex-col gap-4">
        <p className="text-xs text-muted-foreground">
          Already have an account?{' '}
          <Button variant="link" size="sm" className="p-0 h-auto" type="button" onClick={onSwitchToLogin}>
            Log in
          </Button>
        </p>
      </CardFooter>
    </Card>
  );
}
