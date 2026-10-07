import React from 'react';
import { createClient } from '@/utils/supabase/server';
import { safeNext } from '@/lib/auth-redirect';
import HeroContainer from './HeroContainer';
import HeroBackdrop from './HeroBackdrop';
import HeroAuth from './HeroAuth';

// The hero is also the sign-in / sign-up screen: there is no separate /login page.
export default async function Hero({ searchParams }) {
  const params = (await searchParams) ?? {};
  const next = safeNext(params.next);

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <HeroContainer>
      <HeroBackdrop />

      <div className="relative z-10 flex w-full flex-1 flex-col">
        <HeroAuth next={next} urlError={params.error ?? null} signedIn={!!user} />
      </div>
    </HeroContainer>
  );
}
