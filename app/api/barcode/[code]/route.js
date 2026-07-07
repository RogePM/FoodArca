import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { mapOpenFoodFactsCategory } from '@/lib/categoryMapper';

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
  
  // Parallelize location lookups by id and by organization_id
  const [locRes, firstLocRes] = await Promise.all([
    supabase.from('locations').select('id, organization_id').eq('id', pantryId).maybeSingle(),
    supabase.from('locations').select('id, organization_id').eq('organization_id', pantryId).order('created_at', { ascending: true }).limit(1).maybeSingle()
  ]);

  if (locRes.data) {
    return { locationId: locRes.data.id, orgId: locRes.data.organization_id };
  }
  if (firstLocRes.data) {
    return { locationId: firstLocRes.data.id, orgId: firstLocRes.data.organization_id };
  }
  return null;
}

export async function GET(req, { params }) {
  try {
    const auth = await authenticateRequest();
    if (!auth.authenticated) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { code } = await params;
    const pantryId = req.headers.get('x-pantry-id');

    if (!pantryId) {
      return NextResponse.json({ message: 'Pantry ID is required' }, { status: 400 });
    }

    const resolved = await resolveLocationAndOrg(auth.supabase, pantryId);
    if (!resolved) {
      return NextResponse.json({ message: 'Organization not found' }, { status: 404 });
    }
    const { orgId } = resolved;

    if (!code) {
      return NextResponse.json({ message: 'Barcode is required' }, { status: 400 });
    }

    const cleanCode = code.trim();

    // Launch membership check, local catalog lookup, and OpenFoodFacts fetch ALL IN PARALLEL!
    const membershipPromise = auth.supabase
      .from('user_organizations')
      .select('role, status')
      .eq('user_id', auth.user.id)
      .eq('organization_id', orgId)
      .eq('status', 'active')
      .maybeSingle();

    const catalogPromise = auth.supabase
      .from('catalog_items')
      .select(`
        id, name, barcode, photo_url, unit_of_measure, input_unit_value, weight_per_unit_lbs,
        category:categories ( id, name, is_food )
      `)
      .eq('organization_id', orgId)
      .eq('barcode', cleanCode)
      .maybeSingle();

    const offPromise = fetch(`https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(cleanCode)}.json`, {
      headers: { 'User-Agent': 'FoodArca/1.0 (contact@foodarca.com)' },
      signal: AbortSignal.timeout(5000),
      next: { revalidate: 86400 } // Cache barcode lookups for 24 hours
    }).catch(err => {
      console.warn('⚠️ OpenFoodFacts API lookup failed or timed out:', err.message);
      return null;
    });

    const [memberRes, catalogRes, offRes] = await Promise.all([membershipPromise, catalogPromise, offPromise]);

    if (memberRes.error || !memberRes.data) {
      console.log(`🚫 Security Alert: ${auth.user.email} attempted unauthorized access to org ${orgId}`);
      return NextResponse.json({ message: 'Access Denied: You are not a member of this organization.' }, { status: 403 });
    }

    if (catalogRes.error) {
      console.error('❌ GET /api/barcode - Database Error:', catalogRes.error);
      return NextResponse.json({ message: 'Database Error' }, { status: 500 });
    }

    if (catalogRes.data) {
      const item = catalogRes.data;
      const formatted = {
        _id: item.id,
        id: item.id,
        name: item.name,
        barcode: item.barcode,
        category: item.category?.name || 'other',
        unit: item.unit_of_measure || 'units',
        inputUnitValue: item.input_unit_value || 1,
        weightPerUnit: item.weight_per_unit_lbs || 1,
        photoUrl: item.photo_url || null,
        source: 'catalog'
      };
      return NextResponse.json({ found: true, source: 'catalog', data: formatted });
    }

    // If not found in local catalog, process OpenFoodFacts API result
    if (offRes && offRes.ok) {
      try {
        const offData = await offRes.json();
        if (offData && offData.status === 1 && offData.product) {
          const p = offData.product;
          const name = p.product_name || p.product_name_en || p.generic_name || 'Scanned Item';
          const photoUrl = p.image_front_small_url || p.image_url || null;
          
          // Map OpenFoodFacts category using our robust categoryMapper utility
          const tags = [p.categories, p.categories_old, ...(Array.isArray(p.categories_tags) ? p.categories_tags : [])].filter(Boolean);
          const category = mapOpenFoodFactsCategory(tags);

          // Parse quantity/unit string (e.g. "20 fl oz", "15 oz", "5 lb", "500g", "1 gal")
          let unit = 'units';
          let inputUnitValue = 1;
          const qtyStr = String(p.quantity || p.serving_size || '').toLowerCase();
          const matchNum = qtyStr.match(/(\d+(?:\.\d+)?)/);
          const parsedNum = matchNum ? parseFloat(matchNum[1]) : NaN;

          if (/(?:\b|(?<=\d))(fl\.?\s?oz|fluid\s?oz|fl\s?oz)\b/.test(qtyStr)) {
            unit = 'oz';
            if (!isNaN(parsedNum)) inputUnitValue = parsedNum;
          } else if (/(?:\b|(?<=\d))(oz|ounce|ounces)\b/.test(qtyStr)) {
            unit = 'oz';
            if (!isNaN(parsedNum)) inputUnitValue = parsedNum;
          } else if (/(?:\b|(?<=\d))(lb|lbs|pound|pounds)\b/.test(qtyStr)) {
            unit = 'lbs';
            if (!isNaN(parsedNum)) inputUnitValue = parsedNum;
          } else if (/(?:\b|(?<=\d))(kg|kilo|kilos|kilogram|kilograms)\b/.test(qtyStr)) {
            unit = 'kg';
            if (!isNaN(parsedNum)) inputUnitValue = parsedNum;
          } else if (/(?:\b|(?<=\d))(gal|gallon|gallons)\b/.test(qtyStr)) {
            unit = 'gal';
            if (!isNaN(parsedNum)) inputUnitValue = parsedNum;
          } else if (/(?:\b|(?<=\d))(g|gram|grams)\b/.test(qtyStr)) {
            unit = 'oz';
            if (!isNaN(parsedNum)) inputUnitValue = Math.round((parsedNum / 28.3495) * 10) / 10;
          } else if (/(?:\b|(?<=\d))(ml|l|liter|litres?|liters?)\b/.test(qtyStr)) {
            unit = 'oz';
            if (!isNaN(parsedNum)) inputUnitValue = Math.round((parsedNum / 29.5735) * 10) / 10;
          } else if (/(?:\b|(?<=\d))(can|cans|jar|jars|box|boxes|bag|bags|count|units?)\b/.test(qtyStr)) {
            unit = 'units';
            if (!isNaN(parsedNum)) inputUnitValue = parsedNum;
          }

          return NextResponse.json({
            found: true,
            source: 'openfoodfacts',
            data: {
              name,
              barcode: cleanCode,
              category,
              unit,
              inputUnitValue,
              photoUrl,
              weightPerUnit: unit === 'lbs' ? inputUnitValue : (unit === 'oz' ? Math.round((inputUnitValue / 16) * 100) / 100 : 1),
              source: 'openfoodfacts'
            }
          });
        }
      } catch (offParseErr) {
        console.warn('⚠️ OpenFoodFacts JSON parse failed:', offParseErr.message);
      }
    }

    return NextResponse.json({ found: false, source: 'none', data: null });
  } catch (error) {
    console.error('❌ GET /api/barcode - Error:', error);
    return NextResponse.json({ message: 'Server Error' }, { status: 500 });
  }
}