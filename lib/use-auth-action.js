'use client';

// NOTE: Adjust the path below to point to wherever your client.js is located
// (It is usually in '@/utils/supabase/client' or '@/lib/supabase/client')
import { createClient } from '@/utils/supabase/client'; 

export function useAuthAction() {
  // Use your existing centralized client instead of creating a new one
  const supabase = createClient();

  const handleSignIn = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { 
          redirectTo: `${window.location.origin}/auth/callback` 
        }
      });
      if (error) {
        console.error("Google OAuth Error:", error);
        alert(`Google Sign-In Error: ${error.message}. Please verify Google Provider is enabled in Supabase Dashboard.`);
      }
    } catch (err) {
      console.error("Unexpected Auth Error:", err);
      alert("An error occurred while initiating Google Sign-In. Check console for details.");
    }
  };

  return { handleSignIn };
}
