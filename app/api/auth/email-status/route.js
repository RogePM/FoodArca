import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

// Email-first login: tells the login page which step to show next.
//   'password' -> account exists with a password
//   'google'   -> account exists but only signs in with Google (no password set)
//   'create'   -> no account yet
//
// This reveals whether an email is registered (the same trade-off Google,
// Claude and most email-first logins make). It is rate limited per IP below.
// Best-effort only: serverless instances each keep their own counter, so
// add Vercel Firewall rate limiting on this path before launch.

const WINDOW_MS = 60_000;
const MAX_PER_WINDOW = 10;
const hits = new Map();

function tooMany(ip) {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  recent.push(now);
  hits.set(ip, recent);
  if (hits.size > 5000) {
    for (const [key, times] of hits) {
      if (times.every((t) => now - t >= WINDOW_MS)) hits.delete(key);
    }
  }
  return recent.length > MAX_PER_WINDOW;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
  if (tooMany(ip)) {
    return NextResponse.json({ error: 'rate_limited' }, { status: 429 });
  }

  let email;
  try {
    ({ email } = await request.json());
  } catch {
    return NextResponse.json({ error: 'invalid_request' }, { status: 400 });
  }

  email = typeof email === 'string' ? email.trim().toLowerCase() : '';
  if (!EMAIL_RE.test(email) || email.length > 254) {
    return NextResponse.json({ error: 'invalid_email' }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin.rpc('auth_email_status', { p_email: email });
  if (error) {
    console.error('auth_email_status failed:', error.message);
    return NextResponse.json({ error: 'server_error' }, { status: 500 });
  }

  let status = 'create';
  if (data?.exists) {
    const providers = Array.isArray(data.providers) ? data.providers : [];
    status = providers.includes('email') || providers.length === 0 ? 'password' : 'google';
  }

  return NextResponse.json({ status });
}
