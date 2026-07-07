import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { createClient } from '@/utils/supabase/server';
import { PLANS } from '@/lib/plans';

// --- SHARED SECURITY & ROLE HELPER ---
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
    const { tier, organizationId } = body;

    if (!organizationId) {
      return NextResponse.json({ error: 'Organization ID is required' }, { status: 400 });
    }

    // 1. SECURITY: Ensure the user is an Admin/Owner of the specified organization
    const orgId = await verifyAdminAccess(supabase, user.id, organizationId);
    if (!orgId) {
      return NextResponse.json({ 
        error: 'Forbidden: Only an active Admin or Owner can manage subscriptions.' 
      }, { status: 403 });
    }

    // 2. Plan Validation
    const selectedPlan = PLANS[tier];
    if (!selectedPlan || !selectedPlan.stripePriceId) {
      return NextResponse.json({ error: 'Invalid plan selected' }, { status: 400 });
    }

    // 3. Get Organization Details for Stripe
    const { data: org } = await supabase
      .from('organizations')
      .select('name')
      .eq('id', orgId)
      .single();

    let customerId = null;

    // --- STEP 3: Search Stripe for existing customer by organization ID ---
    try {
      const customers = await stripe.customers.search({
        query: `metadata['pantryId']:'${orgId}'`,
      });
      if (customers.data.length > 0 && !customers.data[0].deleted) {
        customerId = customers.data[0].id;
      }
    } catch (err) {
      console.warn("Stripe customer search failed, will create new customer:", err.message);
    }

    if (!customerId) {
      const newCustomer = await stripe.customers.create({
        email: user.email,
        name: org?.name || 'Organization Owner',
        metadata: {
          supabaseUUID: user.id,
          pantryId: orgId
        },
      });

      customerId = newCustomer.id;
    }

    const origin = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    // --- STEP 4: Create Checkout Session ---
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      line_items: [{
        price: selectedPlan.stripePriceId,
        quantity: 1
      }],
      mode: 'subscription',
      payment_method_types: ['card'],
      success_url: `${origin}/dashboard?session_id={CHECKOUT_SESSION_ID}&success=true`,
      cancel_url: `${origin}/dashboard`,
      metadata: {
        userId: user.id,
        pantryId: orgId,
        tier: tier
      },
    });

    return NextResponse.json({ url: session.url });

  } catch (err) {
    console.error("❌ Stripe Checkout Error:", err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}