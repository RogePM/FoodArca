import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import connectDB from '@/lib/db';
import { FoodItem, BarcodeCache } from '@/lib/models/FoodItemModel';
import { logChange } from '@/lib/logger'; 

// ----------------------------------------------------------------------
// 1. HELPER FUNCTIONS (These were missing!)
// ----------------------------------------------------------------------

async function authenticateRequest(req) {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    { cookies: { getAll() { return cookieStore.getAll(); } } }
  );

  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return { authenticated: false, user: null, supabase: null };

  return { authenticated: true, user, supabase };
}

async function verifyPantryMember(supabase, userId, pantryId) {
  const { data, error } = await supabase
    .from('pantry_members')
    .select('is_active, role')
    .eq('user_id', userId)
    .eq('pantry_id', pantryId)
    .single();

  if (error || !data) return null;
  return data;
}

// ----------------------------------------------------------------------
// 2. GET: Fetch Inventory
// ----------------------------------------------------------------------
export async function GET(req) {
  try {
    const auth = await authenticateRequest(req);
    if (!auth.authenticated) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    const pantryId = req.headers.get('x-pantry-id');
    if (!pantryId) return NextResponse.json({ message: 'Pantry ID required' }, { status: 400 });

    const membership = await verifyPantryMember(auth.supabase, auth.user.id, pantryId);
    if (!membership) return NextResponse.json({ message: 'Access Denied: Not a member' }, { status: 403 });

    const { searchParams } = new URL(req.url);
    const sortBy = searchParams.get('sort') || 'expirationDate';
    const order = searchParams.get('order') === 'desc' ? -1 : 1;

    await connectDB();
    const foods = await FoodItem.find({ pantryId }).sort({ [sortBy]: order });

    return NextResponse.json({ count: foods.length, data: foods });
  } catch (error) {
    return NextResponse.json({ message: 'Server Error' }, { status: 500 });
  }
}

// ----------------------------------------------------------------------
// 3. POST: Add Item (WITH LIMIT CHECK)
// ----------------------------------------------------------------------
export async function POST(req) {
  try {
    // 1. Authenticate
    const auth = await authenticateRequest(req);
    if (!auth.authenticated) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    const data = await req.json();
    const pantryId = req.headers.get('x-pantry-id');
    if (!pantryId) return NextResponse.json({ message: 'Pantry ID required' }, { status: 400 });

    // 2. Verify Membership
    const memberData = await verifyPantryMember(auth.supabase, auth.user.id, pantryId);
    if (!memberData) return NextResponse.json({ message: 'Membership not found' }, { status: 403 });
    if (memberData.is_active === false) {
      return NextResponse.json({ message: 'Account is in Read-Only mode.' }, { status: 403 });
    }

    if (!data.name || !data.category || !data.quantity) {
      return NextResponse.json({ message: 'Missing required fields' }, { status: 400 });
    }

    // --- 🚨 GATEKEEPER START: CHECK LIMITS 🚨 ---
    // Fetch subscription details from Supabase
    const { data: pantrySettings, error: pantryError } = await auth.supabase
        .from('food_pantries')
        .select('subscription_tier, total_items_created, max_items_limit')
        .eq('pantry_id', pantryId)
        .single();

    if (pantryError || !pantrySettings) {
        return NextResponse.json({ message: 'Could not verify pantry limits' }, { status: 500 });
    }

    // Logic: If Free Tier ('pilot') AND they hit the max limit, stop them.
    if (pantrySettings.subscription_tier === 'pilot') {
        const limit = pantrySettings.max_items_limit || 50; 
        
        // CRITICAL CHECK
        if (pantrySettings.total_items_created >= limit) {
            return NextResponse.json({ 
                error: 'LIMIT_REACHED', 
                message: `Free Limit Reached (${limit} items).` 
            }, { status: 403 });
        }
    }
    // --- 🚨 GATEKEEPER END 🚨 ---


    // 3. Connect to MongoDB
    await connectDB();

    const quantityToAdd = parseFloat(data.quantity);
    let searchDate = null;
    if (data.expirationDate) {
      const d = new Date(data.expirationDate);
      d.setUTCHours(0, 0, 0, 0);
      searchDate = d;
    }
    const barcode = data.barcode?.trim() || `SYS-${Date.now().toString().slice(-8)}`;

    // 4. Try to find existing batch (Update) vs Create New
    let isNewItemCreated = false;

    let foodItem = await FoodItem.findOneAndUpdate(
      {
        pantryId,
        barcode: barcode,
        expirationDate: searchDate ? searchDate : { $exists: false }
      },
      {
        $inc: { quantity: quantityToAdd },
        $set: {
          name: data.name,
          category: data.category,
          storageLocation: data.storageLocation || '',
          lastModified: new Date()
        }
      },
      { new: true }
    );

    if (!foodItem) {
      // If not found, CREATE NEW
      foodItem = await FoodItem.create({
        ...data,
        pantryId,
        barcode,
        expirationDate: searchDate || data.expirationDate,
        lastModified: new Date()
      });
      isNewItemCreated = true;
    }

    // --- 💰 SPEND TOKEN: INCREMENT USAGE 💰 ---
    if (isNewItemCreated) {
        const { error: rpcError } = await auth.supabase.rpc('increment_pantry_usage', {
            p_pantry_id: pantryId,
            p_resource_type: 'item'
        });
        
        if (rpcError) {
            console.error("Failed to increment item usage counter:", rpcError);
        }
    }

    // 5. Logging & Caching
    await logChange('added', foodItem, {}, pantryId);

    if (barcode && !barcode.startsWith('INT-') && !barcode.startsWith('SYS-')) {
      await BarcodeCache.findOneAndUpdate(
        { barcode, pantryId },
        { name: data.name, category: data.category, lastModified: new Date(), pantryId },
        { upsert: true }
      );
    }

    return NextResponse.json(foodItem, { status: 201 });
  } catch (error) {
    console.error('POST Error:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}