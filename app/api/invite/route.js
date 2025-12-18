import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import connectDB from '@/lib/db';
import { FoodItem, BarcodeCache } from '@/lib/models/FoodItemModel';
import { ChangeLog } from '@/lib/models/ChangeLogModel';

// --- HELPER: Log Changes ---
const logChange = async (actionType, item, changes = null, metadata = {}, pantryId) => {
  try {
    let qty = 0;
    if (actionType === 'added') qty = item.quantity;
    else if (actionType === 'distributed') qty = metadata.removedQuantity || 0;

    let weight = 0;
    const unit = (metadata.unit || item.unit || 'units').toLowerCase();
    if (unit === 'lbs') weight = qty;
    else if (unit === 'kg') weight = qty * 2.20462;
    else if (unit === 'oz') weight = qty / 16;
    else weight = qty * 1;

    const value = weight * 2.50;
    const familySize = metadata.familySize || 1;

    await ChangeLog.create({
      pantryId,
      actionType,
      itemId: item._id,
      itemName: item.name,
      category: item.category,
      previousQuantity: actionType === 'added' ? 0 : (item.quantity + (actionType === 'distributed' ? qty : 0)),
      quantityChanged: qty,
      newQuantity: item.quantity,
      unit: item.unit,
      distributionReason: metadata.reason,
      clientName: metadata.clientName,
      clientId: metadata.clientId,
      removedQuantity: qty,
      impactMetrics: {
        peopleServed: actionType === 'distributed' ? familySize : 0,
        estimatedValue: parseFloat(value.toFixed(2)),
        standardizedWeight: parseFloat(weight.toFixed(2)),
        wasteDiverted: actionType === 'added'
      },
      tags: metadata.reason === 'emergency' ? ['Urgent'] : [],
      timestamp: new Date()
    });
  } catch (e) {
    console.error("Failed to log change:", e);
  }
};

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

  // ✅ Use getUser() instead of getSession()
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    return { authenticated: false, user: null, supabase: null, error: 'Unauthorized' };
  }

  // 🔥 FIX: RETURN THE SUPABASE CLIENT HERE
  return { authenticated: true, user, supabase, error: null };
}

// ----------------------------------------------------------------------------------
// --- GET: Fetch Inventory ---
// ----------------------------------------------------------------------------------
export async function GET(req) {
  try {
    const auth = await authenticateRequest(req);
    if (!auth.authenticated) return NextResponse.json({ message: auth.error }, { status: 401 });

    const pantryId = req.headers.get('x-pantry-id');
    if (!pantryId) return NextResponse.json({ message: 'Pantry ID required' }, { status: 400 });

    const { searchParams } = new URL(req.url);
    const sortBy = searchParams.get('sort') || 'expirationDate';
    const order = searchParams.get('order') === 'desc' ? -1 : 1;

    await connectDB();

    const foods = await FoodItem.find({ pantryId })
      .sort({ [sortBy]: order });

    return NextResponse.json({ count: foods.length, data: foods });
  } catch (error) {
    console.error('GET Error:', error);
    return NextResponse.json({ message: 'Server Error' }, { status: 500 });
  }
}

