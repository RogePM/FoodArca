import { NextResponse } from 'next/server';
import {
  handle, getContext, rpc, BATCH_SELECT, mapBatch, toDateOnly, toPrecision, ApiError,
} from '@/lib/server/inventory-api';

// PATCH: change one lot.
//   Update amount / All gone: { quantity, why: given_out | thrown_out | corrected, reason?, note? }
//   Edit lot:                 { expirationDate?, expirationPrecision?, storageLocation? }
export const PATCH = handle(async (req, { params }) => {
  const { supabase, locationId } = await getContext(req);
  const { id } = await params;
  const body = await req.json();
  let batchId = id;

  const hasLotChanges = body.expirationDate !== undefined || body.storageLocation !== undefined;
  if (body.quantity === undefined && !hasLotChanges) throw new ApiError(400, 'Nothing to change');

  if (body.quantity !== undefined) {
    await rpc(supabase, 'update_amount', {
      p_batch_id: id,
      p_new_quantity: Number(body.quantity),
      p_why: body.why || 'corrected',
      p_reason: body.reason || null,
      p_note: body.note || null,
    });
    if (Number(body.quantity) === 0) return NextResponse.json({ data: null });
  }

  if (hasLotChanges) {
    const changes = {};
    if (body.expirationDate !== undefined) {
      const date = toDateOnly(body.expirationDate);
      changes.expiration_date = date;
      changes.expiration_precision = date ? toPrecision(body.expirationPrecision) : null;
    }
    if (body.storageLocation !== undefined) changes.storage_location = body.storageLocation || null;
    const res = await rpc(supabase, 'edit_lot', { p_batch_id: id, p_changes: changes });
    batchId = res?.batch_id || id;
  }

  const { data, error } = await supabase
    .from('inventory_batches')
    .select(BATCH_SELECT)
    .eq('id', batchId)
    .eq('location_id', locationId)
    .maybeSingle();
  if (error) throw error;
  return NextResponse.json({ data: data ? mapBatch(data) : null });
});
