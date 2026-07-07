'use client';

// NOTE: Adjust the path below to point to wherever your client.js is located
// (It is usually in '@/utils/supabase/client' or '@/lib/supabase/client')
import { createClient } from '@/utils/supabase/client'; 

export function useAuthAction() {
  // Use your existing centralized client instead of creating a new one
  const supabase = createClient();

  const handleSignIn = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { 
        // This is the magic line that fixes your phone login
        redirectTo: `${window.location.origin}/auth/callback` 
      }
    });
  };

  return { handleSignIn };
}