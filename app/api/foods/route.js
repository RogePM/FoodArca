import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

// --- UTILITY: Round to 3 Decimals ---
const formatQty = (num) => Math.round((Number(num) + Number.EPSILON) * 1000) / 1000;

function normalizeUnit(raw) {
  const u = String(raw || 'count').trim().toLowerCase();
  const map = {
    'oz': 'oz', 'ounce': 'oz', 'ounces': 'oz',
    'fl oz': 'fl_oz', 'fl_oz': 'fl_oz', 'fluid oz': 'fl_oz', 'ml': 'fl_oz', 'milliliter': 'fl_oz', 'milliliters': 'fl_oz',
    'lbs': 'lbs', 'lb': 'lbs', 'pound': 'lbs', 'pounds': 'lbs',
    'kg': 'kg', 'kilo': 'kg', 'kilogram': 'kg', 'kilograms': 'kg',
    'g': 'oz', 'gram': 'oz', 'grams': 'oz', 'mg': 'oz', 'milligram': 'oz', 'milligrams': 'oz',
    'gal': 'gallon', 'gallon': 'gallon', 'gallons': 'gallon', 'l': 'gallon', 'liter': 'gallon', 'liters': 'gallon', 'litre': 'gallon', 'litres': 'gallon',
    'count': 'count', 'units': 'count', 'unit': 'count', 'item': 'count', 'items': 'count',
    'each': 'count', 'ct': 'count', 'piece': 'count', 'pieces': 'count',
    'can': 'count', 'cans': 'count',
    'box': 'count', 'boxes': 'count',
    'bag': 'count', 'bags': 'count',
    'jar': 'count', 'jars': 'count',
    'pack': 'count', 'packs': 'count', 'packet': 'count', 'packets': 'count',
    'case': 'count', 'cases': 'count',
    'bottle': 'count', 'bottles': 'count',
  };
  return map[u] ?? 'count';
}

function normalizeExpPrecision(raw) {
  const p = String(raw || 'unknown').trim().toLowerCase();
  if (p === 'exact' || p === 'day' || p === 'date') return 'day';
  if (p === 'month') return 'month';
  return 'unknown';
}

function normalizeSourceType(raw) {
  const s = String(raw || 'donation').trim().toLowerCase();
  const map = {
    'donation': 'donation', 'donate': 'donation',
    'purchased': 'purchased', 'purchase': 'purchased', 'bought': 'purchased',
    'usda': 'usda_commodity', 'usda_commodity': 'usda_commodity', 'usda commodity': 'usda_commodity', 'tefap': 'usda_commodity', 'commodity': 'usda_commodity',
    'retail_rescue': 'retail_rescue', 'rescue': 'retail_rescue', 'retail rescue': 'retail_rescue',
  };
  return map[s] ?? 'donation';
}

