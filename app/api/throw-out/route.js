import { NextResponse } from 'next/server';
import { handle, getContext, rpc, toRemoveLine, THROW_OUT_REASONS, ApiError } from '@/lib/server/inventory-api';

// POST: throw-out cart. Body: { reason: expired | damaged | recalled | other, note?, lines: [{ catalogItemId, batchId?, quantity }] }
export const POST = handle(async (req) => {
  const { supabase, locationId } = await getContext(req);
  const body = await req.json();
  if (!THROW_OUT_REASONS.includes(body.reason)) throw new ApiError(400, 'Pick a reason');
  const cart = body.lines || body.cart || [];
  if (!Array.isArray(cart) || cart.length === 0) throw new ApiError(400, 'Nothing to throw out');

  const lines = [];
  for (const line of cart) lines.push(await toRemoveLine(supabase, line));

  await rpc(supabase, 'throw_out', {
    p_location_id: locationId,
    p_reason: body.reason,
    p_lines: lines,
    p_note: body.note || null,
  });
  return NextResponse.json({ message: 'Thrown out', itemsProcessed: lines.length }, { status: 201 });
});
