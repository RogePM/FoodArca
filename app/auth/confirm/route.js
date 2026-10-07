import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { safeNext } from '@/lib/auth-redirect'

const OTP_TYPES = new Set(['signup', 'email', 'recovery', 'invite', 'magiclink', 'email_change'])

// Email links (confirm signup, reset password) land here with a token_hash.
// Unlike the PKCE code flow in /auth/callback, verifyOtp needs no code
// verifier cookie, so the link works in any browser or device.
export async function GET(request) {
  const { searchParams, origin } = new URL(request.url)
  const tokenHash = searchParams.get('token_hash')
  const type = searchParams.get('type')
  const next = safeNext(searchParams.get('next'))

  const fail = () => NextResponse.redirect(new URL('/?error=auth_code_error', origin))

  const code = searchParams.get('code')

  const supabase = await createClient()
  let error

  if (tokenHash && OTP_TYPES.has(type)) {
    ;({ error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash }))
  } else if (code) {
    // Default Supabase email templates send a PKCE code (same-browser only).
    // Kept so links keep working until the templates are switched to token_hash.
    ;({ error } = await supabase.auth.exchangeCodeForSession(code))
  } else {
    return fail()
  }

  if (error) {
    console.error('Auth token verification failed:', error.message)
    return fail()
  }

  // Password reset must work even for users with no organization yet.
  if (type === 'recovery' || next === '/reset-password') {
    return NextResponse.redirect(new URL('/reset-password', origin))
  }

  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return fail()

    const { data: membership } = await supabase
      .from('user_organizations')
      .select('id')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .limit(1)
      .maybeSingle()

    // Invite links keep their own onboarding destination.
    if (!membership && !next.includes('onboarding')) {
      return NextResponse.redirect(new URL('/onboarding', origin))
    }
    return NextResponse.redirect(new URL(next, origin))
  } catch {
    return NextResponse.redirect(new URL('/onboarding', origin))
  }
}