// Resolve Category ID without violating RLS (categories is a shared global reference table, no INSERT allowed for normal users)
async function resolveCategoryId(supabase, catInput) {
  try {
    const inputLower = String(catInput || '').trim().toLowerCase();
    let possibleNames = [String(catInput || '').trim()];
    
    if (inputLower.includes('canned') || inputLower.includes('cylinder')) {
      possibleNames.push('Canned Goods', 'canned_goods', 'canned');
    } else if (inputLower.includes('bev') || inputLower.includes('water') || inputLower.includes('drink') || inputLower.includes('juice') || inputLower.includes('soda') || inputLower.includes('coffee') || inputLower.includes('tea')) {
      possibleNames.push('Beverages', 'beverages');
    } else if (inputLower.includes('dry') || inputLower.includes('grain') || inputLower.includes('pasta') || inputLower.includes('cereal') || inputLower.includes('rice') || inputLower.includes('bread') || inputLower.includes('archive')) {
      possibleNames.push('Dry Goods', 'dry_goods');
    } else if (inputLower.includes('froz') || inputLower.includes('snow') || inputLower.includes('ice')) {
      possibleNames.push('Frozen Food', 'frozen_food');
    } else if (inputLower.includes('prod') || inputLower.includes('fruit') || inputLower.includes('veg') || inputLower.includes('fresh') || inputLower.includes('carrot')) {
      possibleNames.push('Produce', 'produce');
    } else if (inputLower.includes('prot') || inputLower.includes('meat') || inputLower.includes('beef') || inputLower.includes('chicken') || inputLower.includes('fish') || inputLower.includes('pork') || inputLower.includes('seafood')) {
      possibleNames.push('Proteins', 'proteins');
    } else if (inputLower.includes('bak') || inputLower.includes('snack') || inputLower.includes('chip') || inputLower.includes('cook') || inputLower.includes('croissant') || inputLower.includes('cracker')) {
      possibleNames.push('Bakery & Snacks', 'bakery_snacks', 'Bakery and Snacks');
    } else if (inputLower.includes('dair') || inputLower.includes('milk') || inputLower.includes('cheese') || inputLower.includes('yogurt')) {
      possibleNames.push('Dairy', 'dairy');
    } else if (inputLower.includes('hyg') || inputLower.includes('soap') || inputLower.includes('shamp') || inputLower.includes('clean') || inputLower.includes('bubble') || inputLower.includes('personal')) {
      possibleNames.push('Hygiene', 'hygiene');
    } else {
      possibleNames.push('Other', 'other', 'General', 'general');
    }
    possibleNames = [...new Set(possibleNames)];

    const { data: existingCats } = await supabase.from('categories').select('id, name');
    if (existingCats && existingCats.length > 0) {
      const match = existingCats.find(c => 
        possibleNames.some(p => c.name.toLowerCase() === p.toLowerCase())
      ) || existingCats.find(c => c.name.toLowerCase() === 'other' || c.name.toLowerCase() === 'general') || existingCats[0];
      
      if (match) return match.id;
    }
  } catch (err) {
    console.error("resolveCategoryId error:", err);
  }
  return null;
}

