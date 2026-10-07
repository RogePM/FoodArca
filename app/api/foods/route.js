import { NextResponse } from 'next/server';
import {
  handle, getContext, rpc, BATCH_SELECT, mapBatch, fetchBatches, toReceiveLine, toDeliveryPayload, ApiError,
} from '@/lib/server/inventory-api';

// GET: stock on the shelf at this location (one row per lot).
export const GET = handle(async (req) => {
  const { supabase, locationId } = await getContext(req);

  const { searchParams } = new URL(req.url);
  const sortBy = searchParams.get('sort') || 'expiration_date';
  const valid = ['expiration_date', 'quantity', 'received_date', 'created_at'];
  const sortColumn = valid.includes(sortBy) ? sortBy : 'expiration_date';
  const ascending = searchParams.get('order') !== 'desc';

  const { data, error } = await supabase
    .from('inventory_batches')
    .select(BATCH_SELECT)
    .eq('location_id', locationId)
    .order(sortColumn, { ascending, nullsFirst: false });
  if (error) throw error;

  const rows = (data || []).map(mapBatch);
  return NextResponse.json({ count: rows.length, data: rows });
});

// POST: receive a single item (a one-line drop-off). Prefer /api/foods/bulk for carts.
export const POST = handle(async (req) => {
  const { supabase, locationId, orgId } = await getContext(req);
  const body = await req.json();
  if (!body.name && !body.catalogItemId && !body.item_id && !body.item) {
    throw new ApiError(400, 'Item name is required');
  }

  const line = await toReceiveLine(supabase, orgId, body);
  const result = await rpc(supabase, 'receive_delivery', {
    p_location_id: locationId,
    p_delivery: toDeliveryPayload(body.delivery || {}),
    p_lines: [line],
  });

  const [batch] = await fetchBatches(supabase, [result?.lines?.[0]?.batch_id]);
  return NextResponse.json({ ...batch, deliveryId: result?.delivery_id }, { status: 201 });
});
