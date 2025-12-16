
'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Header from '@/components/header';
import { useAuth } from '@/hooks/use-auth.tsx';
import { Loader2 } from 'lucide-react';

export default function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // This condition allows access for the temporary admin user even without a real auth object
    if (!loading && !user && pathname !== '/login') {
       if (sessionStorage.getItem('dev-admin-login') !== 'true') {
         router.push('/login');
       }
    }
  }, [user, loading, router, pathname]);

  // A check to see if the user is a temporary admin user.
  const isDevAdmin = !user && sessionStorage.getItem('dev-admin-login') === 'true';

  if (loading && !isDevAdmin) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  // If there's no user and it's not the dev admin, show loader until redirect happens.
  if (!user && !isDevAdmin) {
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
