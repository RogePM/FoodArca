# TODO

## Known issue — dashboard images bypass Next.js image optimization (no `next/image`)

**Status:** Not fixed. Logged after an audit; deferred so we can keep
polishing individual sheets (restock sheet, etc.) without doing a
piecemeal, screen-by-screen image migration.

### The gap

The marketing site (`components/Frontend/**`, `app/(marketing)/features/*`,
14 files) already uses `next/image` correctly. The **dashboard** does not —
34 raw `<img>` tags across 14 files (`components/pages/add-items/*`,
`components/pages/distribution/*`, `components/pages/inventory/*`,
`components/ui/mobile-inventory-search.jsx`, `settings-view.jsx`), all
unoptimized: no resizing, no AVIF/WebP, no intrinsic `width`/`height` (so no
CLS protection beyond the surrounding fixed-size CSS box), and inconsistent
`loading="lazy"` (only 7 of 34 tags have it — 2 of those are the ones just
added to `restock-sheet.jsx`).

Worth noting: `next.config.mjs` already has a wide-open `remotePatterns`
(`hostname: '**'`, both http and https) — nothing in config blocks a
`next/image` migration today. But product photo URLs are hotlinked from
third parties (Open Food Facts, scraped Bing image search results,
Wikimedia — see `app/api/barcode/[code]/route.js` and
`app/api/foods/image-search/route.js`), not from our own Supabase Storage.
That wide-open pattern is itself a hardening concern (proxying arbitrary
scraped URLs, including http), and unreliable third-party/http hosts may be
slow or fail through Next's optimizer. Any migration also needs to preserve
the existing `onError` → category-icon fallback behavior (e.g. in
`mobile-inventory-search.jsx`), which works differently for `next/image`
than for a plain `<img>`.

### How to approach the fix — one source of truth, not per-screen patches

Per product direction: the **main inventory page** is the primary place
products/photos are fetched and displayed, so it should be the place a
proper `next/image`-based product-photo component gets built once (sizing,
`sizes`, fallback-on-error, category-icon placeholder handling, lazy
loading policy) — then every smaller inventory-adjacent sheet (restock
sheet, batch-selection sheet, quick-action sheet, cart/checkout views,
search, etc.) should consume that _same_ component instead of each screen
growing its own `<img>` + ad hoc padding/sizing/lazy logic independently
(which is exactly what's happened so far — e.g. the padding/sizing tweaks
made to `restock-sheet.jsx`'s product tiles in this session would need to
be redone project-wide otherwise).

### What NOT to do

- Don't fix this screen-by-screen as each sheet gets polished (that's how
  the current inconsistency — 7 of 34 tags lazy-loaded, differing padding,
  differing fallback handling — happened in the first place).
- Don't tighten `remotePatterns` or touch image sourcing as a side effect
  of this work without a dedicated look at where photo URLs come from —
  that's a separate decision from the rendering/optimization question.

## Known issue — `quantity` and unit-size are conflated (e.g. "6 fl oz" shows as "6 in stock")

**Status:** Not fixed. Logged here after investigation; deferred by product
decision to keep moving on restock-sheet UI polish first.

### The bug

Adding an item as "6 fl oz" (one container, 6 fl oz size) ends up displayed
as "6 in stock" everywhere, with the unit silently dropped — as if there
were six separate units in stock, not one 6oz container.

### Root cause — this is systemic, not a single-screen display bug

The manual-entry form (`components/pages/add-items/mobile-manual-entry-view.jsx`)
has two intake modes ("Count items" vs. "Total weight"), but only one
`quantity` number and one `unit` string ever get persisted — there's no
saved field distinguishing "how many discrete units" from "how big is one
unit." Specifically:

- `handleSave` (lines ~833–875) saves `quantity = 6`, `unit = "fl_oz"` for a
  weight/volume-mode entry, with no `intakeMode` persisted anywhere.
- `app/api/foods/route.js`'s `normalizeUnit` (lines ~8–28) lossily collapses
  units into one mixed count/measure column (`unit_of_measure`) — e.g. `mL`
  and `L` get silently remapped to `fl_oz`/`gallon` without converting the
  number.
- `/api/foods/dictionary` doesn't return `unit`/`weightPerUnit` at all, so
  every downstream screen that reads from it (including the restock sheet)
  falls back to the generic word "units."
- `restock-sheet.jsx`'s `totalQuantity` is a plain sum of `batch.quantity`
  across batches, with no regard for what that number represents.
