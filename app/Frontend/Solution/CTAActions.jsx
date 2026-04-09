'use client';

import React from 'react';
import { createBrowserClient } from '@supabase/ssr';

export default function CTAActions() {
  // Reusing your Supabase auth logic for the "Get started" button
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder';
  const supabase = createBrowserClient(supabaseUrl, supabaseKey);

  const handleSignIn = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` }
    });
  };

  return (
    <div className="flex flex-col sm:flex-row items-center gap-4 mt-10">
      <button className="w-full sm:w-auto px-6 py-3.5 rounded-xl border border-hero-border bg-white hover:bg-hero-hover text-hero-main font-semibold transition-colors shadow-sm">
        Learn more
      </button>
      <button 
        onClick={handleSignIn}
        className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-brand-primary hover:opacity-90 text-white font-semibold transition-opacity shadow-sm"
      >
        Get started
      </button>
    </div>
  );
}