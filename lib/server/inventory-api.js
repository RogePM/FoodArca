// Shared helpers for the inventory API routes (see INVENTORY_PLAN.md).
// All stock changes go through the Postgres functions (receive_delivery, give_out, ...);
// these helpers only authenticate, translate payloads, and shape responses.
import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { SOURCE_LABELS, UI_TO_DB, categorySlug } from '@/lib/inventory-format';

export { SOURCE_LABELS, categorySlug };
export const SOURCES = Object.keys(SOURCE_LABELS);
export const THROW_OUT_REASONS = ['expired', 'damaged', 'recalled', 'other'];

export class ApiError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

// ---------------------------------------------------------------------------
// Request context
// ---------------------------------------------------------------------------

async function resolveLocation(supabase, pantryId) {
  const { data: loc } = await supabase
    .from('locations')
    .select('id, organization_id, timezone')
    .eq('id', pantryId)
    .maybeSingle();
  if (loc) return { locationId: loc.id, orgId: loc.organization_id, timezone: loc.timezone || null };

  // pantryId may be an organization id; fall back to its first location.
  const { data: firstLoc } = await supabase
    .from('locations')
    .select('id, organization_id, timezone')
    .eq('organization_id', pantryId)
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle();
  if (firstLoc) return { locationId: firstLoc.id, orgId: firstLoc.organization_id, timezone: firstLoc.timezone || null };
  return null;
}

// A Supabase client acting as the signed-in user (their session cookies), so RLS applies.
export async function createSupabase() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    { cookies: { getAll() { return cookieStore.getAll(); } } }
  );
}

// Authenticated user + active membership in the pantry named by x-pantry-id.
export async function getContext(req) {
  const supabase = await createSupabase();

  // getClaims checks the session token's signature and expiry. With asymmetric JWT signing keys it
  // does that locally (no round trip to Supabase Auth); with the legacy shared secret it asks Auth,
  // as getUser did. Every query below still runs under the user's token and RLS.
  const { data: auth, error } = await supabase.auth.getClaims();
  const claims = auth?.claims;
  if (error || !claims?.sub) throw new ApiError(401, 'Unauthorized');
  const user = { id: claims.sub, email: claims.email || null };

  const pantryId = req.headers.get('x-pantry-id');
  if (!pantryId) throw new ApiError(400, 'Pantry ID required');

  // The location and the user's memberships don't depend on each other: ask for both at once.
  const [loc, { data: memberships }] = await Promise.all([
    resolveLocation(supabase, pantryId),
    supabase.from('user_organizations').select('organization_id, role').eq('user_id', user.id).eq('status', 'active'),
  ]);
  if (!loc) throw new ApiError(404, 'Location not found');

  const membership = (memberships || []).find((m) => m.organization_id === loc.orgId);
  if (!membership) throw new ApiError(403, 'Access Denied: Not a member');

  return { supabase, user, locationId: loc.locationId, orgId: loc.orgId, timezone: loc.timezone, role: membership.role };
}

// Wraps a route handler so thrown ApiErrors / database errors become JSON responses.
export function handle(fn) {
  return async (req, ctx) => {
    try {
      return await fn(req, ctx);
    } catch (err) {
      return errorResponse(err);
    }
  };
}

export function errorResponse(err) {
  if (err instanceof ApiError) {
    return NextResponse.json({ message: err.message }, { status: err.status });
  }
  // Messages raised by our Postgres functions are written for volunteers.
  if (err?.code === 'P0001') {
    const msg = err.message || 'Something went wrong';
    const status = /access denied|only staff/i.test(msg) ? 403
      : /not found|no longer exists/i.test(msg) ? 404
      : 400;
    return NextResponse.json({ message: msg }, { status });
  }
  if (err?.code === '23505') {
    return NextResponse.json({ message: 'That barcode is already used by another item' }, { status: 409 });
  }
  if (err?.code === '23514' || err?.code === '22P02') {
    return NextResponse.json({ message: 'Some of the values are not valid' }, { status: 400 });
  }
  console.error('API error:', err);
  return NextResponse.json({ message: 'Server Error' }, { status: 500 });
}

