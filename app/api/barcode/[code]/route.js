import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import connectDB from '@/lib/db';
import { FoodItem, BarcodeCache } from '@/lib/models/FoodItemModel';

// --- AUTHENTICATION HELPER ---
async function authenticateRequest(req) {
  const cookieStore = await cookies();
  
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() { return cookieStore.getAll(); },
      },
    }
  );

  const { data: { user }, error } = await supabase.auth.getUser();
  
  if (error || !user) {
    return { authenticated: false, user: null, supabase: null, error: 'Unauthorized' };
  }

  // ✅ Return supabase client so we can query the database
  return { authenticated: true, user, supabase, error: null };
}

export async function GET(req, { params }) {
  try {
    // 1. Auth Check
    const auth = await authenticateRequest(req);
    if (!auth.authenticated) {
      return NextResponse.json({ message: auth.error }, { status: 401 });
    }

    const { code } = await params;
    const pantryId = req.headers.get('x-pantry-id');

    if (!pantryId) {
      return NextResponse.json({ message: 'Pantry ID is required' }, { status: 400 });
    }

    // ================================ 🛡️ SECURITY CHECK ================================
    // ACTION: Verify the user actually belongs to this pantry
    const { data: membership, error: memberError } = await auth.supabase
      .from('pantry_members')
      .select('is_active')
      .eq('user_id', auth.user.id)
      .eq('pantry_id', pantryId)
      .single();

    if (memberError || !membership) {
      console.log(`🚫 Security Alert: ${auth.user.email} attempted unauthorized access to pantry ${pantryId}`);
      return NextResponse.json({ message: 'Access Denied: You are not a member of this pantry.' }, { status: 403 });
    }
    // ====================================================================================

    if (!code) {
      return NextResponse.json({ message: 'Barcode is required' }, { status: 400 });
    }

    await connectDB();

    // 2. Smart Lookup Logic
    // Check Barcode Cache first (optimized for speed)
    let result = await BarcodeCache.findOne({ barcode: code, pantryId });

    // If not in cache, check the actual inventory
    if (!result) {
      const existingItem = await FoodItem.findOne({ barcode: code, pantryId });
      if (existingItem) {
        result = existingItem;
      }
    }

    if (result) {
      return NextResponse.json({ found: true, data: result });
    }

    return NextResponse.json({ found: false, data: null });

  } catch (error) {
    console.error('❌ GET /api/barcode - Error:', error);
    return NextResponse.json({ message: 'Server Error' }, { status: 500 });
  }
}