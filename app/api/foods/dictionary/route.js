import { NextResponse } from 'next/server';
import { handle, getContext, ITEM_SELECT, toDictionaryItem, fetchCatalogPage } from '@/lib/server/inventory-api';
import { fromSearchParams, toCatalogRpcArgs } from '@/lib/inventory-query';

// GET: the pantry's item list (for name autocomplete, restock, the no-barcode grid).
// Optional ?names=a,b,c to fetch just a few items by name.
// With ?limit= (plus filter, q, offset, summary=1; see lib/inventory-query), one page of it instead,
// each item with its stock here: { total, ids, items, summary }. Restock uses this when the pantry
// is too large to keep the whole list on the device.
export const GET = handle(async (req) => {
  const { supabase, orgId, locationId } = await getContext(req);

  const { searchParams } = new URL(req.url);
  if (searchParams.has('limit')) {
    const page = await fetchCatalogPage(supabase, toCatalogRpcArgs(locationId, fromSearchParams(searchParams)));
    return NextResponse.json(page || { total: 0, ids: [], items: [], summary: null });
  }

  const namesParam = searchParams.get('names');
  const names = namesParam
    ? namesParam.split(',').map((n) => n.trim()).filter(Boolean).slice(0, 20)
    : null;

  let query = supabase
    .from('catalog_items')
    .select(ITEM_SELECT)
    .eq('organization_id', orgId)
    .is('archived_at', null);

  if (names && names.length > 0) {
    query = query.or(names.map((n) => `name.ilike.${n.replace(/[%,()]/g, '')}`).join(','));
  } else {
    query = query.order('created_at', { ascending: false }).limit(1000);
  }

  const { data, error } = await query;
  if (error) throw error;

  return NextResponse.json({ dictionary: (data || []).map(toDictionaryItem) });
});
