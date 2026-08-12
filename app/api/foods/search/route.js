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

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q');
  const pantryId = request.headers.get('x-pantry-id');

  if (!q || q.length < 2) {
    return NextResponse.json({ products: [] });
  }

  let finalResults = [];

  try {
    // 1. LOCAL CACHE (SUPABASE) SEARCH
    let orgId = null;
    let localFound = 0;
    
    if (pantryId) {
      const auth = await authenticateRequest();
      if (auth.authenticated && auth.supabase) {
        const resolved = await resolveLocationAndOrg(auth.supabase, pantryId);
        if (resolved && resolved.orgId) {
          orgId = resolved.orgId;
          
          // Search local catalog_items
          const { data: localItems, error: localErr } = await auth.supabase
            .from('catalog_items')
            .select('id, barcode, name, category_id, photo_url, categories(id, name)')
            .eq('organization_id', orgId)
            .ilike('name', `%${q}%`)
            .limit(5);
            
          if (!localErr && localItems && localItems.length > 0) {
            const mappedLocal = localItems.map(item => {
              let categorySlug = 'other';
              if (item.categories?.name) {
                // Map the DB name (e.g. "Canned Goods") to the frontend slug (e.g. "canned_goods")
                const normalizedDbName = item.categories.name.toLowerCase().replace(/ & /g, '_').replace(/ /g, '_');
                categorySlug = normalizedDbName;
              }

              return {
                id: item.barcode || item.id,
                name: item.name,
                category: categorySlug,
                photoUrl: item.photo_url || null,
                brand: 'Local Pantry', // Indicator that it came from their own database
                source: 'local'
              };
            });
            
            finalResults = [...mappedLocal];
            localFound = mappedLocal.length;
          }
        }
      }
    }

    // 2. EXTERNAL API FALLBACK (Only if local results are few)
    if (localFound < 3) {
      try {
        const url = `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(q)}&search_simple=1&action=process&json=1&page_size=10`;
        const response = await fetch(url, {
          headers: {
            'User-Agent': 'FoodArca - Web - Version 1.0',
            'Accept': 'application/json'
          },
          signal: AbortSignal.timeout(3000)
        });

        if (response.ok) {
          const data = await response.json();
          if (data.products && Array.isArray(data.products)) {
            const offResults = data.products
              .filter(p => p.product_name)
              .map(p => {
                const tags = p.categories_tags || [];
                const category = mapOpenFoodFactsCategory(tags);
                return {
                  id: p.code,
                  name: p.product_name,
                  category: category,
                  photoUrl: p.image_front_url || p.image_url || null,
                  brand: p.brands ? p.brands.split(',')[0].trim() : null,
                  source: 'external'
                };
              });

            finalResults = [...finalResults, ...offResults];
          }
        }
      } catch (offErr) {
        console.error('OFF API Error:', offErr);
        // Fail silently and just return the local results if the external API rate-limits us.
      }
    }

    // 3. DEDUPLICATE AND SLICE (O(N) Set-based deduplication)
    const seen = new Set();
    const dedupedResults = [];

    for (const product of finalResults) {
      // For autocomplete, we want to show unique names (or name + brand) rather than 5 generic 'Beans'.
      const normalizedName = product.name.toLowerCase().trim();
      const brandStr = product.brand ? product.brand.toLowerCase().trim() : '';
      const dedupKey = `${normalizedName}|${brandStr}`;

      if (!seen.has(dedupKey)) {
        seen.add(dedupKey);
        dedupedResults.push(product);
        if (dedupedResults.length === 5) break; // Slice early
      }
    }

    return NextResponse.json({ products: dedupedResults });

  } catch (error) {
    console.error('Error fetching foods search:', error);
    return NextResponse.json({ products: finalResults.slice(0, 5) });
  }
}
