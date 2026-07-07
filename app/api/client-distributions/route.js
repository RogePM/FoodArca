import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

// --- UTILITY: Round to 3 Decimals ---
const formatQty = (num) => Math.round((Number(num) + Number.EPSILON) * 1000) / 1000;

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

// ----------------------------------------------------------------------
// 2. GET: List All Distributions (from activity_logs)
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

    // Verify membership
    const { data: membership } = await auth.supabase
      .from('user_organizations')
      .select('role, status')
      .eq('user_id', auth.user.id)
      .eq('organization_id', orgId)
      .eq('status', 'active')
      .maybeSingle();

    if (!membership) return NextResponse.json({ message: 'Access Denied: Not a member' }, { status: 403 });

    // Query activity_logs for scan_out actions
    const { data: logs, error } = await auth.supabase
      .from('activity_logs')
      .select('*')
      .eq('location_id', locationId)
      .eq('action_type', 'scan_out')
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) {
      console.error('Error fetching distribution logs:', error);
      return NextResponse.json({ message: 'Database Error' }, { status: 500 });
    }

    const distributions = (logs || []).map(log => {
      const item = log.item_snapshot || {};
      return {
        _id: log.id,
        id: log.id,
        clientName: 'Client Distribution',
        clientId: 'SYS',
        itemId: item.id || log.id,
        itemName: item.name || 'Unknown Item',
        category: 'General',
        quantityDistributed: formatQty(log.quantity_changed || 0),
        unit: item.unit_of_measure || 'units',
        reason: log.reason || 'distribution-regular',
        distributionDate: log.created_at
      };
    });

    return NextResponse.json({ count: distributions.length, data: distributions });
  } catch (error) {
    console.error('GET /api/client-distributions Error:', error);
    return NextResponse.json({ message: 'Server Error' }, { status: 500 });
  }
}

// ----------------------------------------------------------------------
// 3. POST: Distribute / Remove Items — via scan_out_item() RPC
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

    const itemsToProcess = data.cart || [data];
    const results = [];

    for (const item of itemsToProcess) {
      const qty = formatQty(parseFloat(item.quantityDistributed || item.quantity || 0));
      if (qty <= 0) continue;

      // Resolve catalog_item_id whether frontend passed catalogItemId or batch itemId/_id
      let catalogItemId = item.catalogItemId;
      if (!catalogItemId && (item.itemId || item.id || item._id)) {
        const { data: batch } = await auth.supabase
          .from('inventory_batches')
          .select('catalog_item_id')
          .eq('id', item.itemId || item.id || item._id)
          .maybeSingle();
        if (batch) catalogItemId = batch.catalog_item_id;
      }
      if (!catalogItemId) {
        throw new Error(`Could not resolve catalog item for ${item.itemName || 'item'}`);
      }

      // Call scan_out_item RPC which handles FEFO batch selection, row locking, and activity logging
      const { data: rpcRes, error: rpcErr } = await auth.supabase.rpc('scan_out_item', {
        p_catalog_item_id: catalogItemId,
        p_location_id: locationId,
        p_quantity: qty
      });

      if (rpcErr) throw rpcErr;
      results.push({ catalogItemId, quantityDistributed: qty, success: true });
    }

    return NextResponse.json({
      message: 'Distribution successful',
      itemsProcessed: results.length,
      results
    }, { status: 201 });
  } catch (error) {
    console.error('POST /api/client-distributions Error:', error);
    return NextResponse.json({ message: error.message || 'Server Error' }, { status: 500 });
  }
}

// --- PUT & DELETE (Audit logs are immutable) ---
export async function PUT() {
  return NextResponse.json({ message: 'Audit logs are immutable in the new schema' }, { status: 403 });
}

export async function DELETE() {
  return NextResponse.json({ message: 'Audit logs are immutable in the new schema' }, { status: 403 });
}