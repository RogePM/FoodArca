import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

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

  return null;
}

export async function GET(request) {
  const pantryId = request.headers.get('x-pantry-id');
  if (!pantryId) return NextResponse.json({ dictionary: [] });

  try {
    const auth = await authenticateRequest();
    if (!auth.authenticated || !auth.supabase) {
      return NextResponse.json({ dictionary: [] }, { status: 401 });
    }

    const resolved = await resolveLocationAndOrg(auth.supabase, pantryId);
    if (!resolved || !resolved.orgId) {
      return NextResponse.json({ dictionary: [] });
    }

    // Fetch the unique catalog items for this organization
    const { data: localItems, error: localErr } = await auth.supabase
      .from('catalog_items')
      .select('id, barcode, name, category_id, photo_url, categories(id, name)')
      .eq('organization_id', resolved.orgId)
      .order('created_at', { ascending: false })
      .limit(1000); // Reasonable limit for small/medium pantries

    if (localErr || !localItems) {
      return NextResponse.json({ dictionary: [] });
    }

    // Deduplicate by name
    const seen = new Set();
    const dictionary = [];

    for (const item of localItems) {
      const normalizedName = item.name?.toLowerCase().trim() || '';
      if (!seen.has(normalizedName)) {
        seen.add(normalizedName);
        
        let categorySlug = 'other';
        if (item.categories?.name) {
          categorySlug = item.categories.name.toLowerCase().replace(/ & /g, '_').replace(/ /g, '_');
        }

        dictionary.push({
          id: item.barcode || item.id,
          name: item.name,
          category: categorySlug,
          photoUrl: item.photo_url || null,
        });
      }
    }

    return NextResponse.json({ dictionary });
  } catch (error) {
    console.error('Error fetching dictionary:', error);
    return NextResponse.json({ dictionary: [] });
  }
}
