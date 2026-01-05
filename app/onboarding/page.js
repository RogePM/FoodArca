import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
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

  // 1. Re-validate user (Better security than getSession)
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) redirect('/')

  // 2. Parallel Check: Profile & Existing Memberships
  const [profileResult, membershipResult] = await Promise.all([
    supabase.from('user_profiles').select('user_id').eq('user_id', user.id).maybeSingle(),
    supabase.from('pantry_members').select('pantry_id').eq('user_id', user.id).maybeSingle()
  ])

  const profile = profileResult.data
  const isAlreadyInAPantry = !!membershipResult.data

  // 3. Logic: Where do they go?
  
  // CASE A: User exists and is already in a pantry, and NO invite code is being used.
  if (profile && isAlreadyInAPantry && !inviteCode) {
    console.log("🟢 User fully onboarded -> Dashboard")
    redirect('/dashboard')
  }

  // CASE B: User exists, but they have a NEW invite code.
  // We let them through to OnboardingApp so they can join the new team.
  if (inviteCode) {
    console.log("✨ Joining new team with code:", inviteCode)
  }

  // 4. Render the Wizard
  // Pass the user and the code to the client component
  return <OnboardingApp user={user} inviteCode={inviteCode} />
}