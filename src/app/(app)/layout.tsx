
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
      <main className="p-4 sm:p-6 lg:p-8">
        <div className="mx-auto max-w-7xl">{children}</div>
      </main>
    </>
  );
}