- The only places that _do_ handle weight/volume items differently
  (`mobile-cart-view.jsx`, `desktop-add-view.jsx`) only work because they
  still hold the form's in-memory `intakeMode` — which evaporates the
  moment the item is actually saved to the database.
- Same "print quantity + generic unit, sum blindly" pattern also affects:
  `components/pages/inventory/batch-selection-sheet.jsx`,
  `components/pages/distribution/distribution-desktop-table.jsx`,
  `components/pages/inventory/desktop-table-view.jsx`,
  `app/dashboard/overview-grid.jsx`, and the stock-change-log quantity math
  in `route.js` / `bulk/route.js` / `[id]/route.js` (which multiplies
  `quantity × weight_per_unit_lbs`, meaningless for volume units since that
  column is hardcoded to 0 for them).

### What a real fix requires (do this as its own dedicated pass, not a drive-by)

1. Persist a real count-vs-measured flag (the form's `intakeMode`) instead
   of letting it live only in memory during add.
2. Stop the lossy `normalizeUnit` collapsing of distinct units into one
   column without converting the numeric value.
3. Return `unit` / `weightPerUnit` / the mode from `/api/foods/dictionary`.
4. Update every screen above that prints or sums `quantity` to branch on
   that mode instead of assuming "quantity always means a count."

### What NOT to do

- Don't patch this piecemeal on individual screens (e.g. just relabeling
  the restock sheet) — that hides the symptom on one screen while every
  other screen listed above still mishandles the same data.

### Related follow-ups noted, not yet investigated

