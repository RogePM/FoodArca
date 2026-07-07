import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { getPlanDetails } from '@/lib/plans';

// --- SHARED SECURITY HELPER ---
async function authenticateAndVerify(req) {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    { cookies: { getAll() { return cookieStore.getAll(); } } }
  );

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) return { valid: false, status: 401, message: 'Unauthorized', supabase: null };

  const pantryId = req.headers.get('x-pantry-id');
  if (!pantryId) return { valid: false, status: 400, message: 'Pantry ID required', supabase: null };

  // Resolve organization ID (pantryId might be a location ID or organization ID)
  let orgId = pantryId;
  const { data: loc } = await supabase
    .from('locations')
    .select('organization_id')
    .eq('id', pantryId)
    .maybeSingle();
  if (loc) {
    orgId = loc.organization_id;
  }

  // Verify membership in user_organizations
  const { data: membership, error: memberError } = await supabase
    .from('user_organizations')
    .select('status, role')
    .eq('user_id', user.id)
    .eq('organization_id', orgId)
    .eq('status', 'active')
    .maybeSingle();

  if (memberError || !membership) {
    return { valid: false, status: 403, message: 'Access Denied: Not a member', supabase: null };
  }

  // Fetch subscription tier from organizations
  const { data: org, error: orgError } = await supabase
    .from('organizations')
    .select('plan_type')
    .eq('id', orgId)
    .maybeSingle();

  if (orgError || !org) return { valid: false, status: 404, message: 'Organization configuration not found', supabase: null };

  return {
    valid: true,
    user,
    orgId,
    pantryId,
    tier: org.plan_type || 'free',
    supabase
  };
}

export async function GET(req) {
  try {
    const auth = await authenticateAndVerify(req);
    if (!auth.valid) return NextResponse.json({ error: auth.message }, { status: auth.status });

    // 1. GATEKEEPING
    const plan = getPlanDetails(auth.tier);
    if (!plan.features.csv_export) {
      return NextResponse.json({ error: 'Upgrade required to export data.' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type') || 'inventory'; // Default to inventory

    if (type !== 'inventory') {
      return NextResponse.json({ error: 'Invalid export type. Only inventory export is supported.' }, { status: 400 });
    }

    const filename = `inventory-${new Date().toISOString().split('T')[0]}.csv`;

    // 2. DATA FETCHING FROM SUPABASE POSTGRES
    const { data: batches, error: batchErr } = await auth.supabase
      .from('inventory_batches')
      .select(`
        id,
        quantity,
        expiration_date,
        source_type,
        received_date,
        location:locations(name),
        catalog_item:catalog_items (
          name, barcode, unit_of_measure, weight_per_unit_lbs,
          category:categories (name)
        )
      `)
      .order('expiration_date', { ascending: true, nullsFirst: true });

    if (batchErr) {
      console.error('Database export error:', batchErr);
      return NextResponse.json({ error: 'Database Error' }, { status: 500 });
    }

    const headers = ['Name', 'Category', 'Quantity', 'Unit', 'Weight/Unit (lbs)', 'Barcode', 'Location', 'Expiration Date', 'Received Date', 'Source Type'];

    const rows = (batches || []).map(batch => {
      const item = batch.catalog_item || {};
      const cat = item.category || {};
      const loc = batch.location || {};
      return [
        `"${(item.name || 'Unknown').replace(/"/g, '""')}"`,
        `"${(cat.name || 'General').replace(/"/g, '""')}"`,
        batch.quantity || 0,
        `"${item.unit_of_measure || 'units'}"`,
        item.weight_per_unit_lbs || 1,
        `"${item.barcode || ''}"`,
        `"${(loc.name || '').replace(/"/g, '""')}"`,
        batch.expiration_date || '',
        batch.received_date || '',
        `"${batch.source_type || 'donation'}"`
      ];
    });

    const csvData = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');

    // 3. RETURN CSV FILE
    return new NextResponse(csvData, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });

  } catch (error) {
    console.error("Export Error:", error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}