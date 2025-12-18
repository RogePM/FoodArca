import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function GET(request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  
  // 🔥 Capture the 'next' param (e.g. /onboarding)
  const next = requestUrl.searchParams.get('next')

  if (code) {
    const cookieStore = await cookies()

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options)
            })
          },
        },
      }
    )

    // 1️⃣ Exchange Code for Session (Critical Step)
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (error) {
      console.error('Exchange error:', error.message)
      return NextResponse.redirect(new URL('/?error=auth_code_error', requestUrl.origin))
    }

    console.log('✅ Session created successfully!')

    // 2️⃣ PRIORITY: If 'next' exists (from Invite Link), go there immediately
    // This fixes the invite flow by skipping the profile check logic below
    if (next) {
        console.log(`➡️ Redirecting to requested path: ${next}`)
        return NextResponse.redirect(new URL(next, requestUrl.origin))
    }

    // -------------------------------------------------------------
    // Standard Login Logic (Fallback if no 'next' param)
    // -------------------------------------------------------------

    // 3️⃣ Get the logged-in user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.redirect(new URL('/?error=no_user', requestUrl.origin))
    }

    // 4️⃣ Check if profile exists
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('user_id')
      .eq('user_id', user.id)
      .single()

    // 5️⃣ Redirect based on profile status
    if (!profile) {
      console.log("🟡 No profile found → redirecting to onboarding")
      return NextResponse.redirect(new URL('/onboarding', requestUrl.origin))
    }

    console.log("🟢 Existing profile → redirect to dashboard")
    return NextResponse.redirect(new URL('/dashboard', requestUrl.origin))
  }

  // No code in URL — back to landing page
  return NextResponse.redirect(new URL('/', requestUrl.origin))
}