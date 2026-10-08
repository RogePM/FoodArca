// The Inventory screen's query (filter pill, search, one pinned item, sort), shared by the server
// page, the /api/inventory route and the browser, so they always ask the same question.
// The database side is public.inventory_page (supabase/migrations/20261008130000_inventory_page.sql).
// Restock's item list asks the same way (/api/foods/dictionary?limit=, public.catalog_page).

import { categories } from '@/lib/constants';

export const STATUS_FILTERS = ['EXPIRING', 'EXPIRED', 'LOW', 'NO_DATE'];
export const FIRST_PAGE = 24; // what the server draws
export const NEXT_PAGE = 48; // each scroll-in after that
// Up to this many items, the whole shelf is kept on the device (lib/use-inventory) and filtered there,
// instantly. Above it, each filter, search and scroll asks the server for just that page.
export const FULL_SHELF_LIMIT = 400;

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Legacy spellings still found in links.
// (and the item sheets' pill ids: expiring_soon, low_stock, out_of_stock…).
const STATUS_ALIASES = { LOW_STOCK: 'LOW', EXPIRING_SOON: 'EXPIRING', NODATE: 'NO_DATE', OUT_OF_STOCK: 'OUT' };

export function normalizeFilter(filter) {
  const f = String(filter || 'ALL');
  const up = f.toUpperCase();
  if (up === 'ALL') return 'ALL';
  if (STATUS_FILTERS.includes(up)) return up;
  if (STATUS_ALIASES[up]) return STATUS_ALIASES[up];
  return f; // a category value
}

/** Does an item's category (its name) belong to a category pill? Same rule everywhere. */
export function matchesCategoryFilter(productCategory, selectedCategoryValue) {
  if (!selectedCategoryValue || selectedCategoryValue === 'ALL' || selectedCategoryValue === 'all') return true;
  const prodCat = String(productCategory || 'other').toLowerCase();
  const selected = String(selectedCategoryValue).toLowerCase();
  const catName = categories.find((c) => c.value === selected)?.name.toLowerCase();
  return (
    prodCat === selected ||
    (catName && prodCat === catName) ||
    prodCat.replace(/[\s&_-]/g, '') === selected.replace(/[\s&_-]/g, '')
  );
}

/** A stable key for a query (caches and "is this the same list?" checks). */
export function queryKey({ filter = 'ALL', search = '', itemId = null, sort = 'expirationDate', desc = false } = {}) {
  return JSON.stringify([normalizeFilter(filter), String(search || '').trim().toLowerCase(), itemId || null, sort, !!desc]);
}

/** The arguments for public.inventory_page. */
export function toRpcArgs(locationId, { filter = 'ALL', search = '', itemId = null, sort = 'expirationDate', desc = false, limit = FIRST_PAGE, offset = 0, summary = false } = {}) {
  const f = normalizeFilter(filter);
  const isStatus = STATUS_FILTERS.includes(f);
  const cat = f !== 'ALL' && !isStatus ? categories.find((c) => c.value === String(f).toLowerCase()) : null;
  return {
    p_location_id: locationId,
    p_search: String(search || '').trim() || null,
    p_status: isStatus ? f : null,
    p_category: f !== 'ALL' && !isStatus ? String(f) : null,
    p_category_name: cat?.name || null,
    p_item_id: itemId && UUID.test(String(itemId)) ? String(itemId) : null,
    p_sort: ['name', 'quantity', 'totalQuantity'].includes(sort) ? (sort === 'totalQuantity' ? 'quantity' : sort) : 'expirationDate',
    p_desc: !!desc,
    p_limit: Math.max(0, Math.min(Number(limit) || 0, 500)),
    p_offset: Math.max(0, Number(offset) || 0),
    p_summary: !!summary,
  };
}

/** The arguments for public.catalog_page (Restock's item list): filters LOW, OUT or a category. */
export function toCatalogRpcArgs(locationId, { filter = 'ALL', search = '', limit = FIRST_PAGE, offset = 0, summary = false } = {}) {
  const f = normalizeFilter(filter);
  const isStatus = f === 'LOW' || f === 'OUT';
  const cat = f !== 'ALL' && !isStatus ? categories.find((c) => c.value === String(f).toLowerCase()) : null;
  return {
    p_location_id: locationId,
    p_search: String(search || '').trim() || null,
    p_status: isStatus ? f : null,
    p_category: f !== 'ALL' && !isStatus && !STATUS_FILTERS.includes(f) ? String(f) : null,
    p_category_name: cat?.name || null,
    p_limit: Math.max(0, Math.min(Number(limit) || 0, 500)),
    p_offset: Math.max(0, Number(offset) || 0),
    p_summary: !!summary,
  };
}

/** The same query as URL parameters for /api/inventory (and /api/foods/dictionary's pages). */
export function toSearchParams(q = {}) {
  const p = new URLSearchParams();
  const f = normalizeFilter(q.filter);
  if (f !== 'ALL') p.set('filter', f);
  if (q.search) p.set('q', q.search);
  if (q.itemId) p.set('item', q.itemId);
  if (q.sort && q.sort !== 'expirationDate') p.set('sort', q.sort);
  if (q.desc) p.set('desc', '1');
  p.set('limit', String(q.limit ?? FIRST_PAGE));
  if (q.offset) p.set('offset', String(q.offset));
  if (q.summary) p.set('summary', '1');
  return p;
}

export function fromSearchParams(sp) {
  const get = (k) => (typeof sp?.get === 'function' ? sp.get(k) : sp?.[k]) || null;
  return {
    filter: get('filter') || 'ALL',
    search: get('q') || '',
    itemId: get('item') || get('itemId') || null,
    sort: get('sort') || 'expirationDate',
    desc: get('desc') === '1',
    limit: get('limit') != null ? Number(get('limit')) : FIRST_PAGE,
    offset: Number(get('offset')) || 0,
    summary: get('summary') === '1',
  };
}

/**
 * The filter pills from counts: { all, expired, expiring, low, noDate, categoryCount(value) }.
 * Empty status pills are hidden ("All" always stays); the active pill is kept even at 0 so a filter
 * picked from the URL, or one whose last item was just removed, doesn't vanish.
 */
export function buildPills(counts, activeFilter) {
  const list = [
    { id: 'ALL', name: 'All', count: counts.all, isCategory: false },
    { id: 'EXPIRING', name: 'Expiring Soon', count: counts.expiring, isCategory: false },
    { id: 'EXPIRED', name: 'Expired', count: counts.expired, isCategory: false },
    { id: 'LOW', name: 'Low Stock', count: counts.low, isCategory: false },
    { id: 'NO_DATE', name: 'No Date', count: counts.noDate, isCategory: false },
  ].filter((pill) => pill.id === 'ALL' || pill.count > 0 || pill.id === activeFilter);

  for (const cat of categories) {
    const count = counts.categoryCount(cat.value);
    if (count > 0 || cat.value === activeFilter) list.push({ id: cat.value, name: cat.name, count, isCategory: true });
  }
  return list;
}

/** Counts from the server's summary (public.inventory_page with p_summary). */
export function countsFromSummary(summary) {
  const byName = Object.entries(summary?.categories || {});
  return {
    all: summary?.all || 0,
    expired: summary?.expired || 0,
    expiring: summary?.expiring || 0,
    low: summary?.low || 0,
    noDate: summary?.noDate || 0,
    categoryCount: (value) => byName.reduce((n, [name, c]) => n + (matchesCategoryFilter(name, value) ? c : 0), 0),
  };
}
