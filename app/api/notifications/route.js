import { NextResponse } from 'next/server';
import { getPlanDetails } from '@/lib/plans';
import { handle, getContext, BATCH_SELECT, mapBatch } from '@/lib/server/inventory-api';

const LOW_STOCK_ITEMS = 5; // counted items only; weighed items have no low-stock rule yet

export const GET = handle(async (req) => {
  const { supabase, orgId } = await getContext(req);
  const alerts = [];

  // --- Plan limits ---
  const { data: org } = await supabase
    .from('organizations')
    .select('plan_type, current_item_count')
    .eq('id', orgId)
    .maybeSingle();
  if (org) {
    const plan = getPlanDetails(org.plan_type || 'free');
    const itemLimit = plan?.limits?.items || 150;
    const currentItems = org.current_item_count || 0;
    if (itemLimit < 999999) {
      if (currentItems >= itemLimit) {
        alerts.push({
          id: 'limit-items-crit', type: 'critical', title: 'Item Limit Reached',
          message: `You reached the ${itemLimit} item limit on the ${plan.name} plan. Upgrade to increase your capacity.`,
          action: 'Upgrade', targetView: 'Settings',
        });
      } else if (currentItems >= itemLimit * 0.9) {
        alerts.push({
          id: 'limit-items-warn', type: 'warning', title: 'Item Limit Near',
          message: `You are at ${currentItems}/${itemLimit} items on the ${plan.name} plan.`,
          action: 'Upgrade', targetView: 'Settings',
        });
      }
    }
  }

  // --- Stock across the organization. Lots with no date never count as expiring. ---
  const { data: lots, error } = await supabase
    .from('inventory_batches')
    .select(BATCH_SELECT)
    .eq('organization_id', orgId);
  if (error) throw error;
  const all = (lots || []).map(mapBatch);

  const today = new Date().toISOString().slice(0, 10);
  const in30 = new Date(Date.now() + 30 * 864e5).toISOString().slice(0, 10);

  const expired = all.filter((l) => l.expirationDate && l.expirationDate < today);
  if (expired.length > 0) {
    alerts.push({
      id: 'expired-crit', type: 'critical', title: 'Expired Stock',
      message: `${expired.length} ${expired.length === 1 ? 'stock entry is' : 'stock entries are'} past the expiration date.`,
      action: 'Remove Items', targetView: 'View Inventory',
    });
  }

  const expiring = all
    .filter((l) => l.expirationDate && l.expirationDate >= today && l.expirationDate <= in30)
    .sort((a, b) => a.expirationDate.localeCompare(b.expirationDate));
  if (expiring.length > 0) {
    alerts.push({
      id: 'expiry-alert', type: 'warning', title: 'Expiring Soon',
      message: `${expiring.length} ${expiring.length === 1 ? 'stock entry expires' : 'stock entries expire'} within 30 days.`,
      action: 'Check Stock', targetView: 'View Inventory',
    });
  }

  const totals = new Map();
  for (const l of all) {
    if (l.trackBy !== 'count') continue;
    totals.set(l.catalogItemId, (totals.get(l.catalogItemId) || 0) + l.quantity);
  }
  const lowCount = [...totals.values()].filter((q) => q < LOW_STOCK_ITEMS).length;
  if (lowCount > 0) {
    alerts.push({
      id: 'low-stock-alert', type: 'info', title: 'Low Stock Notice',
      message: `${lowCount} ${lowCount === 1 ? 'item has' : 'items have'} fewer than ${LOW_STOCK_ITEMS} left.`,
      action: 'Restock', targetView: 'View Inventory',
    });
  }

  const expiringItems = expiring.slice(0, 10).map((l) => ({
    _id: l.id, id: l.id, name: l.name, quantity: l.quantity, unit: l.unit,
    expirationDate: l.expirationDate, expirationPrecision: l.expirationPrecision,
  }));

  return NextResponse.json({ alerts, expiringItems });
});
