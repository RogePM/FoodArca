import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import OnboardingApp from './OnboardingApp' // Your Wizard Component

export default async function OnboardingPage({ searchParams }) {
  const cookieStore = await cookies()
  
  // 🔥 Wait for searchParams (Next.js 15 requirement, good practice generally)
  const params = await searchParams;
  const inviteCode = params?.code || params?.invite_code;

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options)
          })
        },
      },
    }
  )

  const { data: { session } } = await supabase.auth.getSession()

  // Not logged in → redirect home
  if (!session) redirect('/')

  const userId = session.user.id

  // Check for existing user profile
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('user_id')
    .eq('user_id', userId)
    .maybeSingle()

  // 🔥 FIX: Only redirect to dashboard if they have a profile AND NO invite code
  if (profile && !inviteCode) {
    redirect('/dashboard')
  }

  // If they have a code, let them stay to join the new team
  return <OnboardingApp session={session} />
}