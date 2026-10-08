import { NextResponse } from 'next/server';
import { handle, getContext, BATCH_SELECT, mapBatch } from '@/lib/server/inventory-api';
import { pantryToday } from '@/lib/pantry-context';

// Pounds only count what is actually known: a drop-off's scale weight when it was weighed,
// otherwise item weights. Items with no known weight are reported separately ("not weighed"),
// never guessed. Corrections are not waste.

const round1 = (n) => parseFloat(Number(n || 0).toFixed(1));

// Days and hours are the pantry's own (its location's timezone), not the server's (UTC), so
// "today" turns over at the pantry's midnight, the same day the rest of the app uses (pantryToday).
const addDays = (ymd, n) => {
  const d = new Date(`${ymd}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
};
function hourIn(timezone, at) {
  try {
    return Number(new Intl.DateTimeFormat('en-US', { timeZone: timezone || 'America/New_York', hour: 'numeric', hourCycle: 'h23' }).format(at));
  } catch {
    return at.getUTCHours();
  }
}

export const GET = handle(async (req) => {
  const { supabase, orgId, timezone } = await getContext(req);
  const dayOf = (at) => pantryToday(timezone, at);

  const rangeParam = new URL(req.url).searchParams.get('range') || '7d';
  const now = new Date();
  let startDate = new Date();
  if (rangeParam === '4w') startDate.setDate(now.getDate() - 28);
  else if (rangeParam === 'mtd') startDate = new Date(now.getFullYear(), now.getMonth(), 1);
  else if (rangeParam === 'qtd') startDate = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
  else if (rangeParam === 'all') startDate = new Date(2000, 0, 1);
  else startDate.setDate(now.getDate() - 7);

  const todayStr = dayOf(now);
  const yesterdayStr = addDays(todayStr, -1);
  const in7 = addDays(todayStr, 7);
  // Two days back always covers the pantry's yesterday, whatever its timezone.
  const twoDaysAgo = new Date(now.getTime() - 2 * 864e5);
  const fetchFrom = (startDate < twoDaysAgo ? startDate : twoDaysAgo).toISOString();

  // ---------------- Current stock ----------------
  const { data: lotRows, error: lotErr } = await supabase
    .from('inventory_batches')
    .select(BATCH_SELECT)
    .eq('organization_id', orgId);
  if (lotErr) throw lotErr;
  const lots = (lotRows || []).map(mapBatch);

  let currentStockUnits = 0;
  let currentStockWeightLbs = 0;
  let stockItemsNotWeighed = 0;
  const inventoryStatus = { expired: 0, expiringSoon: 0, good: 0, noDate: 0 }; // counted items
  const inventoryStatusLbs = { expired: 0, expiringSoon: 0, good: 0, noDate: 0 }; // weighed items
  const itemMap = new Map();

  for (const l of lots) {
    const isWeight = l.trackBy === 'weight';
    if (isWeight) currentStockWeightLbs += l.quantity;
    else {
      currentStockUnits += l.quantity;
      if (l.weightPerUnit != null) currentStockWeightLbs += l.quantity * l.weightPerUnit;
      else stockItemsNotWeighed += l.quantity;
    }

    const bucket = isWeight ? inventoryStatusLbs : inventoryStatus;
    if (!l.expirationDate) bucket.noDate += l.quantity;
    else if (l.expirationDate < todayStr) bucket.expired += l.quantity;
    else if (l.expirationDate <= in7) bucket.expiringSoon += l.quantity;
    else bucket.good += l.quantity;

    const entry = itemMap.get(l.catalogItemId) || { name: l.name, unit: l.unit, quantity: 0 };
    entry.quantity += l.quantity;
    itemMap.set(l.catalogItemId, entry);
  }
  const topItems = [...itemMap.values()].sort((a, b) => b.quantity - a.quantity).slice(0, 5);

  // ---------------- History in range ----------------
  const [{ data: logs, error: logErr }, { data: weighed, error: delErr }, { count: visitsCount }, { count: newItemsCount }] =
    await Promise.all([
      supabase
        .from('activity_logs')
        .select('created_at, action_type, quantity_changed, unit, weight_lbs_changed, delivery_id')
        .eq('organization_id', orgId)
        .in('action_type', ['received', 'given_out', 'thrown_out'])
        .gte('created_at', fetchFrom),
      supabase
        .from('deliveries')
        .select('id, received_at, weighed_lbs')
        .eq('organization_id', orgId)
        .not('weighed_lbs', 'is', null)
        .gte('received_at', fetchFrom),
      supabase
        .from('visits')
        .select('id', { count: 'exact', head: true })
        .eq('organization_id', orgId)
        .gte('created_at', startDate.toISOString()),
      supabase
        .from('catalog_items')
        .select('id', { count: 'exact', head: true })
        .eq('organization_id', orgId)
        .gte('created_at', new Date(now.getTime() - 7 * 864e5).toISOString()),
    ]);
  if (logErr) throw logErr;
  if (delErr) throw delErr;

  // One event list: { kind: in | out | waste, at, lbs (null = unknown), items }
  const weighedIds = new Set((weighed || []).map((d) => d.id));
  const events = [];
  for (const d of weighed || []) events.push({ kind: 'in', at: d.received_at, lbs: Number(d.weighed_lbs), items: 0 });
  for (const log of logs || []) {
    const kind = log.action_type === 'received' ? 'in' : log.action_type === 'given_out' ? 'out' : 'waste';
    const items = log.unit === 'items' ? Number(log.quantity_changed) : 0;
    const scaleCovered = kind === 'in' && log.delivery_id && weighedIds.has(log.delivery_id);
    const lbs = scaleCovered ? 0 : log.weight_lbs_changed != null ? Number(log.weight_lbs_changed) : null;
    events.push({ kind, at: log.created_at, lbs, items, unweighed: lbs === null ? Math.abs(items) : 0 });
  }
  // Signs: received is +, given out / thrown out are − (undo rows carry the opposite sign).
  const signed = (e) => (e.kind === 'in' ? 1 : -1);

  // One point per pantry day, from the range's first day through today.
  const series = (start) => {
    const map = new Map();
    let day = dayOf(start);
    if (rangeParam === 'all') {
      const cap = addDays(todayStr, -30);
      if (day < cap) day = cap;
    }
    for (; day <= todayStr; day = addDays(day, 1)) {
      const label = new Date(`${day}T12:00:00Z`).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });
      map.set(day, { date: label, amount: 0 });
    }
    return map;
  };
  const seriesMaps = { in: series(startDate), out: series(startDate), waste: series(startDate) };
  const totals = { in: 0, out: 0, waste: 0 };
  const itemTotals = { in: 0, out: 0, waste: 0 };
  const notWeighed = { in: 0, out: 0, waste: 0 };
  const today = { in: 0, out: 0, waste: 0 };
  const yesterday = { in: 0, out: 0, waste: 0 };
  const slots = ['12 AM', '4 AM', '8 AM', '12 PM', '4 PM', '8 PM'];
  const buckets = { in: {}, out: {}, waste: {} };
  for (const k of Object.keys(buckets)) for (const s of slots) buckets[k][s] = 0;

  for (const e of events) {
    const at = new Date(e.at);
    const day = dayOf(at);
    const lbs = e.lbs == null ? 0 : e.lbs * signed(e);
    if (at >= startDate) {
      totals[e.kind] += lbs;
      itemTotals[e.kind] += e.items * signed(e);
      notWeighed[e.kind] += e.unweighed || 0;
      const point = seriesMaps[e.kind].get(day);
      if (point) point.amount += lbs;
    }
    if (day === todayStr) {
      today[e.kind] += lbs;
      buckets[e.kind][slots[Math.min(5, Math.floor(hourIn(timezone, at) / 4))]] += lbs;
    } else if (day === yesterdayStr) {
      yesterday[e.kind] += lbs;
    }
  }

  const toSeries = (m) => [...m.values()].map((v) => ({ date: v.date, amount: round1(v.amount) }));
  const toTimeline = (b) => slots.map((time) => ({ time, amount: round1(b[time]) }));

  return NextResponse.json({
    // Hero
    todayIntakeLbs: round1(today.in),
    yesterdayIntakeLbs: round1(yesterday.in),
    todayDistributedLbs: round1(today.out),
    yesterdayDistributedLbs: round1(yesterday.out),
    todayWasteLbs: round1(today.waste),
    yesterdayWasteLbs: round1(yesterday.waste),
    currentStockUnits: Math.round(currentStockUnits),
    currentStockWeightLbs: round1(currentStockWeightLbs),
    stockItemsNotWeighed: Math.round(stockItemsNotWeighed),
    todayHeroTimeline: toTimeline(buckets.in),
    todayDistributionTimeline: toTimeline(buckets.out),
    todayWasteTimeline: toTimeline(buckets.waste),

    // Overview grid
    inventoryStatus,
    inventoryStatusLbs,
    intakeTimeSeries: toSeries(seriesMaps.in),
    distributionTimeSeries: toSeries(seriesMaps.out),
    wasteTimeSeries: toSeries(seriesMaps.waste),
    newItemsCount: newItemsCount || 0,
    topItems,

    // Range totals (pounds are known pounds only; items are counted items)
    totalWeight: round1(totals.in),
    totalItemsDistributed: round1(totals.out), // lb given out (label on the dashboard says lbs)
    totalWasteLbs: round1(totals.waste),
    itemsReceived: Math.round(itemTotals.in),
    itemsGivenOut: Math.round(itemTotals.out),
    itemsThrownOut: Math.round(itemTotals.waste),
    itemsNotWeighed: notWeighed,
    visitsCount: visitsCount || 0,
    totalPeopleServed: visitsCount || 0, // visits served (households), not an estimate from pounds
    totalValue: parseFloat((totals.out * 1.96).toFixed(2)), // estimated, known pounds only

    inventoryCount: Math.round(currentStockUnits),
    billing: { totalSkus: itemMap.size, totalClients: 0 },
    lastUpdated: now.toISOString(),
  });
});
