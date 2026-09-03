import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

const formatQty = (num) => Math.round((Number(num) + Number.EPSILON) * 1000) / 1000;

// Map any user-entered or API-returned unit string to the CHECK-constrained values
// Map any user-entered or API-returned unit string to the CHECK-constrained values
// accepted by catalog_items.unit_of_measure in Supabase: 'count', 'oz', 'lbs', 'kg', 'fl_oz', 'gallon'
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

// Normalize expiration_precision to DB allowed values: 'day', 'month', 'unknown'
function normalizeExpPrecision(raw) {
  const p = String(raw || 'unknown').trim().toLowerCase();
  if (p === 'exact' || p === 'day' || p === 'date') return 'day';
  if (p === 'month') return 'month';
  return 'unknown';
}

// Normalize source_type to DB allowed values: 'donation', 'purchased', 'usda_commodity', 'retail_rescue'
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
  const { data: loc } = await supabase
    .from('locations')
    .select('id, organization_id')
    .eq('id', pantryId)
    .maybeSingle();

  if (loc) {
    return { locationId: loc.id, orgId: loc.organization_id };
  }

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

export async function POST(req) {
  try {
    const auth = await authenticateRequest();
    if (!auth.authenticated) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const items = body.items || body.cart || [];
    const pantryId = req.headers.get('x-pantry-id');

    if (!pantryId) {
      return NextResponse.json({ message: 'Pantry ID required' }, { status: 400 });
    }

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ message: 'No items provided for bulk upload' }, { status: 400 });
    }

    const resolved = await resolveLocationAndOrg(auth.supabase, pantryId);
    if (!resolved) {
      return NextResponse.json({ message: 'Location not found' }, { status: 404 });
    }
    const { locationId, orgId } = resolved;

    // Verify membership in user_organizations
    const { data: membership } = await auth.supabase
      .from('user_organizations')
      .select('role, status')
      .eq('user_id', auth.user.id)
      .eq('organization_id', orgId)
      .eq('status', 'active')
      .maybeSingle();

    if (!membership) {
      return NextResponse.json({ message: 'Access Denied: Not a member' }, { status: 403 });
    }

    const createdBatches = [];

    // Process items sequentially to ensure category/catalog creation integrity
    for (const item of items) {
      if (!item.name || !item.quantity) continue;

      const quantityToAdd = formatQty(parseFloat(item.quantity));
      if (isNaN(quantityToAdd) || quantityToAdd <= 0) continue;
      const barcode = String(item.barcode || '').trim() || `SYS-${Date.now().toString().slice(-8)}-${Math.floor(Math.random()*1000)}`;

      // 1. Resolve Category ID
      const catName = item.categoryName || item.category;
      const categoryId = await resolveCategoryId(auth.supabase, catName);

      // 2. Upsert Catalog Item (do not write to weight_per_unit_lbs as it is generated in Postgres)
      let catalogItem = null;
      const { data: existingItem } = await auth.supabase
        .from('catalog_items')
        .select('*')
        .eq('organization_id', orgId)
        .eq('barcode', barcode)
        .maybeSingle();

      if (existingItem) {
        catalogItem = existingItem;
        const needsUpdate = (item.name && item.name !== existingItem.name) || 
                            (categoryId && categoryId !== existingItem.category_id) ||
                            (item.photoUrl && item.photoUrl !== existingItem.photo_url);
        if (needsUpdate) {
          const { data: updatedItem } = await auth.supabase
            .from('catalog_items')
            .update({
              name: item.name || existingItem.name,
              category_id: categoryId || existingItem.category_id,
              photo_url: item.photoUrl || existingItem.photo_url
            })
            .eq('id', existingItem.id)
            .select('*')
            .single();
          if (updatedItem) catalogItem = updatedItem;
        }
      } else {
        const { data: newItem, error: createErr } = await auth.supabase
          .from('catalog_items')
          .insert({
            organization_id: orgId,
            name: item.name || 'New Item',
            barcode: barcode,
            category_id: categoryId,
            unit_of_measure: normalizeUnit(item.unit),
            input_unit_value: Number(item.inputUnitValue || item.weightPerUnit || 1),
            pack_size: item.packSize ? Number(item.packSize) : null,
            photo_url: item.photoUrl || null
          })
          .select('*')
          .single();
        if (createErr) {
          console.error('Error creating catalog item during bulk add:', createErr);
          continue;
        }
        catalogItem = newItem;
      }


      // 3. Resolve Batch (Auto-Merge or Insert)
      let expDate = null;
      if (item.expirationDate || item.expiration) {
        const d = new Date(item.expirationDate || item.expiration);
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

      let matchingBatches = [];
      if (item.existingBatchId) {
        const { data: specificBatch } = await auth.supabase
          .from('inventory_batches')
          .select('id, quantity')
          .eq('id', item.existingBatchId)
          .maybeSingle();
        if (specificBatch) {
          matchingBatches = [specificBatch];
        }
      }

      if (matchingBatches.length === 0) {
        const { data: batches } = await query.order('created_at', { ascending: true });
        if (batches && batches.length > 0) {
          matchingBatches = batches;
        }
      }

      let newBatch = null;
      let batchErr = null;

      if (matchingBatches && matchingBatches.length > 0) {
        // MATCH FOUND: Auto-merge!
        // The first batch becomes the primary batch.
        const primaryBatch = matchingBatches[0];
        // Sum any existing duplicate rows + the incoming quantity
        const existingSum = matchingBatches.reduce((sum, b) => sum + (Number(b.quantity) || 0), 0);
        const totalNewQty = formatQty(existingSum + quantityToAdd);

        const { data: updatedBatch, error: updateErr } = await auth.supabase
          .from('inventory_batches')
          .update({ quantity: totalNewQty })
          .eq('id', primaryBatch.id)
          .select(`
            id, quantity, expiration_date, expiration_precision, source_type, received_date,
            catalog_item:catalog_items (
              id, name, barcode, photo_url, unit_of_measure, input_unit_value, weight_per_unit_lbs,
              category:categories ( id, name, is_food )
            )
          `)
          .single();

        newBatch = updatedBatch;
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
            location_id: locationId,
            catalog_item_id: catalogItem.id,
            quantity: quantityToAdd,
            expiration_date: expDate,
            expiration_precision: normalizeExpPrecision(item.expirationPrecision || (expDate ? 'day' : 'none')),
            source_type: normalizeSourceType(item.sourceType),
            donor_name: item.donorName || null,
            storage_location: item.storageLocation || null,
            received_date: new Date().toISOString().split('T')[0]
          })
          .select(`
            id, quantity, expiration_date, expiration_precision, source_type, received_date,
            catalog_item:catalog_items (
              id, name, barcode, photo_url, unit_of_measure, input_unit_value, weight_per_unit_lbs,
              category:categories ( id, name, is_food )
            )
          `)
          .single();

        newBatch = insertedBatch;
        batchErr = insertErr;
      }

      if (batchErr) {
        console.error('Error creating inventory batch during bulk add:', batchErr);
      }

      if (!batchErr && newBatch) {
        const cItem = newBatch.catalog_item || {};
        const cat = cItem.category || {};
        createdBatches.push({
          _id: newBatch.id,
          id: newBatch.id,
          name: cItem.name || 'Unknown Item',
          barcode: cItem.barcode || '',
          category: cat.name || 'General',
          quantity: formatQty(newBatch.quantity || 0),
          unit: cItem.unit_of_measure || 'units',
          expirationDate: newBatch.expiration_date || null,
          expirationPrecision: newBatch.expiration_precision || 'none',
          sourceType: newBatch.source_type || 'donation',
          receivedDate: newBatch.received_date || null,
          catalogItemId: cItem.id,
          weightPerUnit: cItem.weight_per_unit_lbs || 1,
          photoUrl: cItem.photo_url || null
        });

        // 4. Activity Log
        await auth.supabase
          .from('activity_logs')
          .insert({
            organization_id: orgId,
            location_id: locationId,
            user_id: auth.user.id,
            action_type: 'scan_in',
            reason: null,
            quantity_changed: quantityToAdd,
            total_weight_lbs_changed: formatQty(quantityToAdd * Number(cItem.weight_per_unit_lbs || 1)),
            item_snapshot: cItem
          });
      }
    }

    return NextResponse.json({
      success: true,
      message: `Successfully added ${createdBatches.length} items.`,
      count: createdBatches.length,
      data: createdBatches
    });
  } catch (error) {
    console.error('POST /api/foods/bulk Error:', error);
    return NextResponse.json({ message: 'Server Error' }, { status: 500 });
  }
}
