import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { createClient } from '@/utils/supabase/server';

export async function POST(req) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // --- STEP 1: Find the Pantry ID (Fixing the owner_id bug) ---
    const { data: memberRecord } = await supabase
      .from('pantry_members')
      .select('pantry_id')
      .eq('user_id', user.id)
      .single();

    if (!memberRecord?.pantry_id) {
        return NextResponse.json({ error: 'No pantry found.' }, { status: 404 });
    }

    // --- STEP 2: Get the Stripe Customer ID ---
    const { data: pantry } = await supabase
      .from('food_pantries')
      .select('stripe_customer_id')
      .eq('pantry_id', memberRecord.pantry_id)
      .single();

    if (!pantry?.stripe_customer_id) {
        return NextResponse.json({ error: 'No subscription found' }, { status: 400 });
    }

    // --- STEP 3: Define the Return URL Safely ---
    const origin = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    
    // Note: Stripe generally accepts hashes (#Settings) in return_urls, 
    // but redirecting to the main dashboard is safer if the hash fails.
    const returnUrl = `${origin}/dashboard`; 

    // 4. Create Portal Session
    const session = await stripe.billingPortal.sessions.create({
      customer: pantry.stripe_customer_id,
      return_url: returnUrl,
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error("Stripe Portal Error:", err);
    return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
  }
}