
"use client";

import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AppLogo } from '@/components/app-logo';
import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { 
  signInWithEmailAndPassword, 
  type AuthError, 
  sendPasswordResetEmail, 
  setPersistence, 
  browserSessionPersistence, 
  browserLocalPersistence,
  signInWithRedirect,
  GoogleAuthProvider
} from 'firebase/auth';
import { useAuth } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from './ui/alert-dialog';
import { Checkbox } from './ui/checkbox';
import { Separator } from './ui/separator';

const GoogleIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="24px" height="24px" {...props}>
        <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12s5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24s8.955,20,20,20s20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z" />
        <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z" />
        <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.222,0-9.619-3.317-11.28-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z" />
        <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571l6.19,5.238C42.022,35.244,44,30.036,44,24C44,22.659,43.862,21.35,43.611,20.083z" />
    </svg>
);


interface LoginFormProps {
  onSwitchToSignup: () => void;
}

export function LoginForm({ onSwitchToSignup }: LoginFormProps) {
  const { toast } = useToast();
  const router = useRouter();
  const auth = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [resetEmail, setResetEmail] = useState('');
  const [isResetDialogOpen, setIsResetDialogOpen] = useState(false);

  
  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth) return;
    setIsLoading(true);

    try {
      // Set persistence based on the "Remember me" checkbox
      const persistence = rememberMe ? browserLocalPersistence : browserSessionPersistence;
      await setPersistence(auth, persistence);

      await signInWithEmailAndPassword(auth, email, password);
      // The useUser hook will handle redirecting to the dashboard
    } catch (error) {
      let errorMessage = 'An unknown error occurred.';
      const authError = error as AuthError;
      if (authError.code) {
        switch (authError.code) {
          case 'auth/user-not-found':
            errorMessage = 'This email is not registered. Please sign up.';
            break;
          case 'auth/wrong-password':
          case 'auth/invalid-credential':
            errorMessage = 'Invalid password. Please try again.';
            break;
          case 'auth/invalid-email':
            errorMessage = 'Please enter a valid email address.';
            break;
          default:
            errorMessage = authError.message || 'Login failed. Please try again later.';
        }
      }
      toast({
        variant: 'destructive',
        title: 'Login Failed',
        description: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordReset = async () => {
    if (!auth || !resetEmail) {
        toast({
            variant: "destructive",
            title: "Email Required",
            description: "Please enter your email address to reset your password.",
        });
        return;
    }
    setIsLoading(true);
    try {
        await sendPasswordResetEmail(auth, resetEmail);
        toast({
            title: "Password Reset Email Sent",
            description: `If an account exists for ${resetEmail}, you will receive an email with instructions. Please check your spam folder if you do not see it.`,
        });
        setIsResetDialogOpen(false); // Close dialog on success
    } catch (error) {
        const authError = error as AuthError;
        let errorMessage = "An unknown error occurred. Please try again.";
        if(authError.code === 'auth/invalid-email') {
            errorMessage = "Please enter a valid email address.";
        }
        // We don't reveal if the user exists or not for security reasons.
        // The success message is shown even for non-existent emails.
        toast({
            variant: "destructive",
            title: "Error Sending Email",
            description: errorMessage,
        });
    } finally {
        setIsLoading(false);
    }
  };

  const openResetDialog = () => {
    setResetEmail(email);
    setIsResetDialogOpen(true);
  };
  
  const handleGoogleSignIn = async () => {
    if (!auth) return;
    setIsGoogleLoading(true);
    const provider = new GoogleAuthProvider();
    
    try {
      // Use signInWithRedirect instead of signInWithPopup
      await signInWithRedirect(auth, provider);
      // The user will be redirected to Google's sign-in page.
      // After successful sign-in, they will be redirected back to your app.
      // The logic in signup-form.tsx (via useEffect) and the useUser hook will handle the rest.
    } catch (error) {
      const authError = error as AuthError;
      toast({
        variant: 'destructive',
        title: 'Google Sign-In Failed',
        description: authError.message || 'An unexpected error occurred.',
      });
      setIsGoogleLoading(false); // Only set loading to false on error
    }
  };


  return (
    <>
      <Card className="w-full max-w-sm bg-card/80 backdrop-blur-sm">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4">
            <AppLogo className="text-foreground" />
          </div>
          <CardTitle className="font-headline">Welcome Back</CardTitle>
          <CardDescription>Sign in to manage your farms.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button variant="outline" className="w-full" onClick={handleGoogleSignIn} disabled={isLoading || isGoogleLoading}>
            {isGoogleLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <GoogleIcon className="mr-2" />}
            {isGoogleLoading ? 'Signing in...' : 'Sign In with Google'}
          </Button>

          <div className="flex items-center gap-2 py-2">
            <Separator className="flex-1" />
            <span className="text-xs text-muted-foreground">OR CONTINUE WITH</span>
            <Separator className="flex-1" />
          </div>
          
          <form onSubmit={handleEmailSignIn} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email-login">Email</Label>
              <Input
                id="email-login"
                type="email"
                placeholder="farmer@example.com"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading || isGoogleLoading}
              />
            </div>
            <div className="space-y-2">
                <div className="flex items-center justify-between">
                    <Label htmlFor="password-login">Password</Label>
                    <Button variant="link" size="sm" type="button" className="p-0 h-auto text-xs" onClick={openResetDialog}>
                        Forgot password?
                    </Button>
                </div>
              <Input
                id="password-login"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading || isGoogleLoading}
              />
            </div>
            <div className="flex items-center space-x-2">
                <Checkbox 
                    id="remember-me" 
                    checked={rememberMe}
                    onCheckedChange={(checked) => setRememberMe(checked as boolean)}
                />
                <label
                    htmlFor="remember-me"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                    Remember me
                </label>
            </div>
            <Button
              type="submit"
              className="w-full bg-primary hover:bg-primary/90"
              disabled={isLoading || isGoogleLoading}
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isLoading ? 'Signing In...' : 'Sign In'}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex-col gap-4">
          <p className="text-xs text-muted-foreground">
            Don't have an account?{' '}
            <Button variant="link" size="sm" className="p-0 h-auto" type="button" onClick={onSwitchToSignup}>
              Sign up
            </Button>
          </p>
        </CardFooter>
      </Card>
      
      {/* Password Reset Dialog */}
      <AlertDialog open={isResetDialogOpen} onOpenChange={setIsResetDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reset Password</AlertDialogTitle>
            <AlertDialogDescription>
              Enter your email address below. We'll send you a link to reset your password.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-2 py-2">
            <Label htmlFor="reset-email">Email Address</Label>
            <Input
              id="reset-email"
              type="email"
              placeholder="you@example.com"
              value={resetEmail}
              onChange={(e) => setResetEmail(e.target.value)}
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handlePasswordReset} disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Send Reset Link
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
