
'use client';

import { Loader2 } from 'lucide-react';

export default function RootPage() {
  // This page is the entry point. It defers all routing decisions to the 
  // FirebaseProvider by simply showing a loading spinner. The provider will 
  // determine if the user is logged in and redirect them to either /login 
  // or /dashboard accordingly. This prevents any client-side routing loops.
  return (
    <div className="flex items-center justify-center min-h-screen">
      <Loader2 className="h-12 w-12 animate-spin text-primary" />
    </div>
  );
}
