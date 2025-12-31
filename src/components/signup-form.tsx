
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
import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { createUserWithEmailAndPassword, updateProfile, type AuthError, sendEmailVerification } from 'firebase/auth';
import { useAuth } from '@/firebase';
import { useToast } from '@/hooks/use-toast';

interface SignUpFormProps {
  onSwitchToLogin: () => void;
}

export function SignUpForm({ onSwitchToLogin }: SignUpFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const auth = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth) return;
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
        await updateProfile(userCredential.user, {
          displayName: displayName,
        });
        await sendEmailVerification(userCredential.user);
      }
      toast({
        title: 'Account Created! Please Verify Your Email.',
        description: "We've sent a verification link to your email address. Please check your inbox and spam folder.",
      });
      router.push('/dashboard');
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
              disabled={isLoading}
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
              disabled={isLoading}
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
              disabled={isLoading}
            />
          </div>
          <Button
            type="submit"
            className="w-full bg-primary hover:bg-primary/90"
            disabled={isLoading}
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
