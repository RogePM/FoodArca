import { NextResponse } from 'next/server';
import { handle, getContext, fetchHistory, fetchRecentlyAdded } from '@/lib/server/inventory-api';

// GET: the 50 most recent history rows for the pantry's organization.
// ?added=N instead returns the N items most recently received (each once, newest first) with their
// photos, in one small response, for the Add page's "Recently added" strip.
export const GET = handle(async (req) => {
  const { supabase, orgId } = await getContext(req);

  const added = Number(new URL(req.url).searchParams.get('added')) || 0;
  if (added > 0) return NextResponse.json(await fetchRecentlyAdded(supabase, orgId, added));

  const rows = await fetchHistory(supabase, (q) =>
    q.eq('organization_id', orgId).order('created_at', { ascending: false }).limit(50)
  );
  return NextResponse.json(rows);
});
