import { NextResponse } from 'next/server';
import { handle, getContext, fetchHistory } from '@/lib/server/inventory-api';

const TYPES = ['received', 'given_out', 'thrown_out', 'corrected', 'edited'];

// GET: history rows. Filters: ?itemId= &deliveryId= &visitId= &type= &from= &to= &limit= (max 500)
export const GET = handle(async (req) => {
  const { supabase, orgId } = await getContext(req);
  const sp = new URL(req.url).searchParams;
  const limit = Math.min(Number(sp.get('limit')) || 100, 500);

  const rows = await fetchHistory(supabase, (q) => {
    q = q.eq('organization_id', orgId);
    if (sp.get('itemId')) q = q.eq('catalog_item_id', sp.get('itemId'));
    if (sp.get('deliveryId')) q = q.eq('delivery_id', sp.get('deliveryId'));
    if (sp.get('visitId')) q = q.eq('visit_id', sp.get('visitId'));
    if (TYPES.includes(sp.get('type'))) q = q.eq('action_type', sp.get('type'));
    if (sp.get('from')) q = q.gte('created_at', sp.get('from'));
    if (sp.get('to')) q = q.lte('created_at', sp.get('to'));
    return q.order('created_at', { ascending: false }).limit(limit);
  });
  return NextResponse.json({ count: rows.length, data: rows });
});