export async function rpc(supabase, fn, args) {
  const { data, error } = await supabase.rpc(fn, args);
  if (error) throw error;
  return data;
}

// ---------------------------------------------------------------------------
// Values
// ---------------------------------------------------------------------------

export const round3 = (n) => Math.round((Number(n) + Number.EPSILON) * 1000) / 1000;
export const unitFor = (trackBy) => (trackBy === 'weight' ? 'lb' : 'items');

export function toDateOnly(value) {
  if (!value) return null;
  const s = String(value);
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10);
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? null : d.toISOString().slice(0, 10);
}

export function toPrecision(value) {
  return String(value || '').toLowerCase() === 'month' ? 'month' : 'day';
}

export function normalizeSource(value) {
  const s = String(value || '').trim().toLowerCase().replace(/[\s/-]+/g, '_');
  const aliases = { usda: 'usda_tefap', tefap: 'usda_tefap', usda_commodity: 'usda_tefap', retail_rescue: 'food_rescue', rescue: 'food_rescue', foodbank: 'food_bank' };
  const v = aliases[s] || s;
  return SOURCES.includes(v) ? v : null;
}

// Random codes the old UI generates for items without a barcode are not real barcodes.
export function realBarcode(value) {
  const s = String(value || '').trim();
  if (!s || /^(INT|SYS)-/i.test(s)) return null;
  return s;
}

// ---------------------------------------------------------------------------
// Categories (UI slugs in lib/constants.js differ from DB names; maps live in lib/inventory-format.js)
// ---------------------------------------------------------------------------

// Accepts a category id, a DB name, or a UI slug. Returns null when nothing matches.
export async function resolveCategoryId(supabase, { categoryId, category, categoryName } = {}) {
  if (categoryId != null && categoryId !== '' && !Number.isNaN(Number(categoryId))) return Number(categoryId);
  const candidates = [category, categoryName].filter(Boolean).map(String);
  if (candidates.length === 0) return null;

  const { data: cats } = await supabase.from('categories').select('id, name');
  const norm = (s) => String(s || '').toLowerCase().replace(/[^a-z0-9]+/g, '');
  for (const cand of candidates) {
    const direct = (cats || []).find((c) => norm(c.name) === norm(cand));
    if (direct) return direct.id;
    const mapped = UI_TO_DB[cand.toLowerCase()];
    const viaSlug = mapped && (cats || []).find((c) => c.name === mapped);
    if (viaSlug) return viaSlug.id;
  }
  return null;
}

// ---------------------------------------------------------------------------
// Response shapes
// ---------------------------------------------------------------------------

export const ITEM_SELECT =
  'id, name, barcode, photo_url, track_by, size_amount, size_unit, weight_lbs, case_size, archived_at, created_at, category:categories ( id, name, is_food )';

export const BATCH_SELECT =
  `id, quantity, expiration_date, expiration_precision, storage_location, source, received_date, created_at, location_id, catalog_item:catalog_items ( ${ITEM_SELECT} )`;

export function mapItem(item) {
  if (!item) return {};
  const cat = item.category || {};
  return {
    catalogItemId: item.id,
    name: item.name,
    barcode: item.barcode || null,
    photoUrl: item.photo_url || null,
    category: cat.name || null,
    categoryId: cat.id ?? null,
    categorySlug: categorySlug(cat.name),
    isFood: cat.is_food ?? true,
    trackBy: item.track_by,
    unit: unitFor(item.track_by),
    sizeAmount: item.size_amount ?? null,
    sizeUnit: item.size_unit ?? null,
    weightPerUnit: item.weight_lbs ?? null, // lb per counted item; null = unknown
    caseSize: item.case_size ?? null,
    archived: !!item.archived_at,
  };
}

