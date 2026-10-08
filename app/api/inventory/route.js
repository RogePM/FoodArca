import { NextResponse } from 'next/server';
import { handle, getContext, fetchInventoryPage } from '@/lib/server/inventory-api';
import { fromSearchParams, toRpcArgs } from '@/lib/inventory-query';

// GET: one page of the Inventory screen (see lib/inventory-query for the parameters):
//   ?filter=EXPIRED|<category>&q=&item=&sort=name|quantity&desc=1&limit=24&offset=0&summary=1
// → { total, ids, lots, summary }: the matching item count, this page's item ids in order, their
//   lots, and (with summary=1) the filter-pill counts.
export const GET = handle(async (req) => {
  const { supabase, locationId } = await getContext(req);
  const query = fromSearchParams(new URL(req.url).searchParams);
  const page = await fetchInventoryPage(supabase, locationId, toRpcArgs(locationId, query));
  return NextResponse.json(page || { total: 0, ids: [], lots: [], summary: null });
});
