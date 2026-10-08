'use client';

// A list the server hands out a page at a time, for lists too big to keep whole on the device:
// Inventory's items (/api/inventory) and Restock's item list (/api/foods/dictionary?limit=).
//   - Pages are cached per query (filter, search…), so going back to a filter is instant.
//   - A new `version` (PantryProvider bumps it on every realtime change) refetches the current
//     query in the background, keeping what's on screen meanwhile and everything already scrolled in.
//   - Typing waits a moment before asking; a new query keeps showing the last list until it lands.
// Pages look like { total, ids, [rowsKey]: [...], summary? }; rows of later pages are merged by id.

import { useCallback, useEffect, useRef, useState } from 'react';

const SEARCH_PAUSE = 250; // ms of no typing before a search goes to the server

/** GETs one page: `path?…query` with the pantry in a header (lib/inventory-query toSearchParams). */
export async function fetchPage(path, pantryId, params, signal) {
  const res = await fetch(`${path}?${params}`, {
    headers: { 'x-pantry-id': pantryId },
    cache: 'no-store',
    signal,
  });
  if (!res.ok) throw new Error(`${path} failed (${res.status})`);
  return res.json();
}

/**
 * @param scope     what the cache is for (the pantry); pages from another scope are never shown
 * @param key       a stable key for the query (lib/inventory-query queryKey)
 * @param query     passed to load(), along with limit, offset and summary
 * @param load      (query, signal) => page
 * @param version   refetch when this changes
 * @param enabled   false: no requests (the list is kept whole on the device instead, or it's closed)
 * @param initial   { scope, key, page, current } drawn by the server; current: false refetches it
 *                  at once (while still showing it)
 */
export function usePagedList({
  scope, key, query, load, version, enabled = true, initial = null,
  rowsKey, rowId = (r) => r.id, first = 24, next = 48,
}) {
  const [firstVersion] = useState(version);
  const cacheKey = `${scope}|${key}`;

  const [pages, setPages] = useState(() =>
    initial ? { [`${initial.scope}|${initial.key}`]: { ...initial.page, version: initial.current === false ? null : firstVersion } } : {}
  );
  const [summaries, setSummaries] = useState(() =>
    initial?.page?.summary ? { [initial.scope]: initial.page.summary } : {}
  );

  // load and query change identity every render; the effects read the latest through a ref.
  const latest = useRef({ load, query });
  useEffect(() => { latest.current = { load, query }; });

  const entry = pages[cacheKey];
  const stale = !entry || entry.version !== version;

  // Fetch (or refresh) the current page when it's missing or out of date.
  useEffect(() => {
    if (!enabled || !scope || !stale) return;
    const ctrl = new AbortController();
    // A refresh keeps everything already scrolled into view.
    const limit = Math.max(first, entry?.ids.length || 0);
    const { load: get, query: q } = latest.current;
    const timer = setTimeout(() => {
      get({ ...q, limit, offset: 0, summary: true }, ctrl.signal)
        .then((page) => {
          setPages((p) => ({ ...p, [cacheKey]: { ...page, version } }));
          if (page.summary) setSummaries((s) => ({ ...s, [scope]: page.summary }));
        })
        .catch((err) => {
          if (err.name === 'AbortError') return;
          console.error('Could not load the list:', err);
          setPages((p) => ({ ...p, [cacheKey]: p[cacheKey] || { total: 0, ids: [], [rowsKey]: [], version, failed: true } }));
        });
    }, q.search && !entry ? SEARCH_PAUSE : 0);
    return () => { clearTimeout(timer); ctrl.abort(); };
    // entry is represented by stale; the query by cacheKey.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, scope, stale, cacheKey, version]);

  // The next page, when the end of the list scrolls near.
  const loadingMore = useRef(false);
  const loadMore = useCallback(() => {
    if (!enabled || !entry || entry.ids.length >= entry.total || loadingMore.current) return;
    loadingMore.current = true;
    const { load: get, query: q } = latest.current;
    get({ ...q, limit: next, offset: entry.ids.length })
      .then((page) => {
        setPages((p) => {
          const cur = p[cacheKey];
          if (!cur) return p;
          const haveIds = new Set(cur.ids);
          const haveRows = new Set(cur[rowsKey].map(rowId));
          return {
            ...p,
            [cacheKey]: {
              ...cur,
              total: page.total,
              ids: [...cur.ids, ...page.ids.filter((id) => !haveIds.has(id))],
              [rowsKey]: [...cur[rowsKey], ...(page[rowsKey] || []).filter((r) => !haveRows.has(rowId(r)))],
            },
          };
        });
      })
      .catch((err) => console.error('Could not load more:', err))
      .finally(() => { loadingMore.current = false; });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, entry, cacheKey]);

  // While a new query is on its way, keep showing the last list instead of blanking.
  const [lastShown, setLastShown] = useState(entry || null);
  if (entry && entry !== lastShown) setLastShown(entry);
  const visible = entry || lastShown;

  // After an edit: refetch now (realtime will confirm it too).
  const refresh = useCallback(() => {
    setPages((p) => (p[cacheKey] ? { ...p, [cacheKey]: { ...p[cacheKey], version: null } } : p));
  }, [cacheKey]);

  return {
    entry: visible, // { total, ids, [rowsKey], summary? } or null before the first page
    pending: !entry, // a new query is loading; entry is the previous list
    hasMore: !!entry && entry.ids.length < entry.total,
    loadMore,
    summary: summaries[scope] || null,
    refresh,
  };
}