/**
 * One page of the Inventory screen: public.inventory_page picks and orders the items, then their lots
 * come back in the usual shape (mapBatch), ready for groupInventoryBatches.
 * Returns { locationId, total, ids, lots, summary } or null when the location isn't the user's.
 */
/**
 * The items most recently received (each once, newest first) with their photos: the Add page's
 * "Recently added" (its server-drawn first screen and /api/foods/changes/recent?added=N).
 */
export async function fetchRecentlyAdded(supabase, orgId, count = 8) {
  const n = Math.min(Math.max(Number(count) || 0, 1), 20);
  const { data: logs, error } = await supabase
    .from('activity_logs')
    .select('catalog_item_id, snapshot_item_name, snapshot_category, created_at')
    .eq('organization_id', orgId)
    .eq('action_type', 'received')
    .is('reverses_id', null)
    .not('catalog_item_id', 'is', null)
    .order('created_at', { ascending: false })
    .limit(n * 6); // repeats of the same item are skipped below
  if (error) throw error;

  const seen = new Set();
  const rows = [];
  for (const log of logs || []) {
    if (!log.snapshot_item_name || seen.has(log.catalog_item_id)) continue;
    seen.add(log.catalog_item_id);
    rows.push(log);
    if (rows.length >= n) break;
  }

  const { data: items } = rows.length
    ? await supabase.from('catalog_items').select('id, photo_url').in('id', rows.map((r) => r.catalog_item_id))
    : { data: [] };
  const photos = new Map((items || []).map((i) => [i.id, i.photo_url]));

  return rows.map((r) => ({
    itemId: r.catalog_item_id,
    itemName: r.snapshot_item_name,
    category: r.snapshot_category || null,
    timestamp: r.created_at,
    photoUrl: photos.get(r.catalog_item_id) || null,
  }));
}

export async function fetchInventoryPage(supabase, locationId, rpcArgs) {
  const { data: page, error } = await supabase.rpc('inventory_page', rpcArgs);
  if (error) throw error;
  if (!page) return null;
  const ids = page.ids || [];
  let lots = [];
  if (ids.length) {
    const { data, error: lotsError } = await supabase
      .from('inventory_batches')
      .select(BATCH_SELECT)
      .eq('location_id', locationId)
      .in('catalog_item_id', ids)
      .order('expiration_date', { ascending: true, nullsFirst: false });
    if (lotsError) throw lotsError;
    lots = (data || []).map(mapBatch);
  }
  return { locationId, total: page.total || 0, ids, lots, summary: page.summary || null };
}

/** One item as the item list (/api/foods/dictionary) hands it out. */
export function toDictionaryItem(row) {
  const item = mapItem(row);
  return {
    ...item,
    id: item.barcode || item.catalogItemId, // legacy key used by the current UI
    category: item.categorySlug || 'other', // legacy: UI slug
    categoryName: item.category,
  };
}

/**
 * One page of the pantry's item list with each item's stock here (public.catalog_page), for Restock
 * in a pantry too large to keep the whole list on the device. → { total, ids, items, summary } or null.
 */
export async function fetchCatalogPage(supabase, rpcArgs) {
  const { data: page, error } = await supabase.rpc('catalog_page', rpcArgs);
  if (error) throw error;
  if (!page) return null;
  const ids = page.ids || [];
  let items = [];
  if (ids.length) {
    const { data, error: itemsError } = await supabase.from('catalog_items').select(ITEM_SELECT).in('id', ids);
    if (itemsError) throw itemsError;
    const byId = new Map((data || []).map((row) => [row.id, row]));
    items = ids
      .filter((id) => byId.has(id))
      .map((id) => ({ ...toDictionaryItem(byId.get(id)), totalQuantity: round3(Number(page.stock?.[id]) || 0) }));
  }
  return { total: page.total || 0, ids, items, summary: page.summary || null };
}

