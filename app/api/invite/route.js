import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req) {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ error: 'Server misconfiguration' }, { status: 500 });
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  try {
    const { email, pantryId, role, pantryName, joinCode } = await req.json();

    // 🔥 FIX: Create a properly encoded redirect path
    // This ensures the join code stays attached to 'onboarding' and doesn't confuse Supabase
    const targetPath = `/onboarding?code=${joinCode}`;
    const encodedRedirect = `${siteUrl}/auth/callback?next=${encodeURIComponent(targetPath)}`;

    let inviteLink = null;
    
    const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'invite',
      email: email,
      options: {
        redirectTo: encodedRedirect, // Use the encoded version
        data: { invited_to_pantry: pantryId, role: role || 'volunteer' }
      }
    });

    if (linkError) {
      if (linkError.code === 'email_exists' || linkError.message.includes('already registered')) {
        console.log("ℹ️ User already exists. Sending standard login link.");
        inviteLink = `${siteUrl}/onboarding?code=${joinCode}`;
      } else {
        console.error("Link Gen Error:", linkError);
        return NextResponse.json({ error: linkError.message }, { status: 400 });
      }
    } else {
      inviteLink = linkData.properties.action_link;
    }

    // 2. Send the Email (Resend)
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

          <p>Click the button below to accept the invite:</p>
          
          <a href="${inviteLink}" style="display: inline-block; background: #d97757; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
            Accept Invitation
          </a>

          <p style="margin-top: 30px; font-size: 12px; color: #888;">
            If the button doesn't work, login at ${siteUrl}/onboarding and enter code: ${joinCode}
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