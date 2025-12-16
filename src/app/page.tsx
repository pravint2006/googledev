'use client';
import { useAuth } from '@/hooks/use-auth.tsx';
import { redirect } from 'next/navigation';
import { useEffect } from 'react';

export default function RootPage() {
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading) {
      if (user) {
        redirect('/dashboard');
      } else {
        redirect('/login');
      }
    }
  }, [user, loading]);

  return null;
}
