import { NextResponse } from 'next/server';
import { handle, getContext, rpc, fetchHistory, toRemoveLine, ApiError } from '@/lib/server/inventory-api';

// GET: recent give-outs (history rows), newest first.
export const GET = handle(async (req) => {
  const { supabase, locationId } = await getContext(req);
  const rows = await fetchHistory(supabase, (q) =>
    q.eq('location_id', locationId).eq('action_type', 'given_out').order('created_at', { ascending: false }).limit(100)
  );

  const data = rows.map((r) => ({
    ...r,
    clientName: null,
    quantityDistributed: Math.abs(r.quantityChanged),
    distributionDate: r.timestamp,
  }));
  return NextResponse.json({ count: data.length, data });
});

// POST: checkout = one visit. Uses the lot the volunteer picked, otherwise soonest-expiring first.
// Body: { visit?: { clientName, weighedLbs, note }, cart | lines: [...] }  (also accepts the current UI's
// { cart: [{ itemId, catalogItemId, quantityDistributed }], clientName })
export const POST = handle(async (req) => {
  const { supabase, locationId } = await getContext(req);
  const body = await req.json();
  const cart = body.lines || body.cart || (body.catalogItemId || body.itemId ? [body] : []);
  if (!Array.isArray(cart) || cart.length === 0) throw new ApiError(400, 'Nothing to give out');

  const lines = [];
  for (const line of cart) {
    const l = await toRemoveLine(supabase, line);
    if (Number(l.quantity) > 0) lines.push(l);
  }

  const v = body.visit || {};
  const clientName = v.clientName ?? body.clientName;
  const result = await rpc(supabase, 'give_out', {
    p_location_id: locationId,
    p_visit: {
      client_name: clientName && !/^(walk-in|tracked client)$/i.test(clientName) ? clientName : null,
      weighed_lbs: Number(v.weighedLbs) > 0 ? Number(v.weighedLbs) : null,
      note: v.note || null,
    },
    p_lines: lines,
  });

  return NextResponse.json(
    { message: 'Distribution successful', itemsProcessed: lines.length, visitId: result?.visit_id },
    { status: 201 }
  );
});
