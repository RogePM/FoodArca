'use client';

import React from 'react';
import { ArrowRight } from 'lucide-react';
import { createBrowserClient } from '@supabase/ssr';

export default function CTAActions() {
  // Reusing your Supabase auth logic
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
    <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 mt-4 w-full">
      
      {/* PRIMARY BUTTON: "Start for free" */}
      <button 
        onClick={handleSignIn}
        className="group relative w-full sm:w-auto px-8 py-3.5 rounded-full bg-brand-primary text-white font-inter font-semibold text-[15px] transition-all duration-300 hover:shadow-[0_8px_20px_-6px_rgba(217,119,87,0.6)] hover:-translate-y-0.5 flex items-center justify-center gap-2 overflow-hidden"
      >
        <span className="relative z-10">Start for free</span>
        <ArrowRight size={18} className="relative z-10 transition-transform duration-300 group-hover:translate-x-1" />
        <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-in-out z-0"></div>
      </button>

      {/* SECONDARY BUTTON: "Explore features" */}
      <button 
        // CHANGED: Swapped bg-transparent for bg-white. 
        // ADDED: shadow-sm to give it a physical presence over the tinted section background.
        // CHANGED: Hover state is now a soft off-white/beige (bg-[#F5F5F4]).
        className="w-full sm:w-auto px-8 py-3.5 rounded-full bg-white border-2 border-[#E7E5E4] hover:border-[#D6D3D1] hover:bg-[#F5F5F4] text-[#1C1917] font-inter font-semibold text-[15px] transition-all duration-300 flex items-center justify-center shadow-sm"
      >
        Explore features
      </button>

    </div>
  );
}