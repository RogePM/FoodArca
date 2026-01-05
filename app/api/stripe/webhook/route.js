import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { PLANS } from '@/lib/plans';

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
    console.error(`❌ Webhook Signature Error: ${error.message}`);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  const session = event.data.object;

  // ---------------------------------------------------------
  // 1. Handle Successful Payment / Upgrade
  // ---------------------------------------------------------
  if (event.type === 'checkout.session.completed' || event.type === 'invoice.paid') {
    // metadata is stored on the session for checkout, or on the subscription for invoices
    const pantryId = session.metadata?.pantryId || session.subscription_details?.metadata?.pantryId;
    const tierKey = session.metadata?.tier || session.subscription_details?.metadata?.tier;

    if (!pantryId || !tierKey) {
      console.log('ℹ️ Webhook received without pantry metadata (Likely a non-pantry payment)');
      return NextResponse.json({ received: true });
    }

    const plan = PLANS[tierKey];
    if (!plan) {
      console.error(`❌ Unknown plan tier: ${tierKey}`);
      return NextResponse.json({ error: 'Unknown plan' }, { status: 400 });
    }

    console.log(`🚀 Upgrading Pantry ${pantryId} to ${plan.name}`);

    const { error } = await supabaseAdmin
      .from('food_pantries')
      .update({ 
        subscription_tier: tierKey,
        stripe_customer_id: session.customer, 
        stripe_subscription_id: session.subscription || session.id,
        max_items_limit: plan.limits.items,
        max_clients_limit: plan.limits.clients,
        max_users_limit: plan.limits.users
      })
      .eq('pantry_id', pantryId);

    if (error) {
      console.error('❌ Supabase update failed:', error);
      return NextResponse.json({ error: 'Database update failed' }, { status: 500 });
    }
  }

  // ---------------------------------------------------------
  // 2. Handle Cancellation
  // ---------------------------------------------------------
  if (event.type === 'customer.subscription.deleted') {
    const subscriptionId = session.id;
    const freePlan = PLANS.pilot; // Revert to base plan

    console.log(`🔻 Subscription ${subscriptionId} deleted. Reverting to Pilot limits.`);

    const { error } = await supabaseAdmin
      .from('food_pantries')
      .update({ 
        subscription_tier: 'pilot',
        max_items_limit: freePlan.limits.items,
        max_clients_limit: freePlan.limits.clients,
        max_users_limit: freePlan.limits.users
      })
      .eq('stripe_subscription_id', subscriptionId);

    if (error) {
      console.error('❌ Supabase downgrade failed:', error);
      return NextResponse.json({ error: 'Database downgrade failed' }, { status: 500 });
    }
  }

  return NextResponse.json({ received: true });
}