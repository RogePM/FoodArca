'use client';

// The pantry's shared data, one copy per pantry for the whole app:
//   shelf: the /api/foods lots (stock on the shelf)
//   items: the /api/foods/dictionary item list (for search, restock and name autocomplete)
// Every screen and sheet reads these instead of fetching its own, so an item's batches are already
// in memory when its sheet opens.
//
// Fresh by design (the team works at the same time):
//   - The last copy is kept on the device and shown instantly on open, never trusted: it's
//     refetched as soon as a screen asks for it (its version is unknown after a reload).
//   - PantryProvider bumps lastInventoryUpdate / lastCatalogUpdate on every realtime change, on
//     wake-up and on reconnect; a newer version refetches in the background while the current copy
//     stays on screen (stale-while-revalidate). Two screens asking at once share one request.
//   - Realtime changes are also drawn straight from the event (applyLotChange / applyItemChange).

import { useEffect, useSyncExternalStore } from 'react';
import { usePantry } from '@/components/providers/PantryProvider';

const SAVE_KEYS = { shelf: 'foodarca_shelf_v1', items: 'foodarca_items_v1' };
const stores = new Map(); // `${kind}:${pantryId}` -> store

function readSaved(kind, pantryId) {
  try {
    const raw = localStorage.getItem(`${SAVE_KEYS[kind]}:${pantryId}`);
    const data = raw ? JSON.parse(raw) : null;
    return Array.isArray(data) ? data : null;
  } catch {
    return null;
  }
}

// Saving is batched: a burst of realtime patches writes once.
function scheduleSave(s) {
  clearTimeout(s.saveTimer);
  s.saveTimer = setTimeout(() => {
    try { localStorage.setItem(s.saveKey, JSON.stringify(s.data)); } catch {}
  }, 1000);
}

function storeFor(kind, pantryId) {
  const key = `${kind}:${pantryId}`;
  let s = stores.get(key);
  if (!s) {
    const saved = typeof window !== 'undefined' ? readSaved(kind, pantryId) : null;
    s = {
      data: saved, // null until the first load (or a saved copy)
      version: undefined, // a saved copy has no known version, so the first ask refetches
      inflight: null,
      saveKey: `${SAVE_KEYS[kind]}:${pantryId}`,
      listeners: new Set(),
      snapshot: { data: saved, version: undefined },
    };
    s.subscribe = (fn) => { s.listeners.add(fn); return () => s.listeners.delete(fn); };
    s.getSnapshot = () => s.snapshot;
    stores.set(key, s);
  }
  return s;
}

function publish(s, data) {
  s.data = data;
  s.snapshot = { data, version: s.version };
  s.listeners.forEach((fn) => fn());
  scheduleSave(s);
}

const SERVER_SNAPSHOT = { data: null, version: undefined };
const getServerSnapshot = () => SERVER_SNAPSHOT;
const EMPTY = { subscribe: () => () => {}, getSnapshot: getServerSnapshot };
const EMPTY_LIST = [];

function load(kind, pantryId, version, { force = false } = {}) {
  if (!pantryId) return Promise.resolve([]);
  const s = storeFor(kind, pantryId);
  if (!force && s.data && s.version === version) return Promise.resolve(s.data);
  if (!force && s.inflight && s.inflightVersion === version) return s.inflight;
  s.inflightVersion = version;
  const url = kind === 'shelf' ? '/api/foods' : '/api/foods/dictionary';
  const request = fetch(url, { headers: { 'x-pantry-id': pantryId }, cache: 'no-store' })
    .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`${url} failed (${r.status})`))))
    .then((json) => {
      // A newer request may have started meanwhile; only the latest one writes.
      if (s.inflight !== request) return s.data;
      s.version = version;
      publish(s, (kind === 'shelf' ? json.data : json.dictionary) || []);
      return s.data;
    })
    .catch((err) => {
      console.error(`Could not load ${kind}:`, err);
      // Nothing to show: settle on an empty list so screens stop loading.
      if (!s.data) publish(s, []);
      return s.data;
    })
    .finally(() => { if (s.inflight === request) s.inflight = null; });
  s.inflight = request;
  return request;
}

/** How many rows of a kind ('shelf' lots, 'items') this device already holds, saved or loaded; null if none. */
export function heldCount(kind, pantryId) {
  if (!pantryId) return null;
  const data = storeFor(kind, pantryId).data;
  return data ? data.length : null;
}

