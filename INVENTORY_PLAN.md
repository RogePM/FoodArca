# Inventory Model Redesign — Plan

Status: agreed direction, not built yet. All current DB data is test data and will be wiped.

## Agreed rules

1. Every pantry is treated as **mixed**. Each item is either **Count them** or **Weigh them**, chosen once when the item is created.
2. Each item has two questions answered once (what is it, how do you track it) and one answered every time (how much came in).
3. One amount box per screen. The amount never has a unit dropdown: it is "items" or "lb", fixed by the item.
4. **Size on the label** describes ONE item, is optional, and only exists for counted items.
5. Category is always picked by the volunteer (never guessed from Open Food Facts). It is saved on the item so it is asked once per product.
6. Blank stays blank. No `|| 1`, no `|| 'donation'`. Unknown is shown as "Not recorded" or left out, and reports say how much is missing.
7. Every stock change writes one history row, in the same database step. History is never edited or deleted; mistakes are fixed with an opposite row.

---

## 1. Data model

Keep the existing table names (`catalog_items`, `inventory_batches`, `activity_logs`) so RLS, realtime (`PantryProvider`), and types keep working. Change what is inside them. Add two small tables.

### `catalog_items` — the product (asked once)

| Column | Type | Required | Notes |
|---|---|---|---|
| name | text | yes | |
| category_id | fk | yes | |
| track_by | `count` \| `weight` | yes, default `count` | Count them / Weigh them |
| size_amount | numeric | no | Only when track_by = count. Exactly what the label says |
| size_unit | `oz` \| `lb` \| `fl_oz` \| `gal` \| `ct` | no | g / kg / mL / L converted at entry |
| weight_lbs | numeric, generated | — | From size: oz÷16, lb, fl_oz×0.0652, gal×8.34, ct → NULL. NULL = unknown |
| case_size | int | no | "4 cases × 24 = 96" shortcut |
| barcode, photo_url | text | no | |
| archived_at | timestamptz | no | Replaces hard delete |

Drop: `unit_of_measure`, `input_unit_value`, `pack_size`, `weight_per_unit_lbs`.

### `deliveries` — one drop-off (new)

| Column | Notes |
|---|---|
| organization_id, location_id, received_at, user_id | |
| source | `donation` \| `food_bank` \| `usda_tefap` \| `food_rescue` \| `purchased` \| NULL (= not recorded) |
| donor_name | nullable |
| is_anonymous | bool — "Anonymous" is different from "not recorded" |
| weighed_lbs | nullable — scale weight of the whole drop-off |

### `visits` — one give-out checkout (new)

| Column | Notes |
|---|---|
| organization_id, location_id, created_at, user_id | |
| client_id | nullable (anonymous walk-in allowed) |
| weighed_lbs | nullable — whole-bag scale weight, for pantries that weigh at checkout |

### `inventory_batches` — stock on the shelf ("lots")

| Column | Notes |
|---|---|
| catalog_item_id, location_id | |
| quantity | items if track_by = count, lb if weight. Decimals allowed for lb only |
| expiration_date + expiration_precision | `day` \| `month` \| NULL date = No date |
| storage_location | `shelf` \| `fridge` \| `freezer` \| custom text \| NULL |
| source | copied from the delivery |
| received_date | first received |

Lot identity = item + expiry + storage + source. Lots at 0 are deleted (history keeps everything).
Drop: `donor_name`, `source_type` (replaced by `source`).

### `activity_logs` — history (every change)

| Column | Notes |
|---|---|
| id, organization_id, location_id, created_at, user_id | who + when (user_id already exists) |
| action_type | `received` \| `given_out` \| `thrown_out` \| `corrected` \| `edited` |
| quantity_changed | **signed** (+24, −2). In the item's unit at that moment |
| unit | `items` \| `lb` — snapshot, so old rows stay readable after a conversion |
| weight_lbs_changed | signed, NULL when weight unknown |
| reason | thrown_out: `expired` \| `damaged` \| `recalled` \| `other` |
| catalog_item_id, batch_id | batch_id set null when lot is deleted |
| delivery_id / visit_id | which drop-off or visit it belongs to |
| snapshot_item_name, snapshot_category, snapshot_source | reports work even after edits/archives |
| details | jsonb, for `edited`: `{ field: [old, new] }` |
| reverses_id | set on undo rows; undo = same type, opposite sign |
| note | optional free text |

Reports sum by `action_type`. Because undo rows keep the same type with the opposite sign, totals net out automatically.

### Database functions (one per action, atomic)

