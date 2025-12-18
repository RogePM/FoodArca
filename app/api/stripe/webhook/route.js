import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { PLANS } from '@/lib/plans'; // 🔥 Import shared config

export async function POST(req) {
  const body = await req.text();
  const signature = (await headers()).get('Stripe-Signature');

  let event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (error) {
    console.error(`Webhook Error: ${error.message}`);
    return NextResponse.json({ error: `Webhook Error: ${error.message}` }, { status: 400 });
  }

  const session = event.data.object;

  // ---------------------------------------------------------
  // 1. Handle Successful Payment (Upgrade)
  // ---------------------------------------------------------
  if (event.type === 'checkout.session.completed') {
    const pantryId = session.metadata?.pantryId;
    const tierKey = session.metadata?.tier; // e.g. 'basic' or 'pro'

    if (!pantryId || !tierKey) {
        console.error('❌ Missing metadata (pantryId or tier)');
        return NextResponse.json({ error: 'Missing metadata' }, { status: 400 });
    }

    // Lookup plan details from your plans.js file
    const plan = PLANS[tierKey];

    if (!plan) {
        console.error(`❌ Unknown plan tier: ${tierKey}`);
        return NextResponse.json({ error: 'Unknown plan' }, { status: 400 });
    }

    console.log(`✅ Payment Received. Upgrading Pantry ${pantryId} to ${plan.name}`);

    const { data, error } = await supabaseAdmin
      .from('food_pantries')
      .update({ 
        subscription_tier: tierKey,
        stripe_customer_id: session.customer, 
        stripe_subscription_id: session.subscription,
        
        // 🔥 DYNAMIC LIMITS: Read directly from plans.js
        max_items_limit: plan.limits.items,
        max_clients_limit: plan.limits.clients,
        max_users_limit: plan.limits.users
      })
      .eq('pantry_id', pantryId)
      .select();

    if (error) {
      console.error('❌ Database update failed:', error);
    } else {
      console.log('🎉 Pantry Upgraded Successfully:', data);
    }
  }

  // ---------------------------------------------------------
  // 2. Handle Cancellation (Revert to Pilot/Free)
  // ---------------------------------------------------------
  if (event.type === 'customer.subscription.deleted') {
    const subscriptionId = session.id;
    
    // We revert them to the "Pilot" (Free) plan limits
    const freePlan = PLANS.pilot;

    console.log(`🔻 Subscription deleted. Downgrading ID: ${subscriptionId} to Pilot`);

    const { error } = await supabaseAdmin
      .from('food_pantries')
      .update({ 
        subscription_tier: 'pilot',
        // Reset limits to Pilot defaults
        max_items_limit: freePlan.limits.items,
        max_clients_limit: freePlan.limits.clients,
        max_users_limit: freePlan.limits.users
      })
      .eq('stripe_subscription_id', subscriptionId);

    if (error) console.error('❌ Supabase downgrade failed:', error);
  }

  return NextResponse.json({ received: true });
}