import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { mapOpenFoodFactsCategory } from '@/lib/categoryMapper';
// import connectDB from '@/lib/db'; // 🛑 Commented out for test
// import { FoodItem, BarcodeCache } from '@/lib/models/FoodItemModel'; // 🛑 Commented out for test

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
  return { authenticated: true, user, supabase, error: null };
}

// --- CATEGORY MAPPER HELPER ---

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
    const { data: membership, error: memberError } = await auth.supabase
      .from('pantry_members')
      .select('is_active')
      .eq('user_id', auth.user.id)
      .eq('pantry_id', pantryId)
      .single();

    if (memberError || !membership) {
      console.log(`🚫 Security Alert: ${auth.user.email} attempted unauthorized access to pantry ${pantryId}`);
      return NextResponse.json({ message: 'Access Denied.' }, { status: 403 });
    }
    // ====================================================================================

    if (!code) {
      return NextResponse.json({ message: 'Barcode is required' }, { status: 400 });
    }

    // 🛑 DATABASE BYPASS: Commented out DB connection and cache lookups
    /*
    await connectDB();
    let result = await BarcodeCache.findOne({ barcode: code, pantryId });
    if (!result) {
      const existingItem = await FoodItem.findOne({ barcode: code, pantryId });
      if (existingItem) {
        result = existingItem;
      }
    }
    if (result) {
      console.log(`✅ [BARCODE] Found ${code} in Local Cache!`); 
      return NextResponse.json({ found: true, source: 'local', data: result });
    }
    */

    // 3. Fallback: Open Food Facts API (TESTING DIRECTLY)
    try {
      console.log(`🌐 [TEST MODE] Fetching ${code} from Open Food Facts directly...`);
      
      const offResponse = await fetch(`https://world.openfoodfacts.org/api/v2/product/${code}.json`, {
        headers: { 'User-Agent': 'MyPantryApp - Web - Version 1.0' }
      });

      const offData = await offResponse.json();

      if (offData.status === 1 && offData.product) {
        const fetchedName = offData.product.product_name || '';
        const fetchedCategory = mapOpenFoodFactsCategory(offData.product.categories_tags);

        // 🛑 DATABASE BYPASS: Commented out DB creation
        /*
        const newCacheItem = await BarcodeCache.create({
          barcode: code,
          pantryId: pantryId,
          name: fetchedName,
          category: fetchedCategory,
        });
        */

        console.log(`✅ [TEST MODE] Successfully grabbed: ${fetchedName} (${fetchedCategory})`);

        // Return the formatted object directly to the frontend
        return NextResponse.json({
          found: true,
          source: 'open_food_facts_test',
          data: {
             barcode: code,
             name: fetchedName,
             category: fetchedCategory
          }
        });
      }
    } catch (offError) {
      console.error('⚠️ Open Food Facts fetch failed:', offError);
    }

    // 5. Completely unknown barcode
    console.log(`❌ [TEST MODE] Barcode ${code} not found in Open Food Facts`);
    return NextResponse.json({ found: false, data: null });

  } catch (error) {
    console.error('❌ GET /api/barcode - Error:', error);
    return NextResponse.json({ message: 'Server Error' }, { status: 500 });
  }
}