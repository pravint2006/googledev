
'use client';

import { Loader2 } from 'lucide-react';

export default function RootPage() {
  // All routing logic is now handled by the FirebaseProvider.
  // This page just shows a loading spinner until the provider
  // decides where to send the user.
  return (
    <div className="flex items-center justify-center min-h-screen">
      <Loader2 className="h-12 w-12 animate-spin text-primary" />
    </div>
  );
}
