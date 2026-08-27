import React from 'react';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/dashboard-layout';

export const metadata = {
  title: 'Dashboard | Food Arca',
};

export default async function DashboardRootLayout({ children }) {
  const cookieStore = await cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Server Component cannot set cookies, ignore
          }
        },
      },
    }
  );

  // Security: Redirect if not logged in or auth error
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    console.log('❌ Server-side: No valid user, redirecting to login');
    redirect('/');
  }

  // Security & Flow: If user is not part of any active organization, redirect to onboarding wizard
  const { data: membership } = await supabase
    .from('user_organizations')
    .select('organization_id')
    .eq('user_id', user.id)
    .eq('status', 'active')
    .limit(1)
    .maybeSingle();

  if (!membership?.organization_id) {
    console.log('🟡 Server-side: User has no active organization, redirecting to onboarding wizard');
    redirect('/onboarding');
  }

  return (
    <DashboardLayout>
      {children}
    </DashboardLayout>
  );
}