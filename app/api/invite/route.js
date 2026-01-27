import { createClient } from '@supabase/supabase-js';
import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { Resend } from 'resend';

// Initialize Resend
const resendApiKey = process.env.RESEND_API_KEY;
if (!resendApiKey) {
  console.error("MISSING ENV: RESEND_API_KEY");
}
const resend = new Resend(resendApiKey);

// --- SHARED SECURITY HELPER ---
async function authenticateAndVerify(req) {
  const cookieStore = await cookies();
  
  // 1. Safe Access to Env Vars
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return { valid: false, status: 500, message: 'Server Configuration Error: Missing Supabase Envs' };
  }

  // 2. Create client with user's cookies
  const supabase = createServerClient(
    supabaseUrl,
    supabaseKey,
    { cookies: { getAll() { return cookieStore.getAll(); } } }
  );

  // 3. Check Auth
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return { valid: false, status: 401, message: 'Unauthorized' };

  // 4. Clone and Parse Body
  const body = await req.clone().json();
  const { pantryId } = body;
  
  if (!pantryId) return { valid: false, status: 400, message: 'Pantry ID required' };

  // 5. RLS Check
  // We query 'pantry_members' to see if the current user is an admin for this pantry.
  // This works because of the "View teammates" RLS policy.
  const { data: membership, error: memberError } = await supabase
    .from('pantry_members')
    .select('role')
    .eq('user_id', user.id)
    .eq('pantry_id', pantryId)
    .maybeSingle();

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
    
    // Default to localhost if site url is missing (good for dev)
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
    
    // Check Service Role Key for Admin Actions
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!serviceRoleKey) {
        return NextResponse.json({ error: 'Server Error: Missing Service Role Key' }, { status: 500 });
    }

    // 2. Create Admin Client
    // We use the Service Role Key here to bypass RLS so we can generate the magic link
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      serviceRoleKey,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // 3. Logic: Create Redirect Path
    const targetPath = `/onboarding?code=${joinCode}`;
    const encodedRedirect = `${siteUrl}/auth/callback?next=${encodeURIComponent(targetPath)}`;

    let inviteLink = null;
    
    // 4. Generate the magic link
    const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'invite',
      email: email,
      options: {
        redirectTo: encodedRedirect,
        data: { initial_pantry: pantryId, initial_role: role || 'volunteer' }
      }
    });

    if (linkError) {
      // CASE: User already exists. Magic Link fails with 422 or specific message.
      // We fall back to a direct link to the onboarding page.
      if (linkError.status === 422 || linkError.message.includes('already registered')) {
        inviteLink = `${siteUrl}/onboarding?code=${joinCode}`;
      } else {
        return NextResponse.json({ error: linkError.message }, { status: 400 });
      }
    } else {
      inviteLink = linkData.properties.action_link;
    }

    // 5. Send the Email via Resend
    const { error: emailError } = await resend.emails.send({
      from: 'Food Arca <invites@foodarca.com>', // Ensure this domain is verified in Resend
      to: email, 
      subject: `You've been invited to join ${pantryName}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
          <h2 style="color: #d97757;">Join ${pantryName}</h2>
          <p>You have been invited to help track food waste and support your community as a <strong>${role}</strong>.</p>
          
          <div style="background: #fdf2f0; border: 1px solid #f9d8d0; padding: 20px; border-radius: 12px; margin: 25px 0; text-align: center;">
            <p style="margin: 0 0 10px; font-size: 12px; color: #d97757; font-weight: bold; text-transform: uppercase; letter-spacing: 1px;">Your Join Code</p>
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

    if (emailError) {
        console.error("Resend Error:", emailError);
        return NextResponse.json({ error: "Failed to send email" }, { status: 500 });
    }

    return NextResponse.json({ success: true });

  } catch (err) {
    console.error("API Crash:", err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}