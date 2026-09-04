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

// ----------------------------------------------------------------------------------
// --- GET: Fetch Recent Activity (from activity_logs) ---
// ----------------------------------------------------------------------------------
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
    const { orgId } = resolved;

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

    // Query activity_logs filtered by organization_id, ordered by created_at DESC
    const { data: logs, error } = await auth.supabase
      .from('activity_logs')
      .select('*, catalog_item:catalog_items(categories(name))')
      .eq('organization_id', orgId)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      console.error('❌ GET /api/foods/changes/recent - Database Error:', error);
      return NextResponse.json({ message: 'Database Error' }, { status: 500 });
    }

    // Format logs for both legacy and modern UI compatibility
    const changes = (logs || []).map(log => {
      // Map action_type to legacy action strings expected by recent-changes-view.jsx
      let action = log.action_type;
      if (action === 'scan_in') action = 'added';
      else if (action === 'scan_out') action = 'distributed';
      else if (action === 'waste_disposal') action = 'deleted';
      else if (action === 'audit_update') action = 'updated';

      const resolvedCategory = log.catalog_item?.categories?.name || 'General';

      return {
        _id: log.id,
        id: log.id,
        action: action,
        actionType: action,
        rawActionType: log.action_type,
        timestamp: log.created_at,
        itemId: log.catalog_item_id || log.id,
        itemName: log.snapshot_item_name || 'Unknown Item',
        category: resolvedCategory,
        quantityChanged: log.quantity_changed,
        weightChanged: log.total_weight_lbs_changed,
        clientName: log.reason || null,
        reason: log.reason || null,
        metadata: {
          reason: log.reason,
          quantity_changed: log.quantity_changed,
          weight_changed: log.total_weight_lbs_changed
        }
      };
    });

    return NextResponse.json(changes);
  } catch (error) {
    console.error('❌ GET /api/foods/changes/recent - Error:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}