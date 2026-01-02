
'use client';
import { useUser } from '@/firebase';
import { redirect } from 'next/navigation';
import { useEffect } from 'react';
import { Loader2 } from 'lucide-react';

export default function RootPage() {
  const { user, loading } = useUser();

  useEffect(() => {
    if (loading) {
      // While loading, do nothing and show the spinner.
      return;
    }

    if (user) {
      // If loading is finished and we have a user...
      if (user.emailVerified) {
        // ...and they are verified, go to the dashboard.
        redirect('/dashboard');
      } else {
        // ...but not verified, go to the verification page.
        redirect('/verify-email');
      }
    } else {
      // If loading is finished and there's no user, go to login.
      redirect('/login');
    }
  }, [user, loading]);

  // This is the default state shown while the useEffect hook decides where to go.
  return (
    <div className="flex items-center justify-center min-h-screen">
      <Loader2 className="h-12 w-12 animate-spin text-primary" />
    </div>
  );
}
