import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { getPlanDetails } from '@/lib/plans';

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
      return NextResponse.json({ message: 'Access Denied: Not a member' }, { status: 403 });
    }

    const alerts = [];

    // --- CHECK 1: PLAN LIMITS (from organizations and plans.js) ---
    const { data: org } = await auth.supabase
      .from('organizations')
      .select('plan_type, current_item_count, current_user_count')
      .eq('id', orgId)
      .maybeSingle();

    if (org) {
      const plan = getPlanDetails(org.plan_type || 'free');
      const itemLimit = plan?.limits?.items || 150;
      const currentItems = org.current_item_count || 0;

      // Only check limits if not unlimited (999999)
      if (itemLimit < 999999) {
        if (currentItems >= itemLimit) {
          alerts.push({
            id: 'limit-items-crit',
            type: 'critical',
            title: 'Item Limit Reached',
            message: `You reached the ${itemLimit} item limit on the ${plan.name} plan. Upgrade to increase your capacity.`,
            action: 'Upgrade',
            targetView: 'Settings'
          });
        } else if (currentItems >= itemLimit * 0.9) {
          alerts.push({
            id: 'limit-items-warn',
            type: 'warning',
            title: 'Item Limit Near',
            message: `You are at ${currentItems}/${itemLimit} items on the ${plan.name} plan.`,
            action: 'Upgrade',
            targetView: 'Settings'
          });
        }
      }
    }

    // --- CHECK 2: INVENTORY STOCK & EXPIRATIONS (across all org locations) ---
    const { data: orgLocations } = await auth.supabase
      .from('locations')
      .select('id')
      .eq('organization_id', orgId);
    const locationIds = (orgLocations || []).map(l => l.id);
    const locFilter = locationIds.length > 0 ? locationIds : [locationId];

    const today = new Date().toISOString().split('T')[0];
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
    const thirtyDaysStr = thirtyDaysFromNow.toISOString().split('T')[0];

    // A. Already Expired Stock
    const { count: expiredCount } = await auth.supabase
      .from('inventory_batches')
      .select('id', { count: 'exact', head: true })
      .in('location_id', locFilter)
      .gt('quantity', 0)
      .lt('expiration_date', today);

    if (expiredCount && expiredCount > 0) {
      alerts.push({
        id: 'expired-crit',
        type: 'critical',
        title: 'Expired Stock',
        message: `${expiredCount} batches are past their expiration date.`,
        action: 'Remove Items',
        targetView: 'View Inventory'
      });
    }

    // B. Expiring Soon (Within 30 Days)
    const { data: expiringBatches } = await auth.supabase
      .from('inventory_batches')
      .select(`
        id, quantity, expiration_date,
        catalog_item:catalog_items ( id, name, unit_of_measure )
      `)
      .in('location_id', locFilter)
      .gt('quantity', 0)
      .gte('expiration_date', today)
      .lte('expiration_date', thirtyDaysStr)
      .order('expiration_date', { ascending: true })
      .limit(10);

    if (expiringBatches && expiringBatches.length > 0) {
      alerts.push({
        id: 'expiry-alert',
        type: 'warning',
        title: 'Expiring Soon',
        message: `${expiringBatches.length} batches expire within 30 days.`,
        action: 'Check Stock',
        targetView: 'View Inventory'
      });
    }

    // C. Low Stock Notice (quantity <= 5)
    const { data: lowStockBatches } = await auth.supabase
      .from('inventory_batches')
      .select(`
        id, quantity,
        catalog_item:catalog_items ( id, name, unit_of_measure )
      `)
      .in('location_id', locFilter)
      .gt('quantity', 0)
      .lte('quantity', 5)
      .limit(5);

    if (lowStockBatches && lowStockBatches.length > 0) {
      alerts.push({
        id: 'low-stock-alert',
        type: 'info',
        title: 'Low Stock Notice',
        message: `${lowStockBatches.length} items have 5 or fewer units remaining.`,
        action: 'Restock',
        targetView: 'View Inventory'
      });
    }

    const expiringItems = (expiringBatches || []).map(b => ({
      _id: b.id,
      id: b.id,
      name: b.catalog_item?.name || 'Unknown Item',
      quantity: b.quantity,
      unit: b.catalog_item?.unit_of_measure || 'units',
      expirationDate: b.expiration_date
    }));

    return NextResponse.json({ alerts, expiringItems });
  } catch (error) {
    console.error('❌ GET /api/notifications - Error:', error);
    return NextResponse.json({ message: 'Server Error' }, { status: 500 });
  }
}