// ----------------------------------------------------------------------------------
// --- POST: Add Item ---
// ----------------------------------------------------------------------------------
export async function POST(req) {
  try {
    // ✅ AUTH CHECK
    const auth = await authenticateRequest(req);
    if (!auth.authenticated) {
      console.log('❌ POST /api/foods - Unauthorized');
      return NextResponse.json({ message: auth.error }, { status: 401 });
    }

    const data = await req.json();
    const pantryId = req.headers.get('x-pantry-id');

    if (!pantryId) {
      console.log('❌ POST /api/foods - No pantry ID');
      return NextResponse.json({ message: 'Pantry ID is required' }, { status: 400 });
    }

    // ================================ READ-ONLY USER CHECK ==============================
    // 🔥 THIS LINE WAS CRASHING BECAUSE AUTH.SUPABASE WAS MISSING
    const { data: memberData, error: memberError } = await auth.supabase
      .from('pantry_members')
      .select('is_active, role')
      .eq('user_id', auth.user.id)
      .eq('pantry_id', pantryId)
      .single();

    if (memberError || !memberData) {
      return NextResponse.json({ message: 'Membership not found' }, { status: 403 });
    }

    if (memberData.is_active === false) {
      console.log(`⛔ Blocked Read-Only User: ${auth.user.email}`);
      return NextResponse.json(
        { message: 'Your account is in Read-Only mode. Ask your Admin to activate you.' },
        { status: 403 }
      );
    }
    // ====================================================================================

    if (!data.name || !data.category || !data.quantity) {
      return NextResponse.json({ message: 'Please provide Name, Category, and Quantity' }, { status: 400 });
    }

    console.log('✅ POST /api/foods - User:', auth.user.email, 'Adding:', data.name);

    await connectDB();

    // 1. Prepare Data
    const validUnits = ['units', 'lbs', 'kg', 'oz'];
    const unit = validUnits.includes(data.unit) ? data.unit : 'units';
    let searchDate = null;
    if (data.expirationDate) {
      const d = new Date(data.expirationDate);
      d.setUTCHours(0, 0, 0, 0);
      searchDate = d;
    }
    const barcode = data.barcode?.trim() || `SYS-${Date.now().toString().slice(-8)}`;

    // 2. CHECK IF BATCH ALREADY EXISTS
    const existingItem = await FoodItem.findOne({
      pantryId,
      barcode: barcode,
      expirationDate: searchDate ? searchDate : { $exists: false }
    });

    // 3. CHECK CACHE
    const isBarcodeRegistered = await BarcodeCache.findOne({
      barcode: barcode,
      pantryId
    });

    // --- 4. GATEKEEPER LOGIC ---
    if (!existingItem && !isBarcodeRegistered) {
      // 🔥 FIX: Use Service Role Key for admin queries, not Anon key
      const supabaseAdmin = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY // Ensure this ENV is set
      );

      const { data: pantryData, error: pantryError } = await supabaseAdmin
        .from('food_pantries')
        .select('max_items_limit')
        .eq('pantry_id', pantryId)
        .single();

      if (pantryError || !pantryData) {
        console.error('❌ Could not fetch pantry limits:', pantryError);
        return NextResponse.json({ message: 'Could not verify plan limits.' }, { status: 500 });
      }

      const maxLimit = pantryData.max_items_limit;

      if (maxLimit < 999999) {
        const currentBarcodeCount = await BarcodeCache.countDocuments({ pantryId });
        console.log(`📊 Current items: ${currentBarcodeCount}/${maxLimit}`);

        if (currentBarcodeCount >= maxLimit) {
          console.log('⛔ Plan limit reached');
          return NextResponse.json(
            { message: `Plan limit reached (${maxLimit} items). Please upgrade.` },
            { status: 403 }
          );
        }
      }
    }

    // 5. EXECUTE ACTION
    let foodItem;
    const quantityToAdd = parseFloat(data.quantity);

    if (existingItem) {
      console.log('📦 Merging with existing batch');

      existingItem.name = data.name;
      existingItem.category = data.category;
      existingItem.quantity += quantityToAdd;
      
      // ✅ Update fields on merge
      if (data.storageLocation) existingItem.storageLocation = data.storageLocation;
      if (data.notes) existingItem.notes = data.notes;

      existingItem.lastModified = new Date();

      foodItem = await existingItem.save();
    } else {
      console.log('✨ Creating new batch');
      const newItemData = {
        ...data,
        pantryId,
        unit: unit,
        barcode: barcode,
        expirationDate: searchDate || data.expirationDate,
        storageLocation: data.storageLocation || '',
        notes: data.notes || '',
        lastModified: new Date(),
      };
      foodItem = await FoodItem.create(newItemData);

      await logChange('added', foodItem, null, {}, pantryId);
    }

    // 6. UPDATE CACHE
    if (barcode && !barcode.startsWith('INT-') && !barcode.startsWith('SYS-')) {
      await BarcodeCache.findOneAndUpdate(
        { barcode: barcode, pantryId },
        {
          name: data.name,
          category: data.category,
          storageLocation: data.storageLocation || '', // Cache location too
          lastModified: new Date(),
          pantryId
        },
        { upsert: true, new: true }
      );
      console.log('🧠 Barcode Cache Updated');
    }

    console.log('✅ POST /api/foods - Success');
    return NextResponse.json(foodItem, { status: 201 });

  } catch (error) {
    console.error('❌ POST /api/foods - Error:', error);
    if (error.code === 11000) {
      return NextResponse.json({ message: 'Barcode logic error (Duplicate)' }, { status: 400 });
    }
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}