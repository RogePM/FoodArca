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

    // Parse Date Range Query Param (?range=7d|4w|mtd|qtd|all)
    const url = new URL(req.url);
    const rangeParam = url.searchParams.get('range') || '7d';

    const now = new Date();
    let startDate = new Date();

    if (rangeParam === '4w') {
      startDate.setDate(now.getDate() - 28);
    } else if (rangeParam === 'mtd') {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    } else if (rangeParam === 'qtd') {
      const currentQuarterMonth = Math.floor(now.getMonth() / 3) * 3;
      startDate = new Date(now.getFullYear(), currentQuarterMonth, 1);
    } else if (rangeParam === 'all') {
      startDate = new Date(2000, 0, 1);
    } else {
      // Default: Last 7 days
      startDate.setDate(now.getDate() - 7);
    }

    const startDateISO = startDate.toISOString();
    const startDateYMD = startDateISO.split('T')[0];
    const todayStr = now.toISOString().split('T')[0];
    const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    // 1. Fetch Location Filter for Org
    const { data: orgLocations } = await auth.supabase
      .from('locations')
      .select('id')
      .eq('organization_id', orgId);

    const locationIds = (orgLocations || []).map(l => l.id);
    const locFilter = locationIds.length > 0 ? locationIds : [locationId];

    // 2. Fetch Live Batches with Catalog Item Metadata (Current Inventory)
    const { data: batches } = await auth.supabase
      .from('inventory_batches')
      .select(`
        id,
        quantity,
        expiration_date,
        source_type,
        catalog_item_id,
        catalog_items (
          id,
          name,
          unit_of_measure,
          weight_per_unit_lbs
        )
      `)
      .in('location_id', locFilter);

    let currentStockUnits = 0;
    let currentStockWeightLbs = 0;
    const itemMap = new Map();

    const inventoryStatus = {
      expired: 0,
      expiringSoon: 0,
      good: 0,
      noDate: 0
    };

    (batches || []).forEach(b => {
      const qty = Number(b.quantity || 0);
      if (qty <= 0) return;

      currentStockUnits += qty;
      const unitWeight = Number(b.catalog_items?.weight_per_unit_lbs || 1.0);
      currentStockWeightLbs += qty * unitWeight;

      // Expiration Categorization
      if (!b.expiration_date) {
        inventoryStatus.noDate += qty;
      } else if (b.expiration_date < todayStr) {
        inventoryStatus.expired += qty;
      } else if (b.expiration_date <= sevenDaysFromNow) {
        inventoryStatus.expiringSoon += qty;
      } else {
        inventoryStatus.good += qty;
      }

      // Group Top Items
      if (b.catalog_items?.name) {
        const key = b.catalog_items.id || b.catalog_items.name;
        if (!itemMap.has(key)) {
          itemMap.set(key, {
            name: b.catalog_items.name,
            unit: b.catalog_items.unit_of_measure || 'units',
            quantity: 0
          });
        }
        itemMap.get(key).quantity += qty;
      }
    });

    // Top 5 Items by Quantity (Sorted Descending, text only)
    const topItems = Array.from(itemMap.values())
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5);

    // 3. Fetch Historical Stats from daily_org_stats filtered by Date Range
    const { data: dailyStats } = await auth.supabase
      .from('daily_org_stats')
      .select('stat_date, lbs_in, lbs_out, lbs_wasted, distinct_categories, distinct_volunteers')
      .eq('organization_id', orgId)
      .gte('stat_date', startDateYMD)
      .order('stat_date', { ascending: true });

    let totalLbsIn = 0;
    let totalLbsOut = 0;
    let totalLbsWasted = 0;
    let maxCategories = 0;
    let maxVolunteers = 0;

    const intakeTimeSeries = [];
    const distributionTimeSeries = [];
    const wasteTimeSeries = [];

    (dailyStats || []).forEach(row => {
      const dateLabel = new Date(row.stat_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      const lbsIn = Number(row.lbs_in || 0);
      const lbsOut = Number(row.lbs_out || 0);
      const lbsWasted = Number(row.lbs_wasted || 0);

      totalLbsIn += lbsIn;
      totalLbsOut += lbsOut;
      totalLbsWasted += lbsWasted;

      if ((row.distinct_categories || 0) > maxCategories) maxCategories = row.distinct_categories;
      if ((row.distinct_volunteers || 0) > maxVolunteers) maxVolunteers = row.distinct_volunteers;

      intakeTimeSeries.push({ date: dateLabel, amount: lbsIn });
      distributionTimeSeries.push({ date: dateLabel, amount: lbsOut });
      wasteTimeSeries.push({ date: dateLabel, amount: lbsWasted });
    });

    // 4. Intra-day Timeline & Today/Yesterday Stats from activity_logs & daily_org_stats
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
    const yesterdayDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
    const startOfYesterday = yesterdayDate.toISOString();
    const yesterdayYMD = yesterdayDate.toISOString().split('T')[0];

    const { data: recentLogs } = await auth.supabase
      .from('activity_logs')
      .select('action_type, quantity_changed, total_weight_lbs_changed, created_at')
      .eq('organization_id', orgId)
      .gte('created_at', startOfYesterday);

    let todayIntakeLbs = 0;
    let todayDistributedLbs = 0;
    let todayWasteLbs = 0;

    let yesterdayIntakeLbs = 0;
    let yesterdayDistributedLbs = 0;
    let yesterdayWasteLbs = 0;

    // Hourly buckets for Today sparklines
    const intakeBuckets = { '12 AM': 0, '4 AM': 0, '8 AM': 0, '12 PM': 0, '4 PM': 0, '8 PM': 0 };
    const distBuckets = { '12 AM': 0, '4 AM': 0, '8 AM': 0, '12 PM': 0, '4 PM': 0, '8 PM': 0 };
    const wasteBuckets = { '12 AM': 0, '4 AM': 0, '8 AM': 0, '12 PM': 0, '4 PM': 0, '8 PM': 0 };

    const getTimeSlot = (hour) => {
      if (hour < 4) return '12 AM';
      if (hour < 8) return '4 AM';
      if (hour < 12) return '8 AM';
      if (hour < 16) return '12 PM';
      if (hour < 20) return '4 PM';
      return '8 PM';
    };

    (recentLogs || []).forEach(log => {
      const logDate = new Date(log.created_at);
      const lbsChanged = Math.abs(Number(log.total_weight_lbs_changed || log.quantity_changed || 0));
      const action = (log.action_type || '').toLowerCase();
      const slot = getTimeSlot(logDate.getHours());

      const isIntake = action.includes('in') || action.includes('intake') || action.includes('receive');
      const isDist = action.includes('out') || action.includes('distribut') || action.includes('checkout');
      const isWaste = action.includes('waste') || action.includes('disposal') || action.includes('audit');

      if (log.created_at >= startOfToday) {
        if (isIntake) {
          todayIntakeLbs += lbsChanged;
          intakeBuckets[slot] += lbsChanged;
        } else if (isDist) {
          todayDistributedLbs += lbsChanged;
          distBuckets[slot] += lbsChanged;
        } else if (isWaste) {
          todayWasteLbs += lbsChanged;
          wasteBuckets[slot] += lbsChanged;
        }
      } else {
        if (isIntake) yesterdayIntakeLbs += lbsChanged;
        else if (isDist) yesterdayDistributedLbs += lbsChanged;
        else if (isWaste) yesterdayWasteLbs += lbsChanged;
      }
    });

    // Fallback yesterday values from daily_org_stats if activity logs were missing
    if (yesterdayIntakeLbs === 0 || yesterdayDistributedLbs === 0) {
      const yesterdayStat = (dailyStats || []).find(s => s.stat_date === yesterdayYMD);
      if (yesterdayStat) {
        if (yesterdayIntakeLbs === 0) yesterdayIntakeLbs = Number(yesterdayStat.lbs_in || 0);
        if (yesterdayDistributedLbs === 0) yesterdayDistributedLbs = Number(yesterdayStat.lbs_out || 0);
        if (yesterdayWasteLbs === 0) yesterdayWasteLbs = Number(yesterdayStat.lbs_wasted || 0);
      }
    }

    const todayHeroTimeline = Object.keys(intakeBuckets).map(time => ({
      time,
      amount: parseFloat(intakeBuckets[time].toFixed(1))
    }));

    const todayDistributionTimeline = Object.keys(distBuckets).map(time => ({
      time,
      amount: parseFloat(distBuckets[time].toFixed(1))
    }));

    const todayWasteTimeline = Object.keys(wasteBuckets).map(time => ({
      time,
      amount: parseFloat(wasteBuckets[time].toFixed(1))
    }));

    // 5. New Catalog Items Added in Last 7 Days
    const sevenDaysAgoISO = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const { count: newItemsCount } = await auth.supabase
      .from('catalog_items')
      .select('id', { count: 'exact', head: true })
      .eq('organization_id', orgId)
      .gte('created_at', sevenDaysAgoISO);

    // Build Response Object
    const totalPeopleServed = totalLbsOut > 0 ? Math.round(totalLbsOut / 15) : 0;
    const totalValue = parseFloat((totalLbsOut * 1.96).toFixed(2));

    const response = {
      // Hero Section Data
      todayIntakeLbs: parseFloat(todayIntakeLbs.toFixed(1)),
      yesterdayIntakeLbs: parseFloat(yesterdayIntakeLbs.toFixed(1)),
      todayDistributedLbs: parseFloat(todayDistributedLbs.toFixed(1)),
      yesterdayDistributedLbs: parseFloat(yesterdayDistributedLbs.toFixed(1)),
      todayWasteLbs: parseFloat(todayWasteLbs.toFixed(1)),
      yesterdayWasteLbs: parseFloat(yesterdayWasteLbs.toFixed(1)),
      currentStockUnits: Math.round(currentStockUnits),
      currentStockWeightLbs: parseFloat(currentStockWeightLbs.toFixed(1)),
      todayHeroTimeline,
      todayDistributionTimeline,
      todayWasteTimeline,
      currentStockUnits: Math.round(currentStockUnits),
      currentStockWeightLbs: parseFloat(currentStockWeightLbs.toFixed(1)),
      todayHeroTimeline,

      // Overview Grid Cards Data
      inventoryStatus,
      intakeTimeSeries,
      distributionTimeSeries,
      wasteTimeSeries,
      newItemsCount: newItemsCount || 0,
      topItems,

      // Backward Compatibility & Legacy Stats
      inventoryCount: Math.round(currentStockUnits),
      totalPeopleServed,
      totalValue,
      totalWeight: parseFloat(totalLbsOut.toFixed(2)),
      totalItemsDistributed: parseFloat(totalLbsOut.toFixed(2)),
      billing: {
        totalSkus: itemMap.size,
        totalClients: maxVolunteers
      },
      lastUpdated: now.toISOString()
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('❌ GET /api/dashboard/stats - Error:', error);
    return NextResponse.json({ message: 'Server Error' }, { status: 500 });
  }
}