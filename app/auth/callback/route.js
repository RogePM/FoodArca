import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function GET(request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  
  // 1. Capture the 'next' param (e.g. /onboarding?code=JOIN123)
  const next = requestUrl.searchParams.get('next') ?? '/dashboard'

  // --- THE MAGIC FIX ---
  // Next.js thinks it's on localhost. We force it to read the Ngrok/Production headers.
  const forwardedHost = request.headers.get('x-forwarded-host') || request.headers.get('host')
  const forwardedProto = request.headers.get('x-forwarded-proto') || 'http'
  const safeOrigin = forwardedHost ? `${forwardedProto}://${forwardedHost}` : requestUrl.origin
  // ---------------------

  if (code) {
    const cookieStore = await cookies()

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        cookies: {
          getAll() { return cookieStore.getAll() },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) => {
                cookieStore.set(name, value, options)
              })
            } catch (error) {
              // Safe to ignore: middleware handles the actual cookie setting
            }
          },
        },
      }
    )

    // 2. Exchange Code for Session
    const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
    
    if (exchangeError) {
      console.error('❌ Auth Code Exchange Failed:', exchangeError.message)
      // Use safeOrigin instead of requestUrl.origin
      return NextResponse.redirect(new URL('/?error=auth_code_error', safeOrigin))
    }

    // 3. Invite Link Fast-Track & Security Check
    if (next.startsWith('/')) {
      if (next.includes('onboarding')) {
        console.log(`🚀 Invite flow detected. Fast-tracking to: ${next}`)
        return NextResponse.redirect(new URL(next, safeOrigin))
      }
    } else {
      return NextResponse.redirect(new URL('/dashboard', safeOrigin))
    }

    // 4. Standard Login: Check for Profile
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error("User not found after exchange")

      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('user_id')
        .eq('user_id', user.id)
        .maybeSingle()

      // 5. Intelligent Redirection
      if (profileError || !profile) {
        console.log("🟡 No profile found → redirecting to onboarding")
        return NextResponse.redirect(new URL('/onboarding', safeOrigin))
      }

      console.log("🟢 Profile verified → redirect to dashboard")
      return NextResponse.redirect(new URL(next, safeOrigin))

    } catch (err) {
      console.error("⚠️ Profile check failed:", err.message)
      return NextResponse.redirect(new URL('/onboarding', safeOrigin))
    }
  }

  // Fallback if no code
  return NextResponse.redirect(new URL('/', safeOrigin))
}