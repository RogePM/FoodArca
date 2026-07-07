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
    const pantryId = session.metadata?.pantryId || session.subscription_details?.metadata?.pantryId;
    const tierKey = session.metadata?.tier || session.subscription_details?.metadata?.tier;

    if (!pantryId || !tierKey) {
      console.log('ℹ️ Webhook received without organization metadata');
      return NextResponse.json({ received: true });
    }

    const plan = PLANS[tierKey];
    if (!plan) {
      console.error(`❌ Unknown plan tier: ${tierKey}`);
      return NextResponse.json({ error: 'Unknown plan' }, { status: 400 });
    }

    console.log(`🚀 Upgrading Organization ${pantryId} to ${plan.name}`);

    const { error } = await supabaseAdmin
      .from('organizations')
      .update({ 
        plan_type: tierKey
      })
      .eq('id', pantryId);

    if (error) {
      console.error('❌ Supabase update failed:', error);
      return NextResponse.json({ error: 'Database update failed' }, { status: 500 });
    }
  }

  // ---------------------------------------------------------
  // 2. Handle Cancellation
  // ---------------------------------------------------------
  if (event.type === 'customer.subscription.deleted') {
    const customerId = session.customer;
    let pantryId = session.metadata?.pantryId;

    if (!pantryId && customerId) {
      try {
        const customer = await stripe.customers.retrieve(customerId);
        pantryId = customer?.metadata?.pantryId;
      } catch (err) {
        console.error("Failed to retrieve customer for cancellation:", err);
      }
    }

    if (pantryId) {
      console.log(`🔻 Subscription deleted for Org ${pantryId}. Reverting to pilot plan.`);
      const { error } = await supabaseAdmin
        .from('organizations')
        .update({ 
          plan_type: 'pilot'
        })
        .eq('id', pantryId);

      if (error) {
        console.error('❌ Supabase downgrade failed:', error);
        return NextResponse.json({ error: 'Database downgrade failed' }, { status: 500 });
      }
    }
  }

  return NextResponse.json({ received: true });
}