import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
// ✅ Import from the file right next to this one
import OnboardingApp from './OnboardingApp'

export default async function OnboardingPage({ searchParams }) {
  const cookieStore = await cookies()
  const params = await searchParams
  const inviteCode = params?.code || params?.invite_code

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

  // 1. Re-validate user (Server-side check)
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) redirect('/')

  // 2. Parallel Check: Profile & Existing Memberships
  // We check if they already have a profile or are in a pantry
  const [profileResult, membershipResult] = await Promise.all([
    supabase.from('user_profiles').select('user_id').eq('user_id', user.id).maybeSingle(),
    supabase.from('pantry_members').select('pantry_id').eq('user_id', user.id).maybeSingle()
  ])

  const profile = profileResult.data
  const isAlreadyInAPantry = !!membershipResult.data

  // 3. Logic: If they are fully set up and NOT using a new invite code, send to dashboard.
  if (profile && isAlreadyInAPantry && !inviteCode) {
    redirect('/dashboard')
  }

  // 4. Render the Client Component
  // We pass the 'user' object here, which fixes the white screen error.
  return <OnboardingApp user={user} inviteCode={inviteCode} />
}