/** Loads (or refreshes) the pantry's lots. Skips when this version is already loaded, unless forced. */
export const loadInventory = (pantryId, version, opts) => load('shelf', pantryId, version, opts);

/** Loads (or refreshes) the pantry's item list. Versioned by lastCatalogUpdate. */
export const loadPantryItems = (pantryId, version, opts) => load('items', pantryId, version, opts);

/**
 * Applies one realtime inventory_batches change to the shelf right away, so a teammate's change shows
 * without waiting for a download. The grouped refetch that follows (PantryProvider) confirms it.
 */
export function applyLotChange(pantryId, { eventType, new: row, old } = {}) {
  const s = stores.get(`shelf:${pantryId}`);
  if (!s?.data) return;
  const lots = s.data;

  if (eventType === 'DELETE') {
    if (old?.id && lots.some((l) => l.id === old.id)) publish(s, lots.filter((l) => l.id !== old.id));
    return;
  }
  if (!row?.id) return;

  const patch = {
    quantity: Math.round(Number(row.quantity || 0) * 1000) / 1000,
    expirationDate: row.expiration_date || null,
    expirationPrecision: row.expiration_precision || null,
    storageLocation: row.storage_location || null,
    sourceType: row.source || null,
    receivedDate: row.received_date || null,
  };
  const i = lots.findIndex((l) => l.id === row.id);
  if (i >= 0) {
    const next = lots.slice();
    next[i] = { ...lots[i], ...patch };
    publish(s, next);
    return;
  }
  // A new lot: the row has no item details, so borrow them from a lot of the same item.
  // A brand-new item has none to borrow and appears with the refetch instead.
  const twin = lots.find((l) => l.catalogItemId === row.catalog_item_id);
  if (twin) publish(s, [...lots, { ...twin, ...patch, _id: row.id, id: row.id, batchId: row.id, locationId: row.location_id }]);
}

/** Applies a realtime catalog_items change (rename, new photo or size) to the lots of that item. */
export function applyItemChange(pantryId, { eventType, new: row } = {}) {
  const s = stores.get(`shelf:${pantryId}`);
  if (!s?.data || eventType !== 'UPDATE' || !row?.id || !s.data.some((l) => l.catalogItemId === row.id)) return;
  const patch = {
    name: row.name,
    barcode: row.barcode || null,
    photoUrl: row.photo_url || null,
    sizeAmount: row.size_amount ?? null,
    sizeUnit: row.size_unit ?? null,
    caseSize: row.case_size ?? null,
    archived: !!row.archived_at,
  };
  publish(s, s.data.map((l) => (l.catalogItemId === row.id ? { ...l, ...patch } : l)));
}

/** Forgets every saved and in-memory copy (on sign-out, so a shared phone keeps nothing). */
export function clearSavedData() {
  stores.clear();
  try {
    Object.keys(localStorage)
      .filter((k) => /^foodarca_(shelf|items|recent)_v1:/.test(k))
      .forEach((k) => localStorage.removeItem(k));
  } catch {}
}

function useShared(kind, version, enabled) {
  const { pantryId } = usePantry();
  const s = pantryId ? storeFor(kind, pantryId) : EMPTY;
  const snap = useSyncExternalStore(s.subscribe, s.getSnapshot, getServerSnapshot);

  useEffect(() => {
    if (pantryId && enabled) load(kind, pantryId, version);
  }, [kind, pantryId, version, enabled]);

  // fresh: loaded at the current version (not just a saved copy, and no refetch pending).
  return { data: snap.data, fresh: snap.data !== null && snap.version === version, pantryId };
}

/**
 * The pantry's lots, shared. `ready` is false only before the first copy (saved or loaded) exists;
 * `fresh` once it's loaded at the current version. `refresh()` refetches now (after a checkout,
 * say). With enabled: false it only reads what's already there and never downloads.
 */
export function useInventory({ enabled = true } = {}) {
  const { lastInventoryUpdate } = usePantry();
  const { data, fresh, pantryId } = useShared('shelf', lastInventoryUpdate, enabled);
  return {
    lots: data || EMPTY_LIST,
    ready: data !== null,
    fresh,
    refresh: () => loadInventory(pantryId, lastInventoryUpdate, { force: true }),
  };
}

/** The pantry's item list, shared; null until the first copy exists. Loads only while `enabled`. */
export function useItemList(enabled = true) {
  const { lastCatalogUpdate } = usePantry();
  return useShared('items', lastCatalogUpdate, enabled).data;
}
