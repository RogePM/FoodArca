import { Suspense } from 'react';
import { InventoryView } from '@/components/pages/inventory';
import { fetchInventoryPage } from '@/lib/server/inventory-api';
import { getDashboardContext } from '@/lib/server/dashboard-context';
import { FIRST_PAGE, queryKey, toRpcArgs } from '@/lib/inventory-query';

export const metadata = {
  title: 'Inventory | Food Arca',
};

// The first page of items, drawn here on the server so the page arrives with real items (and its
// largest image) in the HTML: no skeleton, no wait for the app to start and fetch. Who and where
// come from the dashboard context the layout already worked out for this request (no second
// lookup); the query runs as the signed-in user, so RLS decides what's visible.
async function firstPage(params) {
  const { supabase, locationId } = await getDashboardContext();
  if (!locationId) return null;
  const query = { filter: params.filter || 'ALL', search: params.q || '', itemId: params.itemId || null };
  try {
    const page = await fetchInventoryPage(supabase, locationId, toRpcArgs(locationId, { ...query, limit: FIRST_PAGE, summary: true }));
    return page && { ...page, key: queryKey(query), fetchedAt: Date.now() };
  } catch (err) {
    console.error('Inventory first page:', err);
    return null;
  }
}

export default async function InventoryPage({ searchParams }) {
  const initial = await firstPage((await searchParams) || {});
  return (
    <Suspense fallback={null}>
      <InventoryView initial={initial} />
    </Suspense>
  );
}
