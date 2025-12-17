import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { createClient } from '@/utils/supabase/server';

export async function POST(req) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { priceId } = body; 

    // 1. Get the organization profile
    const { data: profile } = await supabase
      .from('food_pantries')
      .select('stripe_customer_id, email') 
      .eq('owner_id', user.id)
      .single();

    let customerId = profile?.stripe_customer_id;

    // 2. Create Stripe Customer if missing
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: {
          supabaseUUID: user.id, 
        },
      });
      customerId = customer.id;

      await supabase
        .from('food_pantries')
        .update({ stripe_customer_id: customerId })
        .eq('owner_id', user.id);
    }

    // 🔥 FIX: Define the domain safely
    // If the ENV variable is missing, default to localhost:3000
    const origin = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    // 3. Create Checkout Session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      line_items: [{ price: priceId, quantity: 1 }],
      mode: 'subscription',
      // Use the safe 'origin' variable here
      success_url: `${origin}/dashboard/settings?success=true`,
      cancel_url: `${origin}/dashboard/settings?canceled=true`,
      metadata: {
        userId: user.id,
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error("Stripe Checkout Error:", err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}