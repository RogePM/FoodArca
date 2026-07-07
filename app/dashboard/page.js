import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

import DashboardClientApp from './client-page'; 

export default async function DashboardPage() {
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

  // Use getUser() instead of getSession() for server-side security
  const {
    data: { user },
    error
  } = await supabase.auth.getUser();

  // 1. Security: Redirect if not logged in or auth error
  if (error || !user) {
    console.log('❌ Server-side: No valid user, redirecting to login');
    redirect('/');
  }

  console.log('✅ Server-side: User is authenticated:', user.email);

  // 2. Fetch user profile from app_users and initial org/location from user_organizations
  const { data: profile } = await supabase
    .from('app_users')
    .select('full_name')
    .eq('id', user.id)
    .maybeSingle();

  const { data: membership } = await supabase
    .from('user_organizations')
    .select('organization_id')
    .eq('user_id', user.id)
    .eq('status', 'active')
    .limit(1)
    .maybeSingle();

  // 3. Security & Flow: If user is not part of any organization, redirect to onboarding wizard
  if (!membership?.organization_id) {
    console.log('🟡 Server-side: User has no active organization, redirecting to onboarding wizard');
    redirect('/onboarding');
  }

  let initialLocationId = null;
  if (membership?.organization_id) {
    const { data: location } = await supabase
      .from('locations')
      .select('id')
      .eq('organization_id', membership.organization_id)
      .order('created_at', { ascending: true })
      .limit(1)
      .maybeSingle();
    initialLocationId = location?.id || membership.organization_id;
  }

  // 3. Pass user data to client (not the full session for security)
  return (
    <DashboardClientApp 
      initialUser={{
        id: user.id,
        email: user.email,
        name: profile?.full_name || user.user_metadata?.full_name || 'User'
      }}
      initialPantryId={initialLocationId}
    />
  );
}