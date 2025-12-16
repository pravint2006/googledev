
"use client";

import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { AppLogo } from '@/components/app-logo';
import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { signInWithEmailAndPassword, signInWithRedirect, GoogleAuthProvider } from 'firebase/auth';
import { useAuth } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import { Separator } from './ui/separator';

interface LoginFormProps {
  onSwitchToSignup: () => void;
}

function GoogleIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 48 48" width="1em" height="1em" {...props}>
      <path
        fill="#FFC107"
        d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8c-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039L38.802 8.841C34.553 5.107 29.61 3 24 3C12.955 3 4 11.955 4 23s8.955 20 20 20s20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"
      />
      <path
        fill="#FF3D00"
        d="M6.306 14.691c-1.645 3.119-2.659 6.694-2.659 10.309s1.014 7.19 2.659 10.309l7.707-6.012C12.978 26.861 12 25.013 12 23s.978-3.861 2.013-5.286l-7.707-6.012z"
      />
      <path
        fill="#4CAF50"
        d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238c-2.008 1.32-4.491 2.12-7.219 2.12c-5.216 0-9.618-3.356-11.226-7.96l-7.707 6.012C9.253 38.046 15.97 44 24 44z"
      />
      <path
        fill="#1976D2"
        d="M43.611 20.083L43.594 20H24v8h11.303a12.031 12.031 0 0 1-4.223 5.586l7.219 5.238C42.062 34.522 44 29.174 44 23c0-1.341-.138-2.65-.389-3.917z"
      />
    </svg>
  );
}

export function LoginForm({ onSwitchToSignup }: LoginFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const auth = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [email, setEmail] = useState('admin@gmail.com');
  const [password, setPassword] = useState('password');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth) return;
    setIsLoading(true);

    try {
      await signInWithEmailAndPassword(auth, email, password);
      router.push('/dashboard');
    } catch (error: any) {
       let errorMessage = 'An unknown error occurred.';
        switch (error.code) {
          case 'auth/invalid-credential':
          case 'auth/wrong-password':
          case 'auth/user-not-found':
            errorMessage = 'Invalid email or password.';
            break;
          case 'auth/operation-not-allowed':
             errorMessage = 'Email/Password sign in is not enabled. Please use Google Sign-In.';
             break;
          default:
            errorMessage = error.message;
            break;
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

  const handleGoogleSignIn = async () => {
    if (!auth) return;
    setIsGoogleLoading(true);
    const provider = new GoogleAuthProvider();
    try {
      await signInWithRedirect(auth, provider);
      // The redirect result is handled on the login page after the user returns.
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Google Sign-In Failed',
        description: error instanceof Error ? error.message : 'An unknown error occurred.',
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
        <CardTitle className="font-headline">Welcome Back</CardTitle>
        <CardDescription>Select a method to manage your farms.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button variant="outline" className="w-full" onClick={handleGoogleSignIn} disabled={isGoogleLoading || isLoading}>
          {isGoogleLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <GoogleIcon className="mr-2 h-4 w-4" />}
          Sign in with Google
        </Button>
        <div className="flex items-center gap-4">
            <Separator className="flex-1" />
            <span className="text-xs text-muted-foreground">OR</span>
            <Separator className="flex-1" />
        </div>
        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" placeholder="farmer@example.com" required value={email} onChange={e => setEmail(e.target.value)} disabled={isLoading || isGoogleLoading} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" required value={password} onChange={e => setPassword(e.target.value)} disabled={isLoading || isGoogleLoading} />
          </div>
          <Button type="submit" className="w-full bg-primary hover:bg-primary/90" disabled={isLoading || isGoogleLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isLoading ? 'Logging In...' : 'Log In with Email'}
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
