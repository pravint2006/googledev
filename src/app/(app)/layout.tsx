
'use client';

// This layout is now greatly simplified.
// The FirebaseProvider will handle all authentication checks and redirects.
// If a user is not authenticated, the provider will redirect them to /login
// before this component even renders.

import Header from '@/components/header';

export default function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // No more useUser, useEffect, or loading spinners here.
  // The provider handles it all.
  return (
    <>
      <Header />
      <main className="w-full">
        <div className="px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          {children}
        </div>
      </main>
    </>
  );
}

