
'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Header from '@/components/header';
import { useUser } from '@/firebase';
import { Loader2 } from 'lucide-react';

export default function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { user, loading } = useUser();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (loading) return; // Wait until user status is determined

    if (!user) {
      // If not logged in, redirect to the login page
      router.push('/login');
      return;
    }

    // This logic is not perfect for all edge cases but will be refactored later if needed.
    // For now, it handles the primary case of email verification.
    if (user && !user.emailVerified && pathname !== '/verify-email') {
      // If logged in but email is not verified, redirect to the verify-email page
      router.push('/verify-email');
      return;
    }

  }, [user, loading, router, pathname]);

  // Show a loading spinner while checking auth state.
  // We also show a spinner if the user exists but their email isn't verified yet,
  // as the effect above will be handling the redirect.
  if (loading || !user || (user && !user.emailVerified) ) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <>
      <Header />
      <main className="p-4 sm:p-6 lg:p-8">
        <div className="mx-auto max-w-7xl">{children}</div>
      </main>
    </>
  );
}
