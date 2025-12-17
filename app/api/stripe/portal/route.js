import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { createClient } from '@/utils/supabase/server';

export async function POST(req) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // 1. Get their Stripe Customer ID from DB
    const { data: profile } = await supabase
      .from('food_pantries')
      .select('stripe_customer_id')
      .eq('owner_id', user.id)
      .single();

    if (!profile?.stripe_customer_id) {
        return NextResponse.json({ error: 'No subscription found' }, { status: 400 });
    }

    // 2. Create Portal Session
    const session = await stripe.billingPortal.sessions.create({
      customer: profile.stripe_customer_id,
      return_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings`,
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error("Stripe Portal Error:", err);
    return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
  }
}