// ----------------------------------------------------------------------
// 1. HELPER FUNCTIONS
// ----------------------------------------------------------------------
async function authenticateRequest() {
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

async function resolveLocationAndOrg(supabase, pantryId) {
  if (!pantryId) return null;
  // First check if pantryId matches a location ID
  const { data: loc } = await supabase
    .from('locations')
    .select('id, organization_id')
    .eq('id', pantryId)
    .maybeSingle();

  if (loc) {
    return { locationId: loc.id, orgId: loc.organization_id };
  }

  // Otherwise assume pantryId is an organization ID, get its first location
  const { data: firstLoc } = await supabase
    .from('locations')
    .select('id, organization_id')
    .eq('organization_id', pantryId)
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle();

  if (firstLoc) {
    return { locationId: firstLoc.id, orgId: firstLoc.organization_id };
  }

  return null;
}

// ----------------------------------------------------------------------
// 2. GET: Fetch Inventory (by location)
// ----------------------------------------------------------------------
export async function GET(req) {
  try {
    const auth = await authenticateRequest();
    if (!auth.authenticated) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    const pantryId = req.headers.get('x-pantry-id');
    if (!pantryId) return NextResponse.json({ message: 'Pantry ID required' }, { status: 400 });

    const resolved = await resolveLocationAndOrg(auth.supabase, pantryId);
    if (!resolved) return NextResponse.json({ message: 'Location not found' }, { status: 404 });
    const { locationId, orgId } = resolved;

    // Verify membership in user_organizations
    const { data: membership } = await auth.supabase
      .from('user_organizations')
      .select('role, status')
      .eq('user_id', auth.user.id)
      .eq('organization_id', orgId)
      .eq('status', 'active')
      .maybeSingle();

    if (!membership) return NextResponse.json({ message: 'Access Denied: Not a member' }, { status: 403 });

    const { searchParams } = new URL(req.url);
    const sortBy = searchParams.get('sort') || 'expiration_date';
    const orderAsc = searchParams.get('order') !== 'desc';
    const validSortColumns = ['expiration_date', 'quantity', 'received_date', 'created_at', 'source_type'];
    const sortColumn = validSortColumns.includes(sortBy) ? sortBy : 'expiration_date';

    // Query inventory_batches joined with catalog_items and categories
    const { data: batches, error: batchErr } = await auth.supabase
      .from('inventory_batches')
      .select(`
        id,
        quantity,
        expiration_date,
        expiration_precision,
        source_type,
        received_date,
        catalog_item:catalog_items (
          id, name, barcode, photo_url, unit_of_measure, input_unit_value, weight_per_unit_lbs,
          category:categories ( id, name, is_food )
        )
      `)
      .eq('location_id', locationId)
      .order(sortColumn, { ascending: orderAsc, nullsFirst: true });

    if (batchErr) {
      console.error('Error fetching inventory:', batchErr);
      return NextResponse.json({ message: 'Database Error' }, { status: 500 });
    }

    // Flatten into the shape existing UI components expect
    const cleanedFoods = (batches || []).map(batch => {
      const item = batch.catalog_item || {};
      const cat = item.category || {};
      return {
        _id: batch.id,
        id: batch.id,
        name: item.name || 'Unknown Item',
        barcode: item.barcode || '',
        category: cat.name || 'General',
        quantity: formatQty(batch.quantity || 0),
        unit: item.unit_of_measure || 'units',
        expirationDate: batch.expiration_date || null,
        expirationPrecision: batch.expiration_precision || 'none',
        sourceType: batch.source_type || 'donation',
        receivedDate: batch.received_date || null,
        catalogItemId: item.id,
        weightPerUnit: item.weight_per_unit_lbs || 1,
        photoUrl: item.photo_url || null
      };
    });

    return NextResponse.json({ count: cleanedFoods.length, data: cleanedFoods });
  } catch (error) {
    console.error('GET /api/foods Error:', error);
    return NextResponse.json({ message: 'Server Error' }, { status: 500 });
  }
}

// ----------------------------------------------------------------------
// 3. POST: Receive Item (scan_in)
// ----------------------------------------------------------------------
export async function POST(req) {
  try {
    const auth = await authenticateRequest();
    if (!auth.authenticated) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    const data = await req.json();
    const pantryId = req.headers.get('x-pantry-id');
    if (!pantryId) return NextResponse.json({ message: 'Pantry ID required' }, { status: 400 });

    const resolved = await resolveLocationAndOrg(auth.supabase, pantryId);
    if (!resolved) return NextResponse.json({ message: 'Location not found' }, { status: 404 });
    const { locationId, orgId } = resolved;

    // Verify membership
    const { data: membership } = await auth.supabase
      .from('user_organizations')
      .select('role, status')
      .eq('user_id', auth.user.id)
      .eq('organization_id', orgId)
      .eq('status', 'active')
      .maybeSingle();

    if (!membership) return NextResponse.json({ message: 'Access Denied: Not a member' }, { status: 403 });
    if (!data.name || !data.quantity) {
      return NextResponse.json({ message: 'Missing required fields' }, { status: 400 });
    }

    const quantityToAdd = formatQty(parseFloat(data.quantity));
    if (isNaN(quantityToAdd) || quantityToAdd <= 0) {
      return NextResponse.json({ message: 'Quantity must be a positive number' }, { status: 400 });
    }
    const barcode = String(data.barcode || '').trim() || `SYS-${Date.now().toString().slice(-8)}`;

    // 1. Resolve Category ID (categories is a shared global reference table, no organization_id)
    const categoryId = await resolveCategoryId(auth.supabase, data.category);

    // 2. Upsert Catalog Item (find by barcode + orgId, or create new)
    let catalogItem = null;
    const { data: existingItem } = await auth.supabase
      .from('catalog_items')
      .select('*')
      .eq('organization_id', orgId)
      .eq('barcode', barcode)
      .maybeSingle();

    if (existingItem) {
      catalogItem = existingItem;
      // Update name or category if changed
      const needsUpdate = (data.name && data.name !== existingItem.name) || 
                          (categoryId && categoryId !== existingItem.category_id) ||
                          (data.photoUrl && data.photoUrl !== existingItem.photo_url);
      if (needsUpdate) {
        const { data: updatedItem, error: updateErr } = await auth.supabase
          .from('catalog_items')
          .update({ 
            name: data.name || existingItem.name, 
            category_id: categoryId || existingItem.category_id,
            photo_url: data.photoUrl || existingItem.photo_url
          })
          .eq('id', existingItem.id)
          .select('*')
          .single();
        if (updateErr) console.error("Catalog item update error:", updateErr);
        if (updatedItem) catalogItem = updatedItem;
      }
    } else {
      // ✅ CRITICAL FIX: Do not write to weight_per_unit_lbs! It is GENERATED ALWAYS AS STORED in Postgres.
      const { data: newItem, error: createErr } = await auth.supabase
        .from('catalog_items')
        .insert({
          organization_id: orgId,
          name: data.name || 'New Item',
          barcode: barcode,
          category_id: categoryId,
          unit_of_measure: normalizeUnit(data.unit),
          input_unit_value: Number(data.inputUnitValue || data.weightPerUnit || 1),
          pack_size: data.packSize ? Number(data.packSize) : null,
          photo_url: data.photoUrl || null
        })
        .select('*')
        .single();
      if (createErr) throw createErr;
      catalogItem = newItem;
    }

    // 3. Resolve Batch (Auto-Merge or Insert)
    let expDate = null;
    if (data.expirationDate) {
      const d = new Date(data.expirationDate);
      if (!isNaN(d.getTime())) {
        expDate = d.toISOString().split('T')[0];
      }
    }

    // Query all matching batches for this catalog item and expiration date (or both null)
    let query = auth.supabase
      .from('inventory_batches')
      .select('id, quantity')
      .eq('location_id', locationId)
      .eq('catalog_item_id', catalogItem.id);

    if (expDate) {
      query = query.eq('expiration_date', expDate);
    } else {
      query = query.is('expiration_date', null);
    }

    const { data: matchingBatches } = await query.order('created_at', { ascending: true });

    let batch = null;
    let batchErr = null;

    if (matchingBatches && matchingBatches.length > 0) {
      // MATCH FOUND: Auto-merge!
      const primaryBatch = matchingBatches[0];
      const existingSum = matchingBatches.reduce((sum, b) => sum + (Number(b.quantity) || 0), 0);
      const totalNewQty = formatQty(existingSum + quantityToAdd);

      const { data: updatedBatch, error: updateErr } = await auth.supabase
        .from('inventory_batches')
        .update({ quantity: totalNewQty })
        .eq('id', primaryBatch.id)
        .select('*')
        .single();

      batch = updatedBatch;
      batchErr = updateErr;

      // Clean up any extra duplicate rows that existed in the database from before
      if (matchingBatches.length > 1) {
        const duplicateIdsToDelete = matchingBatches.slice(1).map(b => b.id);
        await auth.supabase
          .from('inventory_batches')
          .delete()
          .in('id', duplicateIdsToDelete);
      }
    } else {
      // NO MATCH: Insert new batch
      const { data: insertedBatch, error: insertErr } = await auth.supabase
        .from('inventory_batches')
        .insert({
          catalog_item_id: catalogItem.id,
          location_id: locationId,
          quantity: quantityToAdd,
          expiration_date: expDate,
          expiration_precision: normalizeExpPrecision(data.expirationPrecision || (expDate ? 'day' : 'none')),
          source_type: normalizeSourceType(data.sourceType),
          donor_name: data.donorName || null,
          storage_location: data.storageLocation || null,
          received_date: new Date().toISOString().split('T')[0]
        })
        .select('*')
        .single();

      batch = insertedBatch;
      batchErr = insertErr;
    }

    if (batchErr) throw batchErr;

    // 4. Insert Activity Log
    const weightChanged = formatQty(quantityToAdd * Number(catalogItem.weight_per_unit_lbs || 1));
    const { error: logErr } = await auth.supabase
      .from('activity_logs')
      .insert({
        organization_id: orgId,
        location_id: locationId,
        user_id: auth.user.id,
        action_type: 'scan_in',
        reason: null,
        quantity_changed: quantityToAdd,
        total_weight_lbs_changed: weightChanged,
        catalog_item_id: catalogItem.id,
        snapshot_item_name: catalogItem.name
      });
    if (logErr) console.error("Activity log insert error:", logErr);

    // 5. Return flattened shape to UI
    const responseItem = {
      _id: batch.id,
      id: batch.id,
      name: catalogItem.name,
      barcode: catalogItem.barcode,
      category: data.category || 'General',
      quantity: formatQty(batch.quantity),
      unit: catalogItem.unit_of_measure,
      expirationDate: batch.expiration_date,
      expirationPrecision: batch.expiration_precision,
      sourceType: batch.source_type,
      receivedDate: batch.received_date,
      catalogItemId: catalogItem.id,
      weightPerUnit: catalogItem.weight_per_unit_lbs || 1,
      photoUrl: catalogItem.photo_url || null
    };

    return NextResponse.json(responseItem, { status: 201 });
  } catch (error) {
    console.error('POST /api/foods Error:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}