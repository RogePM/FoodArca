import { NextResponse } from 'next/server';
import { getContext, ITEM_SELECT, mapItem } from '@/lib/server/inventory-api';

// GET ?q= : name search over the pantry's own items (autocomplete).
export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const q = (searchParams.get('q') || '').trim();
  if (q.length < 2) return NextResponse.json({ products: [] });

  try {
    const { supabase, orgId } = await getContext(req);
    const { data, error } = await supabase
      .from('catalog_items')
      .select(ITEM_SELECT)
      .eq('organization_id', orgId)
      .is('archived_at', null)
      .ilike('name', `%${q.replace(/[%_\\]/g, (c) => `\\${c}`)}%`)
      .limit(5);
    if (error) throw error;

    const products = (data || []).map((row) => {
      const item = mapItem(row);
      return {
        ...item,
        id: item.barcode || item.catalogItemId,
        category: item.categorySlug || 'other',
        categoryName: item.category,
        brand: 'Local Pantry',
        source: 'local',
      };
    });
    return NextResponse.json({ products });
  } catch (error) {
    if (error?.status !== 401 && error?.status !== 403) console.error('GET /api/foods/search Error:', error);
    return NextResponse.json({ products: [] });
  }
}
