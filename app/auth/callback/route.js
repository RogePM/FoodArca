import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function GET(request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  
  // 1. Capture the 'next' param (e.g. /onboarding?code=JOIN123)
  const next = requestUrl.searchParams.get('next') ?? '/dashboard'

  if (code) {
    const cookieStore = await cookies()

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

    // 2. Exchange Code for Session
    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
    
    if (exchangeError) {
      console.error('❌ Auth Code Exchange Failed:', exchangeError.message)
      return NextResponse.redirect(new URL('/?error=auth_code_error', requestUrl.origin))
    }

    // 3. Invite Link Fast-Track & Security Check
    // We only redirect if 'next' is an internal path (starts with / and not //)
    if (next.startsWith('/') && !next.startsWith('//')) {
      if (next.includes('onboarding')) {
        console.log(`🚀 Invite flow detected. Fast-tracking to: ${next}`)
        return NextResponse.redirect(new URL(next, requestUrl.origin))
      }
    } else {
      // If someone injected an external URL, reset to safe default
      return NextResponse.redirect(new URL('/dashboard', requestUrl.origin))
    }

    // 4. Standard Login: Check for Organization Membership
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error("User not found after exchange")

      const { data: membership, error: memError } = await supabase
        .from('user_organizations')
        .select('id')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .limit(1)
        .maybeSingle()

      // 5. Intelligent Redirection
      if (memError || !membership) {
        console.log("🟡 No active organization membership found → redirecting to onboarding")
        return NextResponse.redirect(new URL('/onboarding', requestUrl.origin))
      }

      console.log("🟢 Organization membership verified → redirect to dashboard")
      return NextResponse.redirect(new URL(next, requestUrl.origin))

    } catch (err) {
      console.error("⚠️ Membership check failed:", err.message)
      return NextResponse.redirect(new URL('/onboarding', requestUrl.origin))
    }
  }

  // Fallback if no code
  return NextResponse.redirect(new URL('/', requestUrl.origin))
}