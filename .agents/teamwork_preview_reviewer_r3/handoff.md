# Reviewer R3 Handoff Report: Safe, Free Image Fetcher Feature for FoodArca

## 1. Adversarial Findings & Root Causes (Step 2 - Break It)

During Round 3 adversarial review, a deep audit of the manual entry form integration, photo persistence across edits, barcode scanner interactions, autocomplete synchronization, and accessibility was conducted, identifying 6 subtle defects:

1. **Fatal Functional Bug — Catalog Item Photo Loss on Edit (`PUT /api/foods/[id]`)**:
   - *Input*: User in the Inventory screen opened an existing item, clicked "Change" to pick a new packaging photo or "Remove photo" to clear it, and tapped "Save changes".
   - *Expected*: The updated `photoUrl` or cleared photo (`null`) is saved to the backend database on `catalog_items`.
   - *Actual*: `PUT /api/foods/[id]` only updated `catalog_items.name = data.name`. The `photoUrl` field was completely ignored, meaning photo additions, edits, or removals on existing items were silently discarded upon save.
   - *Root Cause*: `PUT /api/foods/[id]/route.js` lacked `photo_url` in the update payload for `catalog_items`.
   - *Fix*: Updated `PUT /api/foods/[id]/route.js` to inspect `data.photoUrl !== undefined` and persist `catUpdate.photo_url = data.photoUrl || null` to `catalog_items`.

2. **Functional Bug — Autocomplete Photo Mismatch on Suggestion Switch**:
   - *Input*: User typed "Milk", selected a milk carton photo, then cleared/edited the query to "Cheerios" and clicked an autocomplete suggestion for "Cheerios Cereal" that had no saved photo.
   - *Expected*: The form photo is updated to match the new item (cleared if no photo is attached to that suggestion).
   - *Actual*: `if (sugg.photoUrl) setFormPhotoUrl(sugg.photoUrl)` was conditional only on truthy values. If the selected suggestion had no photo, the previous product's photo ("Milk") remained attached to "Cheerios Cereal".
   - *Root Cause*: Conditional `if (sugg.photoUrl)` guarded the photo update instead of setting `sugg.photoUrl || sugg.photo_url || null`.
   - *Fix*: Updated autocomplete handler in `mobile-manual-entry-view.jsx` to set `setFormPhotoUrl(sugg.photoUrl || sugg.photo_url || null)`.

3. **UX / Interaction Defect — Unintended Web Scrape Triggered on Custom URL Validation Errors**:
   - *Input*: User opened State 2, pasted an invalid custom URL (e.g., non-image document `.pdf` or malformed URL), and pressed Enter or clicked "Use".
   - *Expected*: Error notification about the custom URL without a misleading "Retry" button that initiates a DuckDuckGo web search.
   - *Actual*: The error card rendered a "Retry" button because `formName.trim().length >= 2` was true. Tapping "Retry" re-triggered an external image search for the product name rather than addressing the custom URL.
   - *Root Cause*: Error card checked only `formName.trim().length >= 2` without checking if the error was a custom URL validation issue.
   - *Fix*: Added condition `!error.toLowerCase().includes("url") && !error.toLowerCase().includes("item name")` to the Retry button in `product-image-picker.jsx`.

4. **Component Lifecycle Risk — Stale Form State on Item Switch**:
   - *Input*: User opened manual entry for Item A, then switched to Item B without the parent component unmounting.
   - *Expected*: Form state (name, category, photoUrl, etc.) resets cleanly to Item B.
   - *Actual*: `useState` hooks in `MobileManualEntryView` retained Item A's values.
   - *Root Cause*: Missing `key` prop on `<MobileManualEntryView>` in `mobile-add-flow.jsx` and `inventory/index.jsx`, plus absence of an `initialItem` prop synchronization effect.
   - *Fix*:
     - Added `key={scannedItem?.id || scannedItem?.barcode || 'manual-entry'}` in `mobile-add-flow.jsx`.
     - Added `key={selectedItem?.id || 'edit-item'}` in `inventory/index.jsx`.
     - Added a synchronization `useEffect` inside `mobile-manual-entry-view.jsx` to sync form state whenever `initialItem` changes.
     - Added support for both `initialItem.photoUrl` and `initialItem.photo_url`.

5. **Memory Leak Risk — State Update on Unmounted Component**:
   - *Input*: User selected an image in State 2 and instantly saved or navigated back before the 200ms auto-close timer elapsed.
   - *Expected*: Clean transition without orphaned timers.
   - *Actual*: An untracked `setTimeout` attempted to call `setIsExpanded(false)` on an unmounted component.
   - *Fix*: Added `selectTimerRef` with unmount cleanup (`clearTimeout(selectTimerRef.current)`).

