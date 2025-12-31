
"use client";

import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AppLogo } from '@/components/app-logo';
import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { useAuth } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Separator } from './ui/separator';

interface LoginFormProps {
  onSwitchToSignup: () => void;
}

export function LoginForm({ onSwitchToSignup }: LoginFormProps) {
  const { toast } = useToast();
  const router = useRouter();
  const auth = useAuth();
  const [isEmailLoading, setIsEmailLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth) return;
    setIsEmailLoading(true);

    try {
      await signInWithEmailAndPassword(auth, email, password);
      router.push('/dashboard');
    } catch (error) {
      let errorMessage = 'An unknown error occurred.';
      if (error instanceof Error && (error as any).code) {
        switch ((error as any).code) {
          case 'auth/user-not-found':
          case 'auth/wrong-password':
          case 'auth/invalid-credential':
            errorMessage = 'Invalid email or password. Please try again.';
            break;
          case 'auth/invalid-email':
            errorMessage = 'Please enter a valid email address.';
            break;
          default:
            errorMessage = 'Login failed. Please try again later.';
        }
      }
      toast({
        variant: 'destructive',
        title: 'Login Failed',
        description: errorMessage,
      });
    } finally {
      setIsEmailLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    if (!auth) return;
    setIsGoogleLoading(true);
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      router.push('/dashboard');
    } catch (error) {
       toast({
        variant: 'destructive',
        title: 'Google Sign-In Failed',
        description: 'Could not sign in with Google. Please try again.',
      });
    } finally {
      setIsGoogleLoading(false);
    }
  };


  return (
    <Card className="w-full max-w-sm bg-card/80 backdrop-blur-sm">
      <CardHeader className="text-center">
        <div className="mx-auto mb-4">
          <AppLogo className="text-foreground" />
        </div>
        <CardTitle className="font-headline">Welcome Back</CardTitle>
        <CardDescription>Sign in to manage your farms.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button
          variant="outline"
          className="w-full"
          onClick={handleGoogleSignIn}
          disabled={isGoogleLoading || isEmailLoading}
        >
          {isGoogleLoading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <svg
              className="mr-2 h-4 w-4"
              aria-hidden="true"
              focusable="false"
              data-prefix="fab"
              data-icon="google"
              role="img"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 488 512"
            >
              <path
                fill="currentColor"
                d="M488 261.8C488 403.3 381.7 512 244 512 109.8 512 0 402.2 0 261.8S109.8 11.6 244 11.6C303.6 11.6 354.9 33.3 391.1 65.6l-54.3 50.8C302.1 82.7 274.2 68.1 244 68.1c-106.1 0-192.2 86.1-192.2 192.1s86.1 192.1 192.2 192.1c121.2 0 167.3-89.4 172.9-136.5H244V261.8h244z"
              ></path>
            </svg>
          )}
          Sign in with Google
        </Button>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-card px-2 text-muted-foreground">
              Or continue with
            </span>
          </div>
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
              disabled={isEmailLoading || isGoogleLoading}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password-login">Password</Label>
            <Input
              id="password-login"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isEmailLoading || isGoogleLoading}
            />
          </div>
          <Button
            type="submit"
            className="w-full bg-primary hover:bg-primary/90"
            disabled={isEmailLoading || isGoogleLoading}
          >
            {isEmailLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isEmailLoading ? 'Signing In...' : 'Sign In'}
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
  );
}
