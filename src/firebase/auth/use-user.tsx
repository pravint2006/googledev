
'use client';
import { useFirebase } from '@/firebase/provider';
import type { User } from 'firebase/auth';

export { type User } from 'firebase/auth';

// This hook now simply exposes the user state from the central FirebaseProvider context.
// All the onAuthStateChanged logic is handled in the provider itself.
export function useUser() {
  const { user, isUserLoading: loading } = useFirebase();

  // The claims logic is simplified or can be enhanced here if needed.
  // For now, we remove the direct getIdTokenResult call to keep the hook lightweight.
  // If claims are needed, they should be derived from the user object when it changes.
  
  return { user, loading, claims: (user as any)?.claims || null };
}
