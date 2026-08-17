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

  // OPTIMIZATION: Use getSession() instead of getUser(). 
  // getSession() decodes the JWT cookie locally (0ms latency).
  // getUser() makes a network request to the Auth server (100ms latency).
  const { data: { session }, error } = await supabase.auth.getSession();
  if (error || !session?.user) return { authenticated: false, user: null, supabase: null };

  return { authenticated: true, user: session.user, supabase };
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

    // 2. EXTERNAL API FALLBACK REMOVED
    // We no longer query Open Food Facts for fuzzy text searches because it is too slow
    // and returns generic duplicates. Open Food Facts is now only used for exact barcode scans.

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