export function mapBatch(batch) {
  return {
    ...mapItem(batch.catalog_item),
    _id: batch.id,
    id: batch.id,
    batchId: batch.id,
    locationId: batch.location_id,
    quantity: round3(batch.quantity),
    expirationDate: batch.expiration_date || null,
    expirationPrecision: batch.expiration_precision || null,
    storageLocation: batch.storage_location || null,
    sourceType: batch.source || null,
    receivedDate: batch.received_date || null,
  };
}

// Legacy action names the current Recent Changes screen understands.
const LEGACY_ACTION = { received: 'added', given_out: 'distributed', thrown_out: 'deleted', corrected: 'updated', edited: 'updated' };

export function mapHistory(log) {
  return {
    _id: log.id,
    id: log.id,
    action: LEGACY_ACTION[log.action_type] || log.action_type,
    actionType: LEGACY_ACTION[log.action_type] || log.action_type,
    rawActionType: log.action_type,
    timestamp: log.created_at,
    itemId: log.catalog_item_id,
    itemName: log.snapshot_item_name || null,
    category: log.snapshot_category || null,
    quantityChanged: log.quantity_changed != null ? round3(log.quantity_changed) : 0,
    unit: log.unit || null,
    weightChanged: log.weight_lbs_changed != null ? round3(log.weight_lbs_changed) : null,
    reason: log.reason || null,
    source: log.snapshot_source || null,
    expirationDate: log.snapshot_expiration_date || null,
    expirationPrecision: log.snapshot_expiration_precision || null,
    storageLocation: log.snapshot_storage_location || null,
    batchId: log.batch_id || null,
    deliveryId: log.delivery_id || null,
    visitId: log.visit_id || null,
    userId: log.user_id || null,
    userName: log.user_name || null,
    details: log.details || null,
    reversesId: log.reverses_id || null,
    note: log.note || null,
  };
}

// activity_logs.user_id points at auth.users, so names are looked up separately.
export async function fetchHistory(supabase, buildQuery) {
  const { data, error } = await buildQuery(supabase.from('activity_logs').select('*'));
  if (error) throw error;
  const logs = data || [];
  const userIds = [...new Set(logs.map((l) => l.user_id).filter(Boolean))];
  if (userIds.length > 0) {
    const { data: users } = await supabase.from('app_users').select('id, full_name').in('id', userIds);
    const names = new Map((users || []).map((u) => [u.id, u.full_name]));
    for (const l of logs) l.user_name = names.get(l.user_id) || null;
  }
  return logs.map(mapHistory);
}

// ---------------------------------------------------------------------------
// Receive lines: accept the new shape, or translate the current UI's cart items
// ---------------------------------------------------------------------------

const TO_LB = {
  lb: 1, lbs: 1, pound: 1, pounds: 1,
  oz: 1 / 16, ounce: 1 / 16, ounces: 1 / 16,
  kg: 2.20462, g: 1 / 453.592,
  fl_oz: 0.0652, 'fl oz': 0.0652, gal: 8.34, gallon: 8.34, ml: 0.0022, l: 2.2046,
};

async function findItemByName(supabase, orgId, name) {
  if (!name) return null;
  const { data } = await supabase
    .from('catalog_items')
    .select('id')
    .eq('organization_id', orgId)
    .is('archived_at', null)
    .ilike('name', String(name).trim().replace(/[%_\\]/g, (c) => `\\${c}`))
    .limit(1)
    .maybeSingle();
  return data?.id || null;
}

