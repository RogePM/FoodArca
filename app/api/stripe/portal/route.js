import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { createClient } from '@/utils/supabase/server';

// --- SHARED SECURITY HELPER ---
async function verifyAdminAccess(supabase, userId) {
  // ✅ ACTION: Verify user is an ADMIN and ACTIVE
  const { data: membership, error } = await supabase
    .from('pantry_members')
    .select('pantry_id, role, is_active')
    .eq('user_id', userId)
    .single();

  if (error || !membership) return null;
  
  // Guard: Only admins can manage the subscription portal
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

    // 1. SECURITY: Enforce Admin-only verification
    const pantryId = await verifyAdminAccess(supabase, user.id);
    if (!pantryId) {
      return NextResponse.json({ 
        error: 'Forbidden: Only an active Admin can access the Billing Portal.' 
      }, { status: 403 });
    }

    // 2. Fetch Stripe Customer ID
    const { data: pantry, error: pantryError } = await supabase
      .from('food_pantries')
      .select('stripe_customer_id')
      .eq('pantry_id', pantryId)
      .single();

    if (pantryError || !pantry?.stripe_customer_id) {
      return NextResponse.json({ 
        error: 'No active billing profile found for this organization.' 
      }, { status: 400 });
    }

    // 3. Define the Return URL
    const origin = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const returnUrl = `${origin}/dashboard`; 

    // 4. Create Stripe Portal Session
    // This allows the admin to update cards, view invoices, or change plans
    const session = await stripe.billingPortal.sessions.create({
      customer: pantry.stripe_customer_id,
      return_url: returnUrl,
    });

    console.log(`✅ Stripe Portal Session created for Pantry: ${pantryId}`);
    return NextResponse.json({ url: session.url });

  } catch (err) {
    console.error("❌ Stripe Portal Error:", err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}