6. **Accessibility & Layout Deficiencies in Image Picker**:
   - *Input*: Screen reader users or devices with dynamic screen widths.
   - *Expected*: Standard accessibility attributes (`aria-label`, `aria-expanded`, `aria-haspopup`, `aria-pressed`) and dynamic column scaling for 1, 2, 3, or 4 options.
   - *Actual*: Missing ARIA attributes on buttons/inputs; rigid column grid didn't center 1 or 2 options.
   - *Fix*: Added comprehensive ARIA attributes across State 1 and State 2, and implemented dynamic grid class calculation (`grid-cols-1`, `grid-cols-2`, `grid-cols-3`, `grid-cols-4`).

---

## 2. Changes Made
- `app/api/foods/[id]/route.js`:
  - Persisted `catUpdate.photo_url = data.photoUrl || null` on `catalog_items` during PUT updates.
- `app/api/foods/image-search/route.js`:
  - Added category aliases (`canned`, `meat`, `drinks`, `drink`, `frozen`, `pantry`, `snacks`, `snack`) to `CATEGORY_BIAS_MAP`.
  - Refined regex word-boundary stripping for blocked terms and whitespace cleanup.
- `components/pages/add-items/product-image-picker.jsx`:
  - Added `selectTimerRef` with unmount cleanup to avoid memory leaks.
  - Constrained "Retry" button to only appear on genuine search/fetch failures, not custom URL validation errors.
  - Added full ARIA accessibility (`aria-label`, `aria-expanded`, `aria-haspopup`, `aria-pressed`, `aria-label` on inputs/buttons).
  - Implemented dynamic responsive grid classes for 1, 2, 3, or 4 images.
- `components/pages/add-items/mobile-manual-entry-view.jsx`:
  - Supported both `initialItem.photoUrl` and `initialItem.photo_url`.
  - Added `useEffect` for `initialItem` state synchronization.
  - Updated autocomplete suggestion selection to synchronize `formPhotoUrl` accurately (`sugg.photoUrl || sugg.photo_url || null`).
- `components/pages/add-items/mobile-add-flow.jsx`:
  - Added `key={scannedItem?.id || scannedItem?.barcode || 'manual-entry'}` to `<MobileManualEntryView />`.
- `components/pages/inventory/index.jsx`:
  - Added `key={selectedItem?.id || 'edit-item'}` to `<MobileManualEntryView />`.
- `scripts/test-image-search-integration.js`:
  - Added tests for category aliases (`meat`, `drinks`, `snacks`).
  - Added Test 5 for autocomplete photo synchronization, `initialItem` property resolution, and dynamic grid classes.
- `scripts/e2e-api-tests.js`:
  - Added Test 10 verifying live HTTP image search with category aliases.

---

## 3. Verification Record
- **Next.js Production Build (`npm run build`)**: Turbopack compiled successfully in 10.3s with 0 errors and 0 warnings across all 28 routes (exit code 0).
- **Integration Test Suite (`node scripts/test-image-search-integration.js`)**: All 5 test suites passed in 2.2s (Query biasing & aliases, URL safety & fragments, DuckDuckGo strict safe search, parallel Wikimedia Commons fallback, form state sync & layout logic).
- **Live Server E2E Test Suite (`node scripts/e2e-api-tests.js`)**: All 10 live HTTP tests passed against Next.js server on port 3000 (Empty queries, soup with category, in-memory caching, dairy, produce, safety sanitization, blocked terms, category normalization with spaces, Unicode/accented food search, and category aliases).
- **Routing Unit Tests (`node scripts/test-route-logic.cjs`)**: 12/12 assertions passed.

---

## 4. Known Issues Ledger
- `Minor Robustness Risk`: DuckDuckGo HTML scraping can be susceptible to anti-bot challenges under sustained high-frequency scraping from datacenter IPs without proxy rotation (mitigated by in-memory caching and resilient Wikimedia Commons fallback).
- `Minor Robustness Risk`: Open Food Facts API endpoints occasionally return HTTP 503 during upstream maintenance (mitigated by automatic fallback to Wikimedia Commons).
- `Shallow Verification`: Physical mobile device touchscreen gestures and mobile camera hardware integration were verified via desktop emulation and browser viewport events rather than a physical iOS/Android device.

---

## 5. Remaining Risk & Next Step
All acceptance criteria for R1 (safe backend image fetcher) and R2 (elegant two-state UI) have been thoroughly audited, refined, and verified. Form reset, photo persistence on item edits, autocomplete photo synchronization, error states, and accessibility are complete. Ready for final victory audit.
