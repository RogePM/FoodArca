import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

const formatQty = (num) => Math.round((Number(num) + Number.EPSILON) * 1000) / 1000;

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

// ----------------------------------------------------------------------------------
// --- GET Single Item ---
// ----------------------------------------------------------------------------------
export async function GET(req, { params }) {
  try {
    const auth = await authenticateRequest();
    if (!auth.authenticated) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    const pantryId = req.headers.get('x-pantry-id');
    if (!pantryId) return NextResponse.json({ message: 'Pantry ID required' }, { status: 400 });

    const resolved = await resolveLocationAndOrg(auth.supabase, pantryId);
    if (!resolved) return NextResponse.json({ message: 'Location not found' }, { status: 404 });
    const { locationId, orgId } = resolved;

    const { data: membership } = await auth.supabase
      .from('user_organizations')
      .select('role, status')
      .eq('user_id', auth.user.id)
      .eq('organization_id', orgId)
      .eq('status', 'active')
      .maybeSingle();

    if (!membership) return NextResponse.json({ message: 'Access Denied: Not a member' }, { status: 403 });

    const { id } = await params;

    let { data: batch } = await auth.supabase
      .from('inventory_batches')
      .select(`
        id,
        quantity,
        expiration_date,
        expiration_precision,
        source_type,
        received_date,
        catalog_item:catalog_items (
          id, name, barcode, unit_of_measure, input_unit_value, weight_per_unit_lbs,
          category:categories ( id, name, is_food )
        )
      `)
      .eq('id', id)
      .eq('location_id', locationId)
      .maybeSingle();

    if (!batch) {
      const { data: altBatch } = await auth.supabase
        .from('inventory_batches')
        .select(`
          id,
          quantity,
          expiration_date,
          expiration_precision,
          source_type,
          received_date,
          catalog_item:catalog_items (
            id, name, barcode, unit_of_measure, input_unit_value, weight_per_unit_lbs,
            category:categories ( id, name, is_food )
          )
        `)
        .eq('catalog_item_id', id)
        .eq('location_id', locationId)
        .maybeSingle();
      batch = altBatch;
    }

    if (!batch) return NextResponse.json({ message: 'Item not found' }, { status: 404 });

    const item = batch.catalog_item || {};
    const cat = item.category || {};
    const formatted = {
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
      weightPerUnit: item.weight_per_unit_lbs || 1
    };

    return NextResponse.json(formatted);
  } catch (error) {
    console.error('GET /api/foods/[id] Error:', error);
    return NextResponse.json({ message: 'Server Error' }, { status: 500 });
  }
}

// ----------------------------------------------------------------------------------
// --- PUT: Update Item ---
// ----------------------------------------------------------------------------------
export async function PUT(req, { params }) {
  try {
    const auth = await authenticateRequest();
    if (!auth.authenticated) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    const pantryId = req.headers.get('x-pantry-id');
    if (!pantryId) return NextResponse.json({ message: 'Pantry ID required' }, { status: 400 });

    const resolved = await resolveLocationAndOrg(auth.supabase, pantryId);
    if (!resolved) return NextResponse.json({ message: 'Location not found' }, { status: 404 });
    const { locationId, orgId } = resolved;

    const { data: membership } = await auth.supabase
      .from('user_organizations')
      .select('role, status')
      .eq('user_id', auth.user.id)
      .eq('organization_id', orgId)
      .eq('status', 'active')
      .maybeSingle();

    if (!membership) return NextResponse.json({ message: 'Access Denied: Not a member' }, { status: 403 });

    const { id } = await params;
    const data = await req.json();

    const { data: batch } = await auth.supabase
      .from('inventory_batches')
      .select(`
        id,
        quantity,
        catalog_item:catalog_items (
          id, name, weight_per_unit_lbs
        )
      `)
      .eq('id', id)
      .eq('location_id', locationId)
      .maybeSingle();

    if (!batch) return NextResponse.json({ message: 'Item not found' }, { status: 404 });

    const updateData = {};
    if (data.quantity !== undefined) updateData.quantity = formatQty(data.quantity);
    if (data.expirationDate !== undefined) {
      const d = new Date(data.expirationDate);
      if (!isNaN(d.getTime())) updateData.expiration_date = d.toISOString().split('T')[0];
    }
    if (data.sourceType !== undefined) updateData.source_type = data.sourceType;

    if (Object.keys(updateData).length > 0) {
      const { error: updErr } = await auth.supabase
        .from('inventory_batches')
        .update(updateData)
        .eq('id', batch.id);
      if (updErr) throw updErr;
    }

    if (data.name && batch.catalog_item) {
      const { error: catErr } = await auth.supabase
        .from('catalog_items')
        .update({ name: data.name })
        .eq('id', batch.catalog_item.id);
      if (catErr) throw catErr;
    }

    if (data.quantity !== undefined && formatQty(data.quantity) !== formatQty(batch.quantity)) {
      const diff = formatQty(data.quantity - batch.quantity);
      // ✅ CRITICAL FIX: Use 'audit_update' instead of 'adjustment', and set reason to null!
      const { error: logErr } = await auth.supabase.from('activity_logs').insert({
        organization_id: orgId,
        location_id: locationId,
        user_id: auth.user.id,
        action_type: 'audit_update',
        reason: null,
        quantity_changed: Math.abs(diff),
        total_weight_lbs_changed: formatQty(Math.abs(diff) * Number(batch.catalog_item?.weight_per_unit_lbs || 1)),
        item_snapshot: { ...batch.catalog_item, name: data.name || batch.catalog_item?.name }
      });
      if (logErr) console.error("Activity log insert error:", logErr);
    }

    return NextResponse.json({ message: 'Item updated successfully' });
  } catch (error) {
    console.error('PUT /api/foods/[id] Error:', error);
    return NextResponse.json({ message: 'Server Error' }, { status: 500 });
  }
}

// ----------------------------------------------------------------------------------
// --- DELETE: Remove Item ---
// ----------------------------------------------------------------------------------
export async function DELETE(req, { params }) {
  try {
    const auth = await authenticateRequest();
    if (!auth.authenticated) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

    const pantryId = req.headers.get('x-pantry-id');
    if (!pantryId) return NextResponse.json({ message: 'Pantry ID required' }, { status: 400 });

    const resolved = await resolveLocationAndOrg(auth.supabase, pantryId);
    if (!resolved) return NextResponse.json({ message: 'Location not found' }, { status: 404 });
    const { locationId, orgId } = resolved;

    const { data: membership } = await auth.supabase
      .from('user_organizations')
      .select('role, status')
      .eq('user_id', auth.user.id)
      .eq('organization_id', orgId)
      .eq('status', 'active')
      .maybeSingle();

    if (!membership) return NextResponse.json({ message: 'Access Denied: Not a member' }, { status: 403 });

    const { id } = await params;

    let catalogItemId = id;
    const { data: batch } = await auth.supabase
      .from('inventory_batches')
      .select('catalog_item_id')
      .eq('id', id)
      .eq('location_id', locationId)
      .maybeSingle();

    if (batch) {
      catalogItemId = batch.catalog_item_id;
    }

    const { error: rpcErr } = await auth.supabase.rpc('delete_catalog_item_safe', {
      p_item_id: catalogItemId
    });

    if (rpcErr) throw rpcErr;

    return NextResponse.json({ message: 'Item deleted safely' });
  } catch (error) {
    console.error('DELETE /api/foods/[id] Error:', error);
    return NextResponse.json({ message: error.message || 'Server Error' }, { status: 500 });
  }
}