import { NextResponse } from 'next/server';
import { handle, getContext, ITEM_SELECT, mapItem, ApiError } from '@/lib/server/inventory-api';

// Size printed on the label, e.g. "15 oz", "20 fl oz", "1 gal", "500 g", "12 ct".
// Returned as written; the database converts g / kg / mL / L when the item is saved.
function parseLabelSize(raw) {
  const s = String(raw || '').toLowerCase();
  const num = s.match(/(\d+(?:[.,]\d+)?)/);
  if (!num) return null;
  const amount = parseFloat(num[1].replace(',', '.'));
  if (!(amount > 0)) return null;
  const rules = [
    [/fl\.?\s?oz|fluid\s?ounces?/, 'fl_oz'],
    [/\b(oz|ounces?)\b|\doz\b/, 'oz'],
    [/\b(lbs?|pounds?)\b|\dlbs?\b/, 'lb'],
    [/\b(kg|kilos?|kilograms?)\b|\dkg\b/, 'kg'],
    [/\b(gal|gallons?)\b|\dgal\b/, 'gal'],
    [/\b(ml|millilit(er|re)s?)\b|\dml\b/, 'ml'],
    [/\b(l|lit(er|re)s?)\b|\dl\b/, 'l'],
    [/\b(g|grams?)\b|\dg\b/, 'g'],
    [/\b(ct|count|pack|pcs|pieces?)\b/, 'ct'],
  ];
  for (const [re, unit] of rules) if (re.test(s)) return { amount, unit };
  return null;
}

const LB_PER = { oz: 1 / 16, lb: 1, kg: 2.20462, g: 1 / 453.592, fl_oz: 0.0652, gal: 8.34, ml: 0.0022, l: 2.2046 };

// GET: look up a scanned barcode — the pantry's own items first, then Open Food Facts.
// Open Food Facts never sets the category: the volunteer picks it once.
export const GET = handle(async (req, { params }) => {
  const { code } = await params;
  const cleanCode = String(code || '').trim();
  if (!cleanCode) throw new ApiError(400, 'Barcode is required');

  const offPromise = fetch(`https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(cleanCode)}.json`, {
    headers: { 'User-Agent': 'FoodArca/1.0 (contact@foodarca.com)' },
    signal: AbortSignal.timeout(5000),
    next: { revalidate: 86400 },
  }).catch((err) => {
    console.warn('OpenFoodFacts lookup failed or timed out:', err.message);
    return null;
  });

  const { supabase, orgId } = await getContext(req);
  const { data: row, error } = await supabase
    .from('catalog_items')
    .select(ITEM_SELECT)
    .eq('organization_id', orgId)
    .eq('barcode', cleanCode)
    .maybeSingle();
  if (error) throw error;

  if (row) {
    const item = mapItem(row);
    return NextResponse.json({
      found: true,
      source: 'catalog',
      data: {
        ...item,
        _id: item.catalogItemId,
        id: item.catalogItemId,
        category: item.categorySlug || 'other', // legacy: UI slug
        categoryName: item.category,
        inputUnitValue: item.sizeAmount, // legacy
        source: 'catalog',
      },
    });
  }

  const offRes = await offPromise;
  if (offRes && offRes.ok) {
    try {
      const offData = await offRes.json();
      if (offData?.status === 1 && offData.product) {
        const p = offData.product;
        const size = parseLabelSize(p.quantity);
        const weightPerUnit = size && size.unit !== 'ct' ? Math.round(size.amount * LB_PER[size.unit] * 1000) / 1000 : null;
        return NextResponse.json({
          found: true,
          source: 'openfoodfacts',
          data: {
            name: p.product_name || p.product_name_en || p.generic_name || null,
            barcode: cleanCode,
            photoUrl: p.image_front_small_url || p.image_url || null,
            category: null,
            categoryId: null,
            trackBy: 'count',
            unit: 'items',
            sizeAmount: size?.amount ?? null,
            sizeUnit: size?.unit ?? null,
            weightPerUnit,
            source: 'openfoodfacts',
          },
        });
      }
    } catch (parseErr) {
      console.warn('OpenFoodFacts JSON parse failed:', parseErr.message);
    }
  }

  return NextResponse.json({ found: false, source: 'none', data: null });
});
