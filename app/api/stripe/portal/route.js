import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { createClient } from '@/utils/supabase/server';

// --- SHARED SECURITY HELPER ---
// organizationId is passed from the request body so multi-org users work correctly
async function verifyAdminAccess(supabase, userId, organizationId) {
  const { data: membership, error } = await supabase
    .from('user_organizations')
    .select('organization_id, role, status')
    .eq('user_id', userId)
    .eq('organization_id', organizationId)
    .eq('status', 'active')
    .maybeSingle();

  if (error || !membership) return null;
  
  const allowedRoles = ['admin', 'owner'];
  if (!allowedRoles.includes(membership.role)) return null;

  return membership.organization_id;
}

export async function POST(req) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { organizationId } = body;

    if (!organizationId) {
      return NextResponse.json({ error: 'Organization ID is required' }, { status: 400 });
    }

    // 1. SECURITY: Enforce Admin/Owner-only verification for the specified organization
    const orgId = await verifyAdminAccess(supabase, user.id, organizationId);
    if (!orgId) {
      return NextResponse.json({ 
        error: 'Forbidden: Only an active Admin or Owner can access the Billing Portal.' 
      }, { status: 403 });
    }

    // 2. Fetch Stripe Customer ID by searching Stripe metadata
    let customerId = null;
    try {
      const customers = await stripe.customers.search({
        query: `metadata['pantryId']:'${orgId}'`,
      });
      if (customers.data.length > 0 && !customers.data[0].deleted) {
        customerId = customers.data[0].id;
      }
    } catch (err) {
      console.error("Stripe customer search error:", err);
    }

    if (!customerId) {
      return NextResponse.json({ 
        error: 'No active billing profile found for this organization.' 
      }, { status: 400 });
    }

    // 3. Define the Return URL
    const origin = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const returnUrl = `${origin}/dashboard`; 

    // 4. Create Stripe Portal Session
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: returnUrl,
    });

    console.log(`✅ Stripe Portal Session created for Organization: ${orgId}`);
    return NextResponse.json({ url: session.url });

  } catch (err) {
    console.error("❌ Stripe Portal Error:", err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}