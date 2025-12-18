import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { createClient } from '@/utils/supabase/server';
import { PLANS } from '@/lib/plans';

export async function POST(req) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { tier } = body;

    // Validate the requested tier
    const selectedPlan = PLANS[tier];
    if (!selectedPlan || !selectedPlan.stripePriceId) {
      return NextResponse.json({ error: 'Invalid plan selected' }, { status: 400 });
    }

    // --- STEP 1: Find the Pantry ID via the Members Table ---
    const { data: memberRecord } = await supabase
      .from('pantry_members')
      .select('pantry_id')
      .eq('user_id', user.id)
      .single();

    if (!memberRecord?.pantry_id) {
      return NextResponse.json({ error: 'No pantry found for this user.' }, { status: 404 });
    }

    const pantryId = memberRecord.pantry_id;

    // --- STEP 2: Get Pantry Details ---
    const { data: pantry } = await supabase
      .from('food_pantries')
      .select('stripe_customer_id, name') // Fetch name for new customer creation
      .eq('pantry_id', pantryId)
      .single();

    let customerId = pantry?.stripe_customer_id;

    // --- STEP 3: Verify or Create Stripe Customer (Self-Healing) ---

    // A. If ID exists, ask Stripe if it's still valid
    if (customerId) {
      try {
        const customer = await stripe.customers.retrieve(customerId);
        if (customer.deleted) {
          console.log("⚠️ Customer deleted in Stripe. Resetting...");
          customerId = null;
        }
      } catch (error) {
        console.log("⚠️ Invalid Customer ID. Resetting...");
        customerId = null;
      }
    }

    // B. If ID is missing or was just reset, create a new one
    if (!customerId) {
      console.log("✨ Creating new Stripe Customer...");
      const newCustomer = await stripe.customers.create({
        email: user.email,
        name: pantry?.name || 'Pantry Admin',
        metadata: {
          supabaseUUID: user.id,
          pantryId: pantryId
        },
      });

      customerId = newCustomer.id;

      // Save the new ID to Supabase immediately
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

      // ✅ FIX: Use this instead of 'automatic_payment_methods'
      // This enables Credit Cards AND Apple Pay / Google Pay automatically
      payment_method_types: ['card'],

      success_url: `${origin}/api/stripe/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/dashboard`,
      metadata: {
        userId: user.id,
        pantryId: pantryId,
        tier: tier
      },
    });

    return NextResponse.json({ url: session.url });

  } catch (err) {
    console.error("Stripe Checkout Error:", err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}