// One cart line → { item_id | item, quantity, expiration_date, expiration_precision, storage_location }
export async function toReceiveLine(supabase, orgId, src) {
  // New shape (already snake_case) passes straight through.
  if (src.item_id || src.item) return src;

  const trackBy = src.trackBy
    || (src.intakeMode === 'weight' || src.intakeMode === 'bulk' ? 'weight' : 'count');

  let quantity = Number(src.quantity);
  if (trackBy === 'weight') {
    if (Number(src.totalWeightLbs) > 0) quantity = Number(src.totalWeightLbs);
    else {
      const f = TO_LB[String(src.unit || '').toLowerCase()];
      if (f) quantity = quantity * f;
    }
    quantity = round3(quantity);
  }

  const expiry = toDateOnly(src.expirationDate || src.expiration);
  const line = {
    quantity,
    expiration_date: expiry,
    expiration_precision: expiry ? toPrecision(src.expirationPrecision) : null,
    storage_location: src.storageLocation || null,
    note: src.note || null,
  };

  let itemId = src.catalogItemId || null;
  if (!itemId && src.existingBatchId) {
    const { data: b } = await supabase
      .from('inventory_batches')
      .select('catalog_item_id')
      .eq('id', src.existingBatchId)
      .maybeSingle();
    itemId = b?.catalog_item_id || null;
  }
  const barcode = realBarcode(src.barcode);
  if (!itemId && !barcode) itemId = await findItemByName(supabase, orgId, src.name);

  if (itemId) {
    line.item_id = itemId;
    return line;
  }

  let sizeAmount = src.sizeAmount ?? src.sizeValue ?? null;
  let sizeUnit = src.sizeUnit ?? null;
  if (!(Number(sizeAmount) > 0) && Number(src.weightPerUnit) > 0 && trackBy === 'count') {
    sizeAmount = Math.round(Number(src.weightPerUnit) * 100) / 100;
    sizeUnit = 'lb';
  }
  const caseSize = Number(src.caseSize ?? src.packSize);

  line.item = {
    name: src.name,
    category_id: await resolveCategoryId(supabase, src),
    track_by: trackBy,
    size_amount: Number(sizeAmount) > 0 ? Number(sizeAmount) : null,
    size_unit: Number(sizeAmount) > 0 ? sizeUnit : null,
    case_size: trackBy === 'count' && caseSize > 1 ? caseSize : null,
    barcode,
    photo_url: src.photoUrl || null,
  };
  return line;
}

export function toDeliveryPayload(d = {}) {
  return {
    source: normalizeSource(d.source),
    donor_name: d.donorName ?? d.donor_name ?? null,
    is_anonymous: !!(d.isAnonymous ?? d.is_anonymous),
    weighed_lbs: Number(d.weighedLbs ?? d.weighed_lbs) > 0 ? Number(d.weighedLbs ?? d.weighed_lbs) : null,
    note: d.note || null,
  };
}

export async function fetchBatches(supabase, ids) {
  const unique = [...new Set((ids || []).filter(Boolean))];
  if (unique.length === 0) return [];
  const { data, error } = await supabase.from('inventory_batches').select(BATCH_SELECT).in('id', unique);
  if (error) throw error;
  return (data || []).map(mapBatch);
}

// Give-out / throw-out cart line → { item_id, quantity, batch_id? }
export async function toRemoveLine(supabase, src) {
  if (src.item_id) return src;
  const quantity = Number(src.quantity ?? src.quantityDistributed);
  let batchId = src.batchId || null;
  let itemId = src.catalogItemId || null;
  const maybeBatch = batchId || src.itemId || src.id || src._id;

  if (maybeBatch) {
    const { data: b } = await supabase
      .from('inventory_batches')
      .select('id, catalog_item_id')
      .eq('id', maybeBatch)
      .maybeSingle();
    if (b) {
      batchId = b.id;
      itemId = itemId || b.catalog_item_id;
    } else if (!itemId && !src.batchId) {
      itemId = maybeBatch; // the old UI sometimes sends the item id here
    }
  }
  if (!itemId) throw new ApiError(400, `Could not find ${src.itemName || src.name || 'an item'} in inventory`);
  return { item_id: itemId, quantity, batch_id: batchId };
}