- **Zero-quantity batches aren't cleaned up.** A batch with no expiration
  date that has been fully drawn down to 0 units still shows up (e.g. in
  the restock sheet's Batch Select list) instead of being deleted or
  hidden once empty. Need to find where batches reach 0 (removal/checkout
  flow) and decide: hard-delete the row, or filter `quantity > 0` at read
  time everywhere batches are listed (dictionary merge in
  `restock-sheet.jsx`, `batch-selection-sheet.jsx`, distribution views,
  etc.) — whichever the data model actually supports.
- **Batch logic needs re-verification once the quantity/unit conflation
  above is fixed** — batch quantity summing, FEFO sorting, and "empty
  batch" detection all currently assume `quantity` is a plain count, so
  they need a second look after intake mode is properly tracked, not
  just patched independently now.
- **How item/stock counts are presented to users across sheets** needs a
  consistent pass once the above is settled — e.g. restock sheet's "N in
  stock" stat, batch row "N units in stock" captions, and equivalents in
  distribution/inventory screens should all present quantity the same way
  (with correct unit, and consistent rounding/formatting) rather than each
  screen inventing its own phrasing.

## Recent Activity — shared source for "Recently Added" (mobile Add screen)

**Status:** Row actions in the mobile Add screen's "Recently Added" list
(`components/pages/add-items/mobile-cart-view.jsx`) are disabled for now
(`quickAddRecentItem` is defined but not wired to the row's `onClick`).
Rows still render (read-only) until this is rebuilt properly.

### Why

Right now the "Recently Added" strip on the Add screen fetches its own data
independently:

- `GET /api/foods/changes/recent` (last 50 activity_logs rows)
- `GET /api/foods/dictionary?names=...` (photo lookup by item **name**)

`components/pages/recent-changes-view.jsx` (the full Activity Log page under
Settings) hits the **same** `/api/foods/changes/recent` endpoint
independently too. Two screens, two separate fetches, no shared cache, and
the Add screen's photo lookup happens by string-matching item names — which
is fragile (case/typo mismatches) and requires a second network round trip
that shouldn't be necessary.

### The efficient fix, in order of priority

1. **Drop the second API call entirely — join, don't look up by name.**
   `activity_logs` already stores `catalog_item_id`. `catalog_items` already
   has `photo_url`. The recent-activity query already joins
   `catalog_item:catalog_items(categories(name))` — just add `photo_url` to
   that same select:

   ```
   .select('*, catalog_item:catalog_items(photo_url, categories(name))')
   ```

   This removes `/api/foods/dictionary` from this flow completely (no more
   name-matching, no second request, no risk of a missed match). This alone
   is the highest-value, lowest-effort fix — do this first regardless of
   anything else below.

2. **One shared hook, not two independent fetches.**
   Add a small hook, e.g. `useRecentActivity({ pantryId, limit, actionTypes })`
   (a good home: `components/providers/` alongside `PantryProvider.js`, or a
   new `lib/hooks/useRecentActivity.js`). Both the Add screen's compact strip
   and the full `RecentChangesView` page call the same hook with different
   `limit`/filter params. One place owns the fetch + shape of the data;
   nobody re-implements the log→UI mapping twice (it's already duplicated
   between `route.js` and `recent-changes-view.jsx` today).

3. **Cache it for the session, don't refetch on every mount.**
   This data is a "nice to see" shortcut, not a source of truth — it doesn't
   need to be live-fresh on every visit. Keep a small in-memory cache (a
   module-level `Map` keyed by `pantryId`, or a context value) with a short
   TTL (30–60s is plenty). Bouncing between Add → Camera → Add or Add →
   Dashboard → Add shouldn't refire the network request every time.
   No need for a full data-fetching library (SWR/React Query) just for this —
   the app doesn't use one elsewhere, and pulling one in for a single
   low-stakes widget would be the kind of over-engineering we want to avoid.

4. **Cap the query at the source, not in the client.**
   The endpoint currently pulls 50 rows and the client slices/dedupes down
   to ~8. If a caller only needs a handful (the Add screen strip does),
   support a `?limit=` param on `/api/foods/changes/recent` so the DB query
   itself is small, instead of always pulling 50 and throwing most away.
   (The full Activity Log page can keep asking for more.)

5. **Optional / later — real-time push instead of polling.**
   `PantryProvider.js` already opens a Supabase Realtime channel
   (`inventory-realtime-${locationId}`) for inventory changes on this
   branch. If "Recently Added" ever needs to feel instantly live (e.g. two
   volunteers scanning at once), the same pattern could subscribe to
   `activity_logs` inserts for the org and prepend into the shared cache
   from (3) instead of re-fetching. **Don't build this up front** — it's a
   persistent subscription + more moving parts for what is currently a
   convenience shortcut, not a requirement. Only worth it if real usage
   shows staleness is actually a problem.

### What NOT to do

- Don't build a whole new "Recent Activity" **page/route**. One already
  exists in spirit (`recent-changes-view.jsx` / Settings → Activity Log).
  The Add screen's list should be a thin, capped projection of the same
  shared source (the hook in step 2), not a parallel feature.
- Don't reach for global state (Redux/Zustand/etc.) for this — a hook +
  small module-level cache is proportional to the actual problem size.
- Don't re-enable the row tap-to-add action until the data source above is
  settled — wiring it back onto the current name-matched, uncached fetch
  would just add UI on top of the thing we're about to replace.

## Planned — Add Items search bar should add-to-cart inline, not jump to Inventory

**Status:** Not started. Deferred until the Remove page / distribution cart
flow is fixed, since this builds on the same cart concepts.

### Current behavior

`MobileInventorySearch` (`components/ui/mobile-inventory-search.jsx`) is a
single shared component used in 3 places — the Inventory page, Settings, and
the Add Items flow's empty-cart screen
(`components/pages/add-items/mobile-cart-view.jsx:227`) — each customizing it
via props (`accentColor`, `inventoryData`, `onSubmit`, `onItemSelect`), not
via 3 separate implementations. Today all 3 call sites do the same thing on
submit/select: navigate to `/dashboard/inventory`, filtered. There is no
"Add to cart" action anywhere in the search results, including from the Add
Items screen — that search bar is currently just a "check what's already in
stock" shortcut, unrelated to the cart being staged.

### The planned change

When search is opened from the Add Items flow, picking a pill/result or
pressing "Go" should stay in-flow and let the volunteer add the matched
item(s) straight to the cart being built (e.g. a quantity-picker bottom
sheet), instead of navigating away to the Inventory grid. This only requires
a different `onSubmit`/`onItemSelect` callback passed from
`mobile-cart-view.jsx` — the shared `MobileInventorySearch` component itself
shouldn't need structural changes, just a new result-rendering mode/callback
shape it can hand back to the caller (matched items, not just a query/filter
to route with).

Note: navigating away today is non-destructive in the meantime — the staged
cart already persists to `sessionStorage` (`foodarca_staged_batch` in
`mobile-add-flow.jsx`), so leaving via search and returning via the bottom
nav keeps the in-progress cart intact.

### Why deferred

Product wants the Remove page / distribution cart rebuilt first (see cart
state handling there), since the Add flow's "add to cart from search" result
should follow whatever cart patterns come out of that work rather than
inventing a second, inconsistent one.
