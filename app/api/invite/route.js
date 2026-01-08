import { createClient } from '@supabase/supabase-js';
import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

// --- SHARED SECURITY HELPER ---
async function authenticateAndVerify(req) {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    { cookies: { getAll() { return cookieStore.getAll(); } } }
  );

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return { valid: false, status: 401, message: 'Unauthorized' };

  // Use a temporary clone to read the body for the security check
  const body = await req.clone().json();
  const { pantryId } = body;
  
  if (!pantryId) return { valid: false, status: 400, message: 'Pantry ID required' };

  // ✅ FIX: Check for BOTH 'admin' OR 'owner' roles
  const { data: membership, error: memberError } = await supabase
    .from('pantry_members')
    .select('role, is_active')
    .eq('user_id', user.id)
    .eq('pantry_id', pantryId)
    .single();

  if (memberError || !membership || !['admin', 'owner'].includes(membership.role)) {
    return { valid: false, status: 403, message: 'Forbidden: Insufficient permissions' };
  }

  return { valid: true, user, pantryId };
}

export async function POST(req) {
  try {
    // 1. SECURITY CHECK
    const auth = await authenticateAndVerify(req);
    if (!auth.valid) return NextResponse.json({ error: auth.message }, { status: auth.status });

    const { email, pantryId, role, pantryName, joinCode } = await req.json();
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // 2. Logic: Create Redirect Path
    // This ensures that AFTER they sign up/log in, they land exactly where the code is processed
    const targetPath = `/onboarding?code=${joinCode}`;
    const encodedRedirect = `${siteUrl}/auth/callback?next=${encodeURIComponent(targetPath)}`;

    let inviteLink = null;
    
    // 3. Generate the magic link (Sign-up + Join combo)
    const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'invite',
      email: email,
      options: {
        redirectTo: encodedRedirect,
        // We attach metadata to the user object itself in Supabase Auth
        data: { initial_pantry: pantryId, initial_role: role || 'volunteer' }
      }
    });

    if (linkError) {
      // CASE: User already has an account. 
      // We don't need a magic link, just a direct link to the onboarding wizard.
      if (linkError.status === 422 || linkError.message.includes('already registered')) {
        inviteLink = `${siteUrl}/onboarding?code=${joinCode}`;
      } else {
        return NextResponse.json({ error: linkError.message }, { status: 400 });
      }
    } else {
      inviteLink = linkData.properties.action_link;
    }

    // 4. Send the Email via Resend
    await resend.emails.send({
      from: 'Food Arca <invites@foodarca.com>', 
      to: email, 
      subject: `You've been invited to join ${pantryName}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
          <h2 style="color: #d97757;">Join ${pantryName}</h2>
          <p>You have been invited to help track food waste and support your community as a <strong>${role}</strong>.</p>
          
          <div style="background: #fdf2f0; border: 1px solid #f9d8d0; padding: 20px; border-radius: 12px; margin: 25px 0; text-align: center;">
            <p style="margin: 0 0 10px; font-size: 12px; color: #d97757; font-weight: bold; uppercase; letter-spacing: 1px;">Your Join Code</p>
            <code style="font-size: 32px; font-family: monospace; font-weight: bold; color: #1a1a1a;">${joinCode}</code>
          </div>

          <a href="${inviteLink}" style="display: block; background: #d97757; color: white; padding: 14px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; text-align: center; font-size: 16px;">
            Accept Invitation & Get Started
          </a>
          
          <p style="margin-top: 30px; font-size: 12px; color: #999; text-align: center;">
            If you already have an account, simply click the link and enter the code.
          </p>
        </div>
      `
    });

    return NextResponse.json({ success: true });

  } catch (err) {
    console.error("API Crash:", err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}