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

  const { pantryId } = await req.clone().json(); // Clone so we don't consume the stream
  if (!pantryId) return { valid: false, status: 400, message: 'Pantry ID required' };

  // ✅ ACTION: Only Admins should be allowed to send invites
  const { data: membership, error: memberError } = await supabase
    .from('pantry_members')
    .select('role, is_active')
    .eq('user_id', user.id)
    .eq('pantry_id', pantryId)
    .single();

  if (memberError || !membership || membership.role !== 'admin') {
    return { valid: false, status: 403, message: 'Forbidden: Only Admins can invite users' };
  }

  return { valid: true, user, pantryId };
}

export async function POST(req) {
  try {
    // 1. SECURITY CHECK
    const auth = await authenticateAndVerify(req);
    if (!auth.valid) return NextResponse.json({ error: auth.message }, { status: auth.status });

    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json({ error: 'Server misconfiguration' }, { status: 500 });
    }

    const { email, pantryId, role, pantryName, joinCode } = await req.json();
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // 2. Logic: Create Redirect Path
    const targetPath = `/onboarding?code=${joinCode}`;
    const encodedRedirect = `${siteUrl}/auth/callback?next=${encodeURIComponent(targetPath)}`;

    let inviteLink = null;
    
    // Generate the magic link
    const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'invite',
      email: email,
      options: {
        redirectTo: encodedRedirect,
        data: { invited_to_pantry: pantryId, role: role || 'volunteer' }
      }
    });

    if (linkError) {
      if (linkError.code === 'email_exists' || linkError.message.includes('already registered')) {
        inviteLink = `${siteUrl}/onboarding?code=${joinCode}`;
      } else {
        return NextResponse.json({ error: linkError.message }, { status: 400 });
      }
    } else {
      inviteLink = linkData.properties.action_link;
    }

    // 3. Send the Email
    await resend.emails.send({
      from: 'Food Arca <invites@foodarca.com>', 
      to: email, 
      subject: `You've been invited to join ${pantryName}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Join ${pantryName} on Food Arca</h2>
          <p>You have been invited to join the team as a <strong>${role}</strong>.</p>
          <div style="background: #f9f9f9; padding: 15px; border-radius: 8px; margin: 20px 0; text-align: center;">
            <p style="margin: 0 0 10px; color: #666;">Your Organization Join Code:</p>
            <code style="font-size: 24px; font-weight: bold; letter-spacing: 2px;">${joinCode}</code>
          </div>
          <a href="${inviteLink}" style="display: inline-block; background: #d97757; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
            Accept Invitation
          </a>
        </div>
      `
    });

    return NextResponse.json({ success: true });

  } catch (err) {
    console.error("API Crash:", err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}