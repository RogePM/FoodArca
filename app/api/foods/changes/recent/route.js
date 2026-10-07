import { NextResponse } from 'next/server';
import { handle, getContext, fetchHistory } from '@/lib/server/inventory-api';

// GET: the 50 most recent history rows for the pantry's organization.
export const GET = handle(async (req) => {
  const { supabase, orgId } = await getContext(req);
  const rows = await fetchHistory(supabase, (q) =>
    q.eq('organization_id', orgId).order('created_at', { ascending: false }).limit(50)
  );
  return NextResponse.json(rows);
});
