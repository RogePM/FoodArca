import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

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

export async function GET(req) {
  try {
    const auth = await authenticateRequest();
    if (!auth.authenticated) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const pantryId = req.headers.get('x-pantry-id');
    if (!pantryId) {
      return NextResponse.json({ message: 'Pantry ID required' }, { status: 400 });
    }

    const resolved = await resolveLocationAndOrg(auth.supabase, pantryId);
    if (!resolved) {
      return NextResponse.json({ message: 'Organization not found' }, { status: 404 });
    }
    const { locationId, orgId } = resolved;

    // Verify membership in user_organizations
    const { data: membership, error: memberError } = await auth.supabase
      .from('user_organizations')
      .select('role, status')
      .eq('user_id', auth.user.id)
      .eq('organization_id', orgId)
      .eq('status', 'active')
      .maybeSingle();

    if (memberError || !membership) {
      console.error(`🚫 Unauthorized Dashboard Access: User ${auth.user.email} -> Org ${orgId}`);
      return NextResponse.json({ message: 'Access Denied' }, { status: 403 });
    }

    // 1. Read from daily_org_stats (pre-aggregated nightly rollup). Never aggregate activity_logs live!
    const { data: stats } = await auth.supabase
      .from('daily_org_stats')
      .select('lbs_in, lbs_out, lbs_wasted, distinct_categories, distinct_volunteers')
      .eq('organization_id', orgId);

    let totalLbsIn = 0;
    let totalLbsOut = 0;
    let maxCategories = 0;
    let maxVolunteers = 0;

    (stats || []).forEach(row => {
      totalLbsIn += Number(row.lbs_in || 0);
      totalLbsOut += Number(row.lbs_out || 0);
      if ((row.distinct_categories || 0) > maxCategories) maxCategories = row.distinct_categories;
      if ((row.distinct_volunteers || 0) > maxVolunteers) maxVolunteers = row.distinct_volunteers;
    });

    // Get all location IDs for this organization so live stock aggregation covers the entire org
    const { data: orgLocations } = await auth.supabase
      .from('locations')
      .select('id')
      .eq('organization_id', orgId);

    const locationIds = (orgLocations || []).map(l => l.id);
    const locFilter = locationIds.length > 0 ? locationIds : [locationId];

    // 2. Query current live stock in inventory_batches across all locations in the organization
    const { data: batches } = await auth.supabase
      .from('inventory_batches')
      .select('quantity, catalog_item_id')
      .in('location_id', locFilter);

    let inventoryCount = 0;
    const skuSet = new Set();
    (batches || []).forEach(b => {
      inventoryCount += Number(b.quantity || 0);
      if (b.catalog_item_id) skuSet.add(b.catalog_item_id);
    });

    const totalSkus = Math.max(skuSet.size, maxCategories);
    const totalPeopleServed = totalLbsOut > 0 ? Math.round(totalLbsOut / 15) : 0;
    const totalValue = parseFloat((totalLbsOut * 1.96).toFixed(2));

    const response = {
      inventoryCount: Math.round(inventoryCount),
      totalPeopleServed,
      totalValue,
      totalWeight: parseFloat(totalLbsOut.toFixed(2)),
      totalItemsDistributed: parseFloat(totalLbsOut.toFixed(2)),
      billing: {
        totalSkus,
        totalClients: maxVolunteers
      }
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('❌ GET /api/dashboard/stats - Error:', error);
    return NextResponse.json({ message: 'Server Error' }, { status: 500 });
  }
}