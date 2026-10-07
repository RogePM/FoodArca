import { NextResponse } from 'next/server';
import { handle, getContext, ITEM_SELECT, mapItem } from '@/lib/server/inventory-api';

// GET: the pantry's item list (for name autocomplete, restock, the no-barcode grid).
// Optional ?names=a,b,c to fetch just a few items by name.
export const GET = handle(async (req) => {
  const { supabase, orgId } = await getContext(req);

  const { searchParams } = new URL(req.url);
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

  const dictionary = (data || []).map((row) => {
    const item = mapItem(row);
    return {
      ...item,
      id: item.barcode || item.catalogItemId, // legacy key used by the current UI
      category: item.categorySlug || 'other', // legacy: UI slug
      categoryName: item.category,
    };
  });

  return NextResponse.json({ dictionary });
});
