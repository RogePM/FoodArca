import { NextResponse } from 'next/server';
import { getPlanDetails } from '@/lib/plans';
import {
  handle, getContext, BATCH_SELECT, mapBatch, fetchHistory, SOURCE_LABELS, ApiError,
} from '@/lib/server/inventory-api';

// Blank stays blank: unknown values are empty cells, never a made-up default.
const cell = (v) => {
  if (v === null || v === undefined || v === '') return '';
  if (typeof v === 'number') return String(v);
  return `"${String(v).replace(/"/g, '""')}"`;
};
const toCsv = (headers, rows) => [headers.map(cell).join(','), ...rows.map((r) => r.map(cell).join(','))].join('\n');
const sizeText = (amount, unit) => (amount ? `${amount} ${unit === 'fl_oz' ? 'fl oz' : unit}` : '');

const ACTION_LABELS = { received: 'Received', given_out: 'Given out', thrown_out: 'Thrown out', corrected: 'Corrected', edited: 'Edited' };

// GET ?type=inventory (current stock) | history (every change, for agency reports) &from= &to=
export const GET = handle(async (req) => {
  const { supabase, orgId } = await getContext(req);

  const { data: org } = await supabase.from('organizations').select('plan_type').eq('id', orgId).maybeSingle();
  const plan = getPlanDetails(org?.plan_type || 'free');
  if (!plan.features.csv_export) throw new ApiError(403, 'Upgrade required to export data.');

  const sp = new URL(req.url).searchParams;
  const type = sp.get('type') || 'inventory';
  const today = new Date().toISOString().slice(0, 10);
  let csv;

  if (type === 'inventory') {
    const { data, error } = await supabase
      .from('inventory_batches')
      .select(`${BATCH_SELECT}, location:locations ( name )`)
      .eq('organization_id', orgId)
      .order('expiration_date', { ascending: true, nullsFirst: false });
    if (error) throw error;

    const headers = ['Item', 'Category', 'Tracked by', 'Size on label', 'Amount', 'Unit', 'Estimated lb',
      'Expires', 'Expiry precision', 'Storage', 'Source', 'Location', 'Received', 'Barcode'];
    const rows = (data || []).map((raw) => {
      const l = mapBatch(raw);
      const lb = l.trackBy === 'weight' ? l.quantity : l.weightPerUnit != null ? Math.round(l.quantity * l.weightPerUnit * 100) / 100 : null;
      return [
        l.name, l.category, l.trackBy === 'weight' ? 'Weight' : 'Count', sizeText(l.sizeAmount, l.sizeUnit),
        l.quantity, l.unit, lb,
        l.expirationDate, l.expirationPrecision, l.storageLocation,
        l.sourceType ? SOURCE_LABELS[l.sourceType] : 'Not recorded',
        raw.location?.name, l.receivedDate, l.barcode,
      ];
    });
    csv = toCsv(headers, rows);
  } else if (type === 'history') {
    const rows = await fetchHistory(supabase, (q) => {
      q = q.eq('organization_id', orgId).neq('action_type', 'edited');
      if (sp.get('from')) q = q.gte('created_at', sp.get('from'));
      if (sp.get('to')) q = q.lte('created_at', sp.get('to'));
      return q.order('created_at', { ascending: true }).limit(10000);
    });

    const deliveryIds = [...new Set(rows.map((r) => r.deliveryId).filter(Boolean))];
    const donors = new Map();
    if (deliveryIds.length > 0) {
      const { data: ds } = await supabase.from('deliveries').select('id, donor_name, is_anonymous').in('id', deliveryIds);
      for (const d of ds || []) donors.set(d.id, d.is_anonymous ? 'Anonymous' : d.donor_name || 'Not recorded');
    }

    const headers = ['Date', 'Action', 'Item', 'Category', 'Amount', 'Unit', 'Pounds', 'Source', 'Donor',
      'Reason', 'Expires', 'Storage', 'Drop-off', 'Visit', 'By', 'Undo of'];
    csv = toCsv(headers, rows.map((r) => [
      r.timestamp, ACTION_LABELS[r.rawActionType] || r.rawActionType, r.itemName, r.category,
      r.quantityChanged, r.unit, r.weightChanged,
      r.source ? SOURCE_LABELS[r.source] : 'Not recorded',
      r.deliveryId ? donors.get(r.deliveryId) || 'Not recorded' : '',
      r.reason, r.expirationDate, r.storageLocation, r.deliveryId, r.visitId, r.userName, r.reversesId,
    ]));
  } else {
    throw new ApiError(400, 'Invalid export type. Use inventory or history.');
  }

  return new NextResponse(csv, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="${type}-${today}.csv"`,
    },
  });
});
