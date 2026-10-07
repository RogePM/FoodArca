import { NextResponse } from 'next/server';
import {
  handle, getContext, rpc, fetchHistory, normalizeSource, SOURCE_LABELS, ApiError,
} from '@/lib/server/inventory-api';

function mapDelivery(d) {
  return {
    id: d.id,
    receivedAt: d.received_at,
    source: d.source,
    sourceLabel: d.source ? SOURCE_LABELS[d.source] : null,
    donorName: d.donor_name,
    isAnonymous: d.is_anonymous,
    weighedLbs: d.weighed_lbs,
    note: d.note,
    userId: d.user_id,
  };
}

async function loadDelivery(supabase, orgId, id) {
  const { data, error } = await supabase
    .from('deliveries')
    .select('*')
    .eq('id', id)
    .eq('organization_id', orgId)
    .maybeSingle();
  if (error) throw error;
  if (!data) throw new ApiError(404, 'Drop-off not found');
  return data;
}

// GET: one drop-off and everything recorded with it.
export const GET = handle(async (req, { params }) => {
  const { supabase, orgId } = await getContext(req);
  const { id } = await params;
  const delivery = await loadDelivery(supabase, orgId, id);
  const history = await fetchHistory(supabase, (q) => q.eq('delivery_id', id).order('created_at', { ascending: true }));
  return NextResponse.json({ delivery: mapDelivery(delivery), history });
});

// PATCH: fill in or fix source / donor / weight after the fact.
// Body: { source?, donorName?, isAnonymous?, weighedLbs?, note? }
export const PATCH = handle(async (req, { params }) => {
  const { supabase, orgId } = await getContext(req);
  const { id } = await params;
  const body = await req.json();
  await loadDelivery(supabase, orgId, id);

  const changes = {};
  if (body.source !== undefined) {
    const source = normalizeSource(body.source);
    if (body.source && !source) throw new ApiError(400, 'Unknown source');
    changes.source = source;
  }
  if (body.donorName !== undefined) changes.donor_name = body.donorName;
  if (body.isAnonymous !== undefined) changes.is_anonymous = !!body.isAnonymous;
  if (body.weighedLbs !== undefined) changes.weighed_lbs = Number(body.weighedLbs) > 0 ? Number(body.weighedLbs) : null;
  if (body.note !== undefined) changes.note = body.note;

  const updated = await rpc(supabase, 'update_delivery', { p_delivery_id: id, p_changes: changes });
  return NextResponse.json({ delivery: mapDelivery(updated) });
});