| Function | Does | History rows |
|---|---|---|
| `receive_delivery(delivery, lines[])` | create delivery, add/merge lots | `received` +, per line |
| `give_out(visit, lines[])` | create visit, remove stock; use chosen lot, else soonest-expiring (FEFO) | `given_out` − |
| `throw_out(lines[], reason)` | remove stock | `thrown_out` − |
| `update_amount(lot, new_qty, why)` | set new amount; why = given_out / thrown_out / corrected | one row of that type, ± |
| `edit_item(item, changes)` | name, category, size, photo, case size | `edited` with details |
| `convert_item(item, new_track_by, new_total)` | switch Count ↔ Weigh with stock | `edited` with old/new qty+unit |
| `edit_lot(lot, expiry, storage)` | | `edited` with details |
| `archive_item(item, why)` | removes remaining stock with a reason, then archives | stock rows + `edited` |
| `undo_entry(log_id)` | opposite row, re-applies stock | same type, opposite sign, `reverses_id` |

---

## 2. Editing and deleting — what the user sees

| User wants to… | Where | What they do | What history records |
|---|---|---|---|
| Fix the name, category, size, photo | Item page → Edit item | Change fields | `edited` (old → new) |
| Change Count ↔ Weigh | Edit item → switch | If stock exists: "You have 24. About how much do they weigh?" | `edited` with conversion |
| Change expiry or storage of a lot | Item page → tap lot → Edit | Change chips | `edited` |
| Change the amount | Item page → Update amount | New number + "Why is it different?" [Given out] [Thrown out] [Counting mistake]. Default: Weigh items → Given out, Count items → Counting mistake | that type, ± |
| Throw something away | Remove page → Throw out, or item page | Pick reason | `thrown_out` |
| Empty bin (weighed) | Item page → All gone | One tap + why (default Given out) | that type |
| Undo a mistake | Recent changes → Undo (own entries, ~24 h) | One tap | opposite row |
| Delete a product | Item page → Delete | If stock left: "Why are these leaving?" then archived | stock rows + `edited` |
| Fix source/donor of a past drop-off | Recent changes → delivery → Edit | Change source/donor | updates received rows; lots that only came from that delivery |

Hard delete of items, lots, or history is removed from the app.

---

## 3. What reports and charts can use

| Number | From |
|---|---|
| Items received / given out / thrown out | sum of `quantity_changed` where unit = items, by type |
| Pounds received | per delivery: `weighed_lbs` if set, else sum of line `weight_lbs_changed` |
| Pounds given out / thrown out | sum of `weight_lbs_changed` by type; plus "N items not weighed" |
| Visits served | count of `visits` |
| Received by source / donor | `snapshot_source`, `deliveries.donor_name` — blanks shown as "Not recorded", separate from "Anonymous" |
| USDA / TEFAP in and out | `snapshot_source = usda_tefap` on received and given_out rows |
| Waste by reason | `thrown_out` grouped by reason (corrections are NOT waste) |
| Corrections (shrink) | `corrected` rows, shown separately |
| Over time / by category | `created_at`, `snapshot_category` |
| Completeness line | % of received with source recorded, % of pounds measured vs estimated |

Estimated $ value only on known pounds, labeled "estimated".

---

## 4. Screen-by-screen changes

### Add items
| File | Change |
|---|---|
| `components/pages/add-items/mobile-manual-entry-view.jsx` | Rebuild as 2 screens. S1: Name, Category, Count them / Weigh them, + Add size (count only), Photo. S2: How many? (items, Cases shortcut) or How much does it weigh? (lb), Expires chips, Where chips. Existing name → jump to known-item sheet |
| `components/pages/add-items/mobile-add-flow.jsx` | Known-item sheet: amount + expiry + where only (item facts read-only, "Edit item" link). Remove hard-coded `sourceType: 'donation'` (lines ~309, 352, 754). Scan found online → S1 prefilled except category |
| `components/pages/add-items/restock-sheet.jsx` | Amount with unit ("24 items" / "30 lb") via shared formatter |
| `components/pages/add-items/mobile-cart-view.jsx` | Cart = delivery: "From: Not recorded" chip (source, donor, anonymous), optional weighed total at submit. Decimal steppers for lb lines. Recently Added reads new history |
| `components/pages/add-items/desktop-add-view.jsx` | Use the same 2-screen form + cart logic (no separate rules) |
| `add-item-modal.jsx`, `form-view.jsx`, `scan-view.jsx`, `sucess-view.jsx` | Not imported anywhere — delete |

