import { NextResponse } from 'next/server';
import {
  handle, getContext, rpc, ITEM_SELECT, BATCH_SELECT, mapItem, mapBatch, fetchHistory, resolveCategoryId, ApiError,
} from '@/lib/server/inventory-api';

async function loadItem(supabase, orgId, id) {
  const { data, error } = await supabase
    .from('catalog_items')
    .select(ITEM_SELECT)
    .eq('id', id)
    .eq('organization_id', orgId)
    .maybeSingle();
  if (error) throw error;
  if (!data) throw new ApiError(404, 'Item not found');
  return data;
}

// GET: the item page — item facts, its lots at this location, and recent history.
export const GET = handle(async (req, { params }) => {
  const { supabase, orgId, locationId } = await getContext(req);
  const { id } = await params;
  const item = await loadItem(supabase, orgId, id);

  const { data: lots, error } = await supabase
    .from('inventory_batches')
    .select(BATCH_SELECT)
    .eq('catalog_item_id', id)
    .eq('location_id', locationId)
    .order('expiration_date', { ascending: true, nullsFirst: false });
  if (error) throw error;

  // ?history=0 skips history (the restock sheet only needs the batches)
  const wantHistory = new URL(req.url).searchParams.get('history') !== '0';
  const history = wantHistory
    ? await fetchHistory(supabase, (q) => q.eq('catalog_item_id', id).order('created_at', { ascending: false }).limit(50))
    : [];

  const mappedLots = (lots || []).map(mapBatch);
  return NextResponse.json({
    item: mapItem(item),
    totalQuantity: mappedLots.reduce((sum, l) => sum + l.quantity, 0),
    lots: mappedLots,
    history,
  });
});

// PATCH: edit item facts (staff). Switching Count/Weigh needs `newTotal` when there is stock.
// Body: { name?, categoryId? | category?, sizeAmount?, sizeUnit?, caseSize?, photoUrl?, barcode?, trackBy?, newTotal? }
export const PATCH = handle(async (req, { params }) => {
  const { supabase, orgId } = await getContext(req);
  const { id } = await params;
  const body = await req.json();
  const current = await loadItem(supabase, orgId, id);

  if (body.trackBy && body.trackBy !== current.track_by) {
    await rpc(supabase, 'convert_item', {
      p_item_id: id,
      p_track_by: body.trackBy,
      p_new_total: body.newTotal ?? null,
    });
  }

  const changes = {};
  if (body.name !== undefined) changes.name = body.name;
  if (body.categoryId !== undefined || body.category !== undefined) {
    const categoryId = await resolveCategoryId(supabase, body);
    if (!categoryId) throw new ApiError(400, 'Unknown category');
    changes.category_id = categoryId;
  }
  if (body.sizeAmount !== undefined) changes.size_amount = body.sizeAmount;
  if (body.sizeUnit !== undefined) changes.size_unit = body.sizeUnit;
  if (body.caseSize !== undefined) changes.case_size = body.caseSize;
  if (body.photoUrl !== undefined) changes.photo_url = body.photoUrl;
  if (body.barcode !== undefined) changes.barcode = body.barcode;
  if (Object.keys(changes).length > 0) {
    await rpc(supabase, 'edit_item', { p_item_id: id, p_changes: changes });
  }

  return NextResponse.json({ item: mapItem(await loadItem(supabase, orgId, id)) });
});

// DELETE: archive the item (staff). Remaining stock must leave with a reason.
// Body or query: { why: given_out | thrown_out | corrected, reason? }
export const DELETE = handle(async (req, { params }) => {
  const { supabase } = await getContext(req);
  const { id } = await params;
  const sp = new URL(req.url).searchParams;
  const body = await req.json().catch(() => ({}));
  await rpc(supabase, 'archive_item', {
    p_item_id: id,
    p_why: body.why || sp.get('why') || null,
    p_reason: body.reason || sp.get('reason') || null,
  });
  return NextResponse.json({ message: 'Item removed' });
});
