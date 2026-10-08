'use client';

// The Inventory screen's data, built to stay fast at any pantry size:
//   1. The server draws the first page (app/dashboard/inventory/page.jsx), so items are in the HTML.
//   2. Up to FULL_SHELF_LIMIT items, the whole shelf (lib/use-inventory: shared, saved, live) takes
//      over once it's current, and every filter, search and sort is instant, on the device.
//   3. Above that, each filter, search and scroll asks /api/inventory for just that page
//      (lib/use-paged-list: cached per query, refetched when inventory changes).
// Both paths follow the same rules (lib/inventory-query, public.inventory_page), so the switch
// from the server's page to the shelf doesn't move anything.

import { useCallback, useMemo, useState } from 'react';
import { usePantry, useServerDataIsCurrent } from '@/components/providers/PantryProvider';
import { useInventory } from '@/lib/use-inventory';
import { usePagedList, fetchPage } from '@/lib/use-paged-list';
import { FIRST_PAGE, NEXT_PAGE, FULL_SHELF_LIMIT, queryKey, toSearchParams } from '@/lib/inventory-query';
import { groupInventoryBatches } from './inventory-utils';

/** One page from /api/inventory: { total, ids, lots, summary }. */
export const fetchInventoryList = (pantryId, query, signal) =>
  fetchPage('/api/inventory', pantryId, toSearchParams(query), signal);

/** Lots in the server's item order (a page's ids). */
export function inPageOrder(page, items) {
  const pos = new Map(page.ids.map((id, i) => [id, i]));
  return items.sort((a, b) => (pos.get(a.catalogItemId) ?? Infinity) - (pos.get(b.catalogItemId) ?? Infinity));
}

/** A page's items, grouped (one card per item), in the server's order. */
export function itemsOf(page) {
  if (!page?.lots?.length) return [];
  return inPageOrder(page, groupInventoryBatches(page.lots));
}

export function useInventoryList(initial, query) {
  const { pantryId, lastInventoryUpdate } = usePantry();
  const seedCurrent = useServerDataIsCurrent(initial?.fetchedAt);

  // The server drew for the location in its cookie; ignore that once we know we're in another one.
  const loc = pantryId || initial?.locationId || null;

  // Small enough to keep whole on the device? Then the shared shelf takes over once it's current.
  // The size comes from the server's summary (the first page always asks for it).
  const [knownSize, setKnownSize] = useState(() => (initial?.summary ? { [initial.locationId]: initial.summary.all } : {}));
  const size = knownSize[loc] ?? null;
  const small = size !== null && size <= FULL_SHELF_LIMIT;
  const shelf = useInventory({ enabled: small });
  // Once the shelf has been current here, it stays in charge: a realtime change patches it and
  // refetches it, and that brief "refreshing" must not flip the screen back to server pages.
  const [shelfFor, setShelfFor] = useState(null);
  if (small && shelf.fresh && shelfFor !== loc) setShelfFor(loc);
  const complete = small && shelfFor === loc;

  const paged = usePagedList({
    scope: loc,
    key: queryKey(query),
    query,
    load: (q, signal) => fetchInventoryList(pantryId, q, signal),
    version: lastInventoryUpdate,
    enabled: !complete && !!pantryId,
    initial: initial && { scope: initial.locationId, key: initial.key, page: initial, current: seedCurrent },
    rowsKey: 'lots',
    first: FIRST_PAGE,
    next: NEXT_PAGE,
  });
  const summary = paged.summary;
  if (summary && knownSize[loc] !== summary.all) setKnownSize((k) => ({ ...k, [loc]: summary.all }));

  const items = useMemo(() => itemsOf(paged.entry), [paged.entry]);

  // After an edit: refetch now (realtime will confirm it too).
  const { refresh: refreshPage } = paged;
  const refresh = useCallback(() => {
    shelf.refresh();
    refreshPage();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshPage]);

  return {
    complete, // true: filter/sort/search the whole shelf locally (shelfLots)
    shelfLots: shelf.lots,
    items, // the server's page (when not complete)
    total: paged.entry?.total ?? 0,
    ready: !!paged.entry,
    pending: paged.pending, // a new query is loading; items are the previous list
    hasMore: !complete && paged.hasMore,
    loadMore: paged.loadMore,
    summary,
    refresh,
  };
}
