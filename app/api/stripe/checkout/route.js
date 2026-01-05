import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { createClient } from '@/utils/supabase/server';
import { PLANS } from '@/lib/plans';

// --- SHARED SECURITY & ROLE HELPER ---
async function verifyAdminAccess(supabase, userId) {
  // ✅ ACTION: Find the pantry and verify the user is an ADMIN
  const { data: membership, error } = await supabase
    .from('pantry_members')
    .select('pantry_id, role, is_active')
    .eq('user_id', userId)
    .single();

  if (error || !membership) return null;
  
  // Only admins should be allowed to spend money/change plans
  if (membership.role !== 'admin' || !membership.is_active) return null;

  return membership.pantry_id;
}

export async function POST(req) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 1. SECURITY: Ensure the user belongs to a pantry and IS AN ADMIN
    const pantryId = await verifyAdminAccess(supabase, user.id);
    if (!pantryId) {
      return NextResponse.json({ 
        error: 'Forbidden: Only an active Admin can manage subscriptions.' 
      }, { status: 403 });
    }

    const body = await req.json();
    const { tier } = body;

    // 2. Plan Validation
    const selectedPlan = PLANS[tier];
    if (!selectedPlan || !selectedPlan.stripePriceId) {
      return NextResponse.json({ error: 'Invalid plan selected' }, { status: 400 });
    }

    // 3. Get Pantry Details for Stripe
    const { data: pantry } = await supabase
      .from('food_pantries')
      .select('stripe_customer_id, name')
      .eq('pantry_id', pantryId)
      .single();

    let customerId = pantry?.stripe_customer_id;

    // --- STEP 3: Verify or Create Stripe Customer (Self-Healing) ---
    if (customerId) {
      try {
        const customer = await stripe.customers.retrieve(customerId);
        if (customer.deleted) customerId = null;
      } catch (error) {
        customerId = null;
      }
    }

    if (!customerId) {
      const newCustomer = await stripe.customers.create({
        email: user.email,
        name: pantry?.name || 'Pantry Admin',
        metadata: {
          supabaseUUID: user.id,
          pantryId: pantryId
        },
      });

      customerId = newCustomer.id;

      await supabase
        .from('food_pantries')
        .update({ stripe_customer_id: customerId })
        .eq('pantry_id', pantryId);
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
        pantryId: pantryId,
        tier: tier
      },
    });

    return NextResponse.json({ url: session.url });

  } catch (err) {
    console.error("❌ Stripe Checkout Error:", err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}