'use client';

import React from 'react';
import { PlayCircle } from 'lucide-react';
import { createBrowserClient } from '@supabase/ssr'; // <-- Import Supabase

export default function HeroActions() {
  
  // Initialize Supabase client for this specific component
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder';
  const supabase = createBrowserClient(supabaseUrl, supabaseKey);

  const handleSignIn = async () => {
    console.log("Initiating Google Sign-In...");
    
    // Your Supabase OAuth logic
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { 
        // Dynamically gets the current domain (e.g., localhost:3000 or your real domain)
        redirectTo: `${window.location.origin}/auth/callback` 
      }
    });
  };

  return (
    <div className="hero-widget flex flex-col sm:flex-row items-center justify-center gap-4 w-full sm:w-auto mb-16">
      <button 
        className="w-full sm:w-auto px-6 py-3.5 rounded-xl border border-hero-muted/30 bg-white hover:bg-hero-hover text-hero-main font-medium flex items-center justify-center gap-2 transition-all shadow-md"
      >
        <PlayCircle size={20} className="text-hero-muted" />
        Demo
      </button>
      
      <button 
        onClick={handleSignIn}
        className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-hero-main hover:bg-[#34302e] text-white font-medium flex items-center justify-center gap-2 transition-all active:scale-[0.98] shadow-md"
      >
        Sign up
      </button>
    </div>
  );
}