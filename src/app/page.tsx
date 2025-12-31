
'use client';
import { useUser } from '@/firebase';
import { redirect } from 'next/navigation';
import { useEffect } from 'react';
import { Loader2 } from 'lucide-react';

export default function RootPage() {
  const { user, loading } = useUser();

  useEffect(() => {
    if (!loading) {
      if (user) {
        if (user.emailVerified) {
          redirect('/dashboard');
        } else {
          redirect('/verify-email');
        }
      } else {
        redirect('/login');
      }
    }
  }, [user, loading]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <Loader2 className="h-12 w-12 animate-spin text-primary" />
    </div>
  );
}
