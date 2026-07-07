import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import connectDB from '@/lib/db';
import { FoodItem, BarcodeCache } from '@/lib/models/FoodItemModel';
import { logChange } from '@/lib/logger'; 

// --- UTILITY: Round to 3 Decimals ---
const formatQty = (num) => Math.round((num + Number.EPSILON) * 1000) / 1000;

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
// POST: Bulk Add Items
// ----------------------------------------------------------------------
export async function POST(req) {
  try {
    // 1. Authenticate
    const auth = await authenticateRequest(req);
    if (!auth.authenticated) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    const data = await req.json();
    const pantryId = req.headers.get('x-pantry-id');
    if (!pantryId) return NextResponse.json({ message: 'Pantry ID required' }, { status: 400 });

    if (!Array.isArray(data.items) || data.items.length === 0) {
      return NextResponse.json({ message: 'Missing or empty items array' }, { status: 400 });
    }

    // 2. Verify Membership
    const memberData = await verifyPantryMember(auth.supabase, auth.user.id, pantryId);
    if (!memberData) return NextResponse.json({ message: 'Membership not found' }, { status: 403 });
    if (memberData.is_active === false) {
      return NextResponse.json({ message: 'Account is in Read-Only mode.' }, { status: 403 });
    }

    // --- GATEKEEPER START: CHECK LIMITS ---
    const { data: pantrySettings, error: pantryError } = await auth.supabase
        .from('food_pantries')
        .select('subscription_tier, total_items_created, max_items_limit')
        .eq('pantry_id', pantryId)
        .single();

    if (pantryError || !pantrySettings) {
        return NextResponse.json({ message: 'Could not verify pantry limits' }, { status: 500 });
    }

    if (pantrySettings.subscription_tier === 'pilot') {
        const limit = pantrySettings.max_items_limit || 50; 
        if (pantrySettings.total_items_created + data.items.length > limit) {
            return NextResponse.json({ 
                error: 'LIMIT_REACHED', 
                message: `Bulk add would exceed Free Limit (${limit} items).` 
            }, { status: 403 });
        }
    }
    // --- GATEKEEPER END ---

    // 3. Connect to MongoDB
    await connectDB();

    // 4. Sanitize and prepare items for bulk insert
    const itemsToInsert = [];
    const barcodeCacheUpdates = [];

    for (const item of data.items) {
      if (!item.name || !item.category || !item.quantity) {
         continue; // skip invalid items
      }

      const quantityToAdd = formatQty(parseFloat(item.quantity));
      let searchDate = null;
      if (item.expirationDate) {
        const d = new Date(item.expirationDate);
        d.setUTCHours(0, 0, 0, 0);
        searchDate = d;
      }
      const barcode = item.barcode?.trim() || `SYS-${Date.now().toString().slice(-8)}-${Math.random().toString(36).substring(2,6)}`;

      itemsToInsert.push({
        name: item.name,
        category: item.category,
        quantity: quantityToAdd,
        unit: item.unit || 'unit',
        pantryId,
        barcode,
        expirationDate: searchDate || null,
        storageLocation: item.storageLocation || '',
        notes: item.notes || '',
        lastModified: new Date()
      });

      if (barcode && !barcode.startsWith('INT-') && !barcode.startsWith('SYS-')) {
        barcodeCacheUpdates.push({
          updateOne: {
            filter: { barcode, pantryId },
            update: { $set: { name: item.name, category: item.category, lastModified: new Date(), pantryId } },
            upsert: true
          }
        });
      }
    }

    if (itemsToInsert.length === 0) {
      return NextResponse.json({ message: 'No valid items to insert' }, { status: 400 });
    }

    // 5. Execute Single Native MongoDB Bulk Insert
    const insertedDocs = await FoodItem.insertMany(itemsToInsert);

    // 6. Update Barcode Cache in bulk if applicable
    if (barcodeCacheUpdates.length > 0) {
      try {
        await BarcodeCache.bulkWrite(barcodeCacheUpdates);
      } catch (cacheErr) {
        console.error("Non-fatal error updating barcode cache:", cacheErr);
      }
    }

    // 7. Increment Usage
    // We loop the RPC because we cannot guarantee the Postgres function supports a bulk p_amount parameter
    for (let i = 0; i < itemsToInsert.length; i++) {
      const { error: rpcError } = await auth.supabase.rpc('increment_pantry_usage', {
          p_pantry_id: pantryId,
          p_resource_type: 'item'
      });
      if (rpcError) console.error("Failed to increment item usage counter:", rpcError);
    }

    // 8. Log the batch creation (Logging as a single batch action if supported, or generic log)
    try {
      await logChange('added_batch', { batchSize: itemsToInsert.length }, {}, pantryId);
    } catch(err) {
      // ignore log errors to not break response
    }

    return NextResponse.json({ message: 'Bulk insert successful', count: insertedDocs.length }, { status: 201 });
  } catch (error) {
    console.error('POST /bulk Error:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
