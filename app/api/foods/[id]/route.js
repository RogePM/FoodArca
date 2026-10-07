import { NextResponse } from 'next/server';
import {
  handle, getContext, rpc, BATCH_SELECT, mapBatch, resolveCategoryId, toDateOnly, toPrecision, ApiError, round3,
} from '@/lib/server/inventory-api';

async function loadBatch(supabase, locationId, id) {
  const { data, error } = await supabase
    .from('inventory_batches')
    .select(BATCH_SELECT)
    .eq('id', id)
    .eq('location_id', locationId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

// GET: one lot.
export const GET = handle(async (req, { params }) => {
  const { supabase, locationId } = await getContext(req);
  const { id } = await params;
  const batch = await loadBatch(supabase, locationId, id);
  if (!batch) throw new ApiError(404, 'Item not found');
  return NextResponse.json(mapBatch(batch));
});

// PUT: edit a lot from the current Edit screens.
// Amount → update_amount (with why), expiry/storage → edit_lot, item facts → edit_item.
// Body: { quantity?, why?, reason?, note?, expirationDate?, expirationPrecision?, storageLocation?,
//         name?, category?, categoryId?, photoUrl?, sizeAmount?, sizeUnit?, caseSize? }
export const PUT = handle(async (req, { params }) => {
  const { supabase, locationId } = await getContext(req);
  const { id } = await params;
  const data = await req.json();

  const batch = await loadBatch(supabase, locationId, id);
  if (!batch) throw new ApiError(404, 'Item not found');
  const item = batch.catalog_item;

  // 1. Item facts (only what actually changed, so volunteers can still edit amounts)
  const itemChanges = {};
  if (data.name && data.name.trim() !== item.name) itemChanges.name = data.name.trim();
  if (data.photoUrl !== undefined && (data.photoUrl || null) !== (item.photo_url || null)) itemChanges.photo_url = data.photoUrl || null;
  if (data.categoryId !== undefined || data.category !== undefined) {
    const categoryId = await resolveCategoryId(supabase, data);
    if (categoryId && categoryId !== item.category?.id) itemChanges.category_id = categoryId;
  }
  if (data.sizeAmount !== undefined || data.sizeUnit !== undefined) {
    itemChanges.size_amount = data.sizeAmount ?? null;
    itemChanges.size_unit = data.sizeUnit ?? null;
  }
  if (data.caseSize !== undefined) itemChanges.case_size = data.caseSize ?? null;
  if (Object.keys(itemChanges).length > 0) {
    await rpc(supabase, 'edit_item', { p_item_id: item.id, p_changes: itemChanges });
  }

  // 2. Amount
  let batchId = batch.id;
  let lotGone = false;
  if (data.quantity !== undefined && round3(data.quantity) !== round3(batch.quantity)) {
    await rpc(supabase, 'update_amount', {
      p_batch_id: batch.id,
      p_new_quantity: round3(data.quantity),
      p_why: data.why || 'corrected',
      p_reason: data.reason || null,
      p_note: data.note || null,
    });
    lotGone = round3(data.quantity) === 0;
  }

  // 3. Expiry / storage
  if (!lotGone) {
    const lotChanges = {};
    if (data.expirationDate !== undefined) {
      const date = toDateOnly(data.expirationDate);
      lotChanges.expiration_date = date;
      lotChanges.expiration_precision = date ? toPrecision(data.expirationPrecision || batch.expiration_precision) : null;
    }
    if (data.storageLocation !== undefined) lotChanges.storage_location = data.storageLocation || null;
    if (Object.keys(lotChanges).length > 0) {
      const res = await rpc(supabase, 'edit_lot', { p_batch_id: batch.id, p_changes: lotChanges });
      batchId = res?.batch_id || batchId;
    }
  }

  const updated = lotGone ? null : await loadBatch(supabase, locationId, batchId);
  return NextResponse.json({ message: 'Item updated successfully', data: updated ? mapBatch(updated) : null });
});

// DELETE: take a lot out of stock. Always recorded in history.
// Body or query: { why: given_out | thrown_out | corrected (default), reason?, note? }
export const DELETE = handle(async (req, { params }) => {
  const { supabase, locationId } = await getContext(req);
  const { id } = await params;
  const { searchParams } = new URL(req.url);
  const body = await req.json().catch(() => ({}));

  const batch = await loadBatch(supabase, locationId, id);
  if (!batch) throw new ApiError(404, 'Item not found');

  await rpc(supabase, 'update_amount', {
    p_batch_id: batch.id,
    p_new_quantity: 0,
    p_why: body.why || searchParams.get('why') || 'corrected',
    p_reason: body.reason || searchParams.get('reason') || null,
    p_note: body.note || 'Removed from inventory',
  });
  return NextResponse.json({ message: 'Removed from inventory' });
});