### Inventory
| File | Change |
|---|---|
| `components/pages/inventory/inventory-utils.js` | Remove `|| 'donation'`, `|| 'units'` fallbacks. Low stock only for counted items |
| `components/pages/inventory/mobile-grid-view.jsx` | Tile: **24** · Black Beans · 15 oz / **30 lb** · Apples; soonest expiry; storage chip or "2 spots" |
| `components/pages/inventory/batch-selection-sheet.jsx` | Becomes the item page: header (name, size, track by, total), lot list, **History** list, actions |
| `components/pages/inventory/item-actions-sheet.jsx` | Actions: Update amount, Throw out, Edit item, Delete (archive with reason). "Remove all" without reason goes away |
| `components/modals/edit-item-modal.jsx` | Split into Edit item / Edit lot |
| `components/pages/inventory/desktop-table-view.jsx` | Not imported — delete or rebuild later |

### Remove / distribution
| File | Change |
|---|---|
| `components/pages/distribution/mobile-distribution-flow.jsx` | Mode: Give out / Throw out. Counted scan → +1, FEFO lot. Weighed scan → "How much does it weigh?" lb. Chosen lot is sent to the API |
| `components/pages/distribution/quick-action-sheet.jsx` | Lot list with formatter; only shown when volunteer taps to choose, or in Throw out mode |
| `components/pages/distribution/checkout-modal.jsx` | Creates a visit (anonymous allowed), optional whole-bag weight |
| `distribution-desktop-table.jsx`, `distribution-mobile-list.jsx`, `cart-drawer.jsx`, `cart-sidebar.jsx`, `mobile-checkout-cart-view.jsx` | Read visits + `given_out` rows; units from formatter |

### Everything else
| File | Change |
|---|---|
| `components/pages/recent-changes-view.jsx` + `app/api/foods/changes/recent/route.js` | New types, who did it, delivery/visit grouping, Undo |
| `app/api/dashboard/stats/route.js`, `dashboard/overview-grid.jsx`, `dashboard/today-hero.jsx` | Remove `|| 1` and "count used as pounds"; corrections not waste; items and pounds separate; visits served |
| `app/api/notifications/route.js` | Expiring ignores No date; low stock only counted items; drop `unit_of_measure` |
| `app/api/export/route.js` | Inventory CSV columns: Item, Category, Track by, Size, Amount, Unit, Est. lb, Expires, Precision, Storage, Source, Donor — blanks blank. Add History CSV |
| `app/api/barcode/[code]/route.js` | Return size `{amount, unit}` raw (convert g/mL/kg/L), no category guess; catalog hit returns track_by + size |
| `app/api/foods/dictionary/route.js`, `app/api/foods/search/route.js` | Return track_by, size, case_size so picking by name skips screen 1 |
| `app/api/foods/route.js`, `app/api/foods/bulk/route.js`, `app/api/foods/[id]/route.js`, `app/api/client-distributions/route.js` | Thin wrappers over the DB functions above |
| `lib/categoryMapper.js` | Stop using for prefill (delete after) |
| `lib/database.types.ts` | Regenerate |
| `components/providers/PantryProvider.js` | Realtime on `inventory_batches` stays; adjust payload mapping |
| New `lib/inventory-format.js` | `formatAmount`, `formatSize`, `formatExpiry`, `formatSource` — every screen uses these |
| Categories | Add Clothing (non-food). Use `is_food` to skip the Expires step |

---

## 5. Build order

| Phase | Work | Done when |
|---|---|---|
| 0 | New branch from current | |
| 1 | Migration: columns, new tables, RLS, functions; wipe test data; regenerate types | Functions callable from SQL; a receive → give_out → undo round trip balances |
| 2 | API routes (barcode, dictionary, search, inventory list, receive, give out, throw out, update/edit/archive, history) | Each route returns new shape; no `|| 1` / `|| 'donation'` left |
| 3 | `lib/inventory-format.js` | |
| 4 | Add flow (manual 2 screens, known-item sheet, cart = delivery, desktop uses same) | Add a counted, a weighed, and a non-food item by hand and by scan |
| 5 | Inventory tile + item page (lots, history, actions) | Edit, convert, update amount, archive all write history |
| 6 | Remove page (Give out / Throw out, FEFO, chosen lot honored) | Stock and history match after a checkout |
| 7 | Recent changes + Undo, dashboard, notifications, export | Dashboard numbers equal SQL sums of history |
| 8 | Delete dead files, pilot walkthrough | |

Branch will be broken between phases 1 and 6; merge after phase 7.

## 6. Later (not for pilot)

- Pantry option "We only count" / "We only weigh" (hides the switch).
- Per-item low-stock levels.
- Household size on visits; TEFAP eligibility.
- Agency report templates built on the history table.
