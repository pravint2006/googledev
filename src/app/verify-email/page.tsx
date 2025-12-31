
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser, useAuth } from '@/firebase';
import { signOut, sendEmailVerification } from 'firebase/auth';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, MailCheck, LogOut } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { AppLogo } from '@/components/app-logo';

export default function VerifyEmailPage() {
  const { user, loading } = useUser();
  const auth = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.push('/login');
    } else if (user.emailVerified) {
      router.push('/dashboard');
    }
  }, [user, loading, router]);

  const handleResendVerification = async () => {
    if (!user) return;
    setIsSending(true);
    try {
      await sendEmailVerification(user);
      toast({
        title: 'Verification Email Sent',
        description: "We've sent a new verification link to your email address. Please check your inbox and spam folder.",
      });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error Sending Email',
        description: 'There was a problem sending the verification email. Please try again later.',
      });
    } finally {
      setIsSending(false);
    }
  };

  const handleLogout = async () => {
    if (auth) {
      await signOut(auth);
      router.push('/login');
    }
  };

  if (loading || !user || user.emailVerified) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <div className="mx-auto mb-4">
            <AppLogo />
          </div>
          <CardTitle className="font-headline">Verify Your Email</CardTitle>
          <CardDescription>
            We've sent a verification link to <span className="font-semibold text-foreground">{user.email}</span>.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-center">
            <MailCheck className="w-16 h-16 text-primary" />
          </div>
          <p className="text-muted-foreground">
            Please click the link in the email to activate your account. You may need to check your spam folder.
          </p>
          <Button onClick={handleResendVerification} disabled={isSending} className="w-full">
            {isSending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            {isSending ? 'Sending...' : 'Resend Verification Email'}
          </Button>
        </CardContent>
        <CardFooter className="flex-col gap-4 border-t pt-6">
          <p className="text-xs text-muted-foreground">
            Wrong account? You can sign out and try again.
          </p>
          <Button variant="outline" onClick={handleLogout} className="w-full">
            <LogOut className="mr-2 h-4 w-4" />
            Sign Out
          </Button>
        </CardFooter>
      </Card>
    </main>
  );
}
