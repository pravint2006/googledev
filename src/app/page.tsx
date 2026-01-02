
'use client';

// This component's only job is to render its children.
// The FirebaseProvider wrapping it in the RootLayout will handle all
// authentication checks and redirects. This simplifies the root page
// and avoids any client-side redirect logic here.
export default function RootPage({ children }: { children: React.ReactNode }) {
  // Previously, this component had a useEffect for redirection.
  // That logic is now centralized in FirebaseProvider.
  // It now just acts as a pass-through for what the provider decides to render.
  return <>{children}</>;
}
