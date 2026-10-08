'use client';

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import { MEMBERSHIP_SELECT, buildPantryContext, pantryToday } from '@/lib/pantry-context';
import { applyLotChange, applyItemChange, loadInventory, loadPantryItems, clearSavedData, heldCount } from '@/lib/use-inventory';
import { fetchPage } from '@/lib/use-paged-list';
import { FULL_SHELF_LIMIT, toSearchParams } from '@/lib/inventory-query';
import { setPantryHint, PANTRY_HINT } from '@/lib/hint-cookies';

const readPantryHint = () => {
  const m = document.cookie.match(new RegExp(`(?:^|; )${PANTRY_HINT}=([^;]*)`));
  return m ? decodeURIComponent(m[1]) : null;
};

const PantryContext = createContext({
  organizationId: null,
  locationId: null,
  pantryId: null, // alias for locationId for backward compatibility
  userRole: null,
  pantryDetails: null, 
  availablePantries: [], 
  switchPantry: async () => {}, 
  refreshPantry: async () => {},
  lastInventoryUpdate: null,
  lastCatalogUpdate: null,
  isLoading: true,
});

// initial: who and where, worked out on the server for this request (app/dashboard/layout.jsx →
// lib/server/dashboard-context), so the app starts already knowing: no lookups, no loading state.
export function PantryProvider({ initial = null, children }) {
  const router = useRouter();
  const [organizationId, setOrganizationId] = useState(initial?.organizationId || null);
  const [locationId, setLocationId] = useState(initial?.locationId || null);
  const [userRole, setUserRole] = useState(initial?.userRole || null);
  const [pantryDetails, setPantryDetails] = useState(initial?.pantryDetails || null);
  const [availablePantries, setAvailablePantries] = useState(initial?.availablePantries || []);
  const [isLoading, setIsLoading] = useState(!initial);
  const hasContext = useRef(!!initial); // a refresh with a pantry already known shows no loading state
  const [lastInventoryUpdate, setLastInventoryUpdate] = useState(() => Date.now()); // stock changed
  const [lastCatalogUpdate, setLastCatalogUpdate] = useState(() => Date.now()); // the item list changed
  const [startedAt] = useState(lastInventoryUpdate); // nothing has changed since, while they're equal

  const [supabase] = useState(() =>
    createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    )
  );

  // --- 1. REFRESH: after a pantry switch or a settings edit. One query (memberships with their
  // organizations and locations), the same rules as the server (lib/pantry-context), and the
  // pantry cookie as the one record of which location is active.
  const refreshPantry = useCallback(async () => {
    try {
      if (!hasContext.current) setIsLoading(true);
      // The dashboard layout already verified the user on the server, so the local session is enough
      // here (no round trip to Supabase Auth). Every query still runs under the user's token and RLS.
      const { data: { session } } = await supabase.auth.getSession();
      const user = session?.user;
      if (!user) return;

      const { data: memberships, error: memError } = await supabase
        .from('user_organizations')
        .select(MEMBERSHIP_SELECT)
        .eq('user_id', user.id)
        .eq('status', 'active');
      if (memError) console.error('Error fetching memberships:', memError);

      const ctx = buildPantryContext(memberships || [], readPantryHint());
      setAvailablePantries(ctx.availablePantries);
      setOrganizationId(ctx.organizationId);
      setLocationId(ctx.locationId);
      setUserRole(ctx.userRole);
      setPantryDetails(ctx.pantryDetails);
      setPantryHint(ctx.locationId);
      hasContext.current = !!ctx.locationId;
    } catch (err) {
      console.error('Error refreshing pantry:', err);
    } finally {
      setIsLoading(false);
    }
  }, [supabase]);

  // --- 2. REALTIME: keep every teammate's screen current ---
  // A change is drawn straight from the event (applyLotChange / applyItemChange), then confirmed:
  // it bumps lastInventoryUpdate (stock) and/or lastCatalogUpdate (the item list), which refetch the
  // shared copies (lib/use-inventory). Bumps are grouped: a 20-line drop-off fires ~20 events, and
  // each device should refetch once, not 20 times.
  useEffect(() => {
    if (!locationId) return;

    let timer = null;
    const pending = { stock: false, items: false };
    const bump = ({ stock = true, items = true } = {}) => {
      pending.stock ||= stock;
      pending.items ||= items;
      clearTimeout(timer);
      timer = setTimeout(() => {
        const now = Date.now();
        if (pending.stock) setLastInventoryUpdate(now);
        if (pending.items) setLastCatalogUpdate(now);
        pending.stock = pending.items = false;
      }, 300);
    };

    // A dropped connection (phone locked, app in the background, network blip) misses events,
    // so catch up whenever it comes back. The first join needs no catch-up: the page just loaded.
    const catchUpOnRejoin = () => {
      let joined = false;
      return (status) => {
        if (status !== 'SUBSCRIBED') return;
        if (joined) bump();
        joined = true;
      };
    };

    const stock = supabase
      .channel(`inventory-realtime-${locationId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'inventory_batches', filter: `location_id=eq.${locationId}` },
        (payload) => { applyLotChange(locationId, payload); bump({ items: false }); }
      )
      .subscribe(catchUpOnRejoin());

    // Its own channel, so a problem here can never stop stock updates.
    const items = organizationId
      ? supabase
          .channel(`catalog-realtime-${organizationId}`)
          .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'catalog_items', filter: `organization_id=eq.${organizationId}` },
            (payload) => { applyItemChange(locationId, payload); bump(); }
          )
          .subscribe(catchUpOnRejoin())
      : null;

    // Back on screen or back online: refetch now rather than waiting for the next change.
    const onVisible = () => { if (document.visibilityState === 'visible') bump(); };
    const onOnline = () => bump();
    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('online', onOnline);

    return () => {
      clearTimeout(timer);
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('online', onOnline);
      supabase.removeChannel(stock);
      if (items) supabase.removeChannel(items);
    };
  }, [supabase, locationId, organizationId]);

  // Tell the server which location this browser works in, so pages like Inventory can draw their
  // first screen with real data (lib/hint-cookies).
  useEffect(() => { if (locationId) setPantryHint(locationId); }, [locationId]);

  // --- 2b. WARM-UP: load the shelf and item list once the page is idle, on any dashboard page, so
  // Add and Remove open with data already in hand. Later changes refetch only where they're shown.
  // Only for pantries small enough to keep whole on the device (FULL_SHELF_LIMIT): a copy this device
  // already holds tells, otherwise one tiny count request (the paged endpoints with limit 0) asks.
  // Larger pantries skip it; their screens and sheets ask the server a page at a time.
  const versions = useRef({ stock: lastInventoryUpdate, items: lastCatalogUpdate });
  useEffect(() => { versions.current = { stock: lastInventoryUpdate, items: lastCatalogUpdate }; });
  useEffect(() => {
    if (!locationId) return;
    let cancelled = false;
    const isSmall = async (kind, path) => {
      const held = heldCount(kind, locationId);
      if (held !== null && held <= FULL_SHELF_LIMIT) return true;
      try {
        const page = await fetchPage(path, locationId, toSearchParams({ limit: 0, summary: true }));
        return (page?.summary?.all ?? 0) <= FULL_SHELF_LIMIT;
      } catch {
        return false; // unsure: leave it to the screens
      }
    };
    const warm = () => {
      isSmall('shelf', '/api/inventory').then((small) => {
        if (small && !cancelled) loadInventory(locationId, versions.current.stock);
      });
      isSmall('items', '/api/foods/dictionary').then((small) => {
        if (small && !cancelled) loadPantryItems(locationId, versions.current.items);
      });
    };
    if ('requestIdleCallback' in window) {
      const id = requestIdleCallback(warm, { timeout: 3000 });
      return () => { cancelled = true; cancelIdleCallback(id); };
    }
    const id = setTimeout(warm, 1500);
    return () => { cancelled = true; clearTimeout(id); };
  }, [locationId]);

  // --- 3. SWITCH PANTRY: an organization (its first location) or a location. The cookie records it;
  // router.refresh() redraws server-drawn pages (Inventory's first page) for the new pantry.
  const switchPantry = async (newOrgIdOrLocId) => {
    try {
      const org = availablePantries.find((p) => p.pantry_id === newOrgIdOrLocId);
      const locations = org ? [...(org.pantry?.locations || [])].sort((a, b) => String(a.created_at || '').localeCompare(String(b.created_at || ''))) : null;
      setPantryHint(org ? locations[0]?.id || null : newOrgIdOrLocId);
      await refreshPantry();
      router.refresh();
    } catch (error) {
      console.error('Failed to switch pantry:', error);
      setIsLoading(false);
    }
  };

  // --- 4. FIRST LOAD: normally the server already answered (initial). Without it, ask here.
  // One-time move from the old localStorage keys: their pantry choice becomes the cookie.
  useEffect(() => {
    let legacy = null;
    try {
      legacy = localStorage.getItem('active_location_id');
      localStorage.removeItem('active_location_id');
      localStorage.removeItem('active_organization_id');
    } catch {}
    if (legacy && !readPantryHint() && legacy !== initial?.locationId) {
      setPantryHint(legacy);
      refreshPantry().then(() => router.refresh());
    } else if (!initial) {
      refreshPantry();
    }
    // Once, on mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Signing out forgets the inventory copies saved on this device (lib/use-inventory).
  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') {
        clearSavedData();
        setPantryHint(null);
      }
    });
    return () => data.subscription.unsubscribe();
  }, [supabase]);

  return (
    <PantryContext.Provider value={{
      organizationId,
      locationId,
      pantryId: locationId || organizationId, // alias for backward compatibility during migration
      userRole,
      pantryDetails,
      availablePantries,
      switchPantry,
      refreshPantry,
      lastInventoryUpdate,
      startedAt,
      lastCatalogUpdate,
      isLoading
    }}>
      {children}
    </PantryContext.Provider>
  );
}

export const usePantry = () => useContext(PantryContext);

/** Today at the pantry ('YYYY-MM-DD'): the same on the server and in the browser (lib/pantry-context). */
/**
 * Can server-drawn data fetched at `fetchedAt` (server time, ms) be shown as current? A page the
 * browser kept from a recent visit (next.config staleTimes) may predate a teammate's change. It's
 * current when nothing has changed since the app started, or when it was fetched after the latest
 * change (with 2 s of slack for clocks that differ). Otherwise show it, but refetch at once.
 */
export function useServerDataIsCurrent(fetchedAt) {
  const { lastInventoryUpdate, startedAt } = useContext(PantryContext);
  if (lastInventoryUpdate === startedAt) return true;
  return !!fetchedAt && fetchedAt >= lastInventoryUpdate + 2000;
}

export const useToday = () => {
  const { pantryDetails, locationId } = useContext(PantryContext);
  // The location's own timezone first, as the database does.
  const loc = pantryDetails?.locations?.find((l) => l.id === locationId);
  return pantryToday(loc ? loc.timezone || 'America/New_York' : pantryDetails?.timezone);
};