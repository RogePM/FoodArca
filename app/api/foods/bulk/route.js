import { NextResponse } from 'next/server';
import {
  handle, getContext, rpc, fetchBatches, toReceiveLine, toDeliveryPayload, ApiError,
} from '@/lib/server/inventory-api';

// POST: submit the add cart as one drop-off.
// Body: { delivery?: { source, donorName, isAnonymous, weighedLbs, note }, items: [...] }
// `items` may be the current UI's cart lines or new-shape lines ({ item_id | item, quantity, ... }).
export const POST = handle(async (req) => {
  const { supabase, locationId, orgId } = await getContext(req);
  const body = await req.json();
  const items = body.lines || body.items || body.cart || [];
  const delivery = toDeliveryPayload(body.delivery || {});

  if (!Array.isArray(items)) throw new ApiError(400, 'Items must be a list');
  if (items.length === 0 && !delivery.weighed_lbs) {
    throw new ApiError(400, 'Add at least one item or a total weight');
  }

  const lines = [];
  for (const item of items) lines.push(await toReceiveLine(supabase, orgId, item));

  const result = await rpc(supabase, 'receive_delivery', {
    p_location_id: locationId,
    p_delivery: delivery,
    p_lines: lines,
  });

  const data = await fetchBatches(supabase, (result?.lines || []).map((l) => l.batch_id));
  return NextResponse.json({
    success: true,
    message: `Successfully added ${lines.length} ${lines.length === 1 ? 'item' : 'items'}.`,
    count: lines.length,
    deliveryId: result?.delivery_id,
    data,
  });
});
