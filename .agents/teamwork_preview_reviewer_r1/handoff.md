# Reviewer R1 Handoff Report: Safe, Free Image Fetcher Feature for FoodArca

## 1. Summary of Adversarial Findings & Fixes
The prior attempt implemented the basic skeleton of the image search API and picker component, but had critical UX breakages, edge case vulnerabilities, and subtle fallback bugs:

1. **Fatal Functional Bug — Premature Step Auto-Advance in `mobile-manual-entry-view.jsx`**:
   - *Input*: User typed an item name ("Campbell's Tomato Soup") and selected a Category ("Canned Goods").
   - *Expected*: The form remains on Step 1, letting the user trigger the photo search and select an image before continuing.
   - *Actual*: A hardcoded `setTimeout(() => setCurrentStep(2), 150)` in `select onChange` (and autocomplete selection) immediately advanced to Step 2, bypassing the photo picker completely.
   - *Fix*: Removed the premature auto-advance timeout. Users can now choose to pick a photo or click the prominent "Continue ->" button when ready.

2. **UX & Biasing Suboptimality — Step 1 Field Order**:
   - *Input*: Previous order was Item Name -> Product Photo -> Category.
   - *Expected*: Required fields (Item Name, Category) are entered first so the image picker can contextually bias search queries using both name and category.
   - *Actual*: Photo picker was placed above Category, meaning search was executed before category was chosen.
   - *Fix*: Reordered Step 1 so Category is selected before Product Photo.

3. **Hotlinking & Cross-Origin Referrer Blocking**:
   - *Input*: Scraped image URLs from CDNs (Walmart, Target, retail CDNs) rendered in browser `<img>` tags.
   - *Expected*: Images render without 403 Forbidden hotlink blocks.
   - *Actual*: Missing `referrerPolicy="no-referrer"` meant browser sent `Referer` headers that CDNs blocked.
   - *Fix*: Added `referrerPolicy="no-referrer"` and `crossOrigin="anonymous"` to all `<img>` tags.

4. **Wikimedia Commons Produce Fallback Failure**:
   - *Input*: Query for fresh produce (e.g., "Honeycrisp Apples", category "produce") falling back to Wikimedia.
   - *Expected*: Returns 3-4 fruit/produce images.
   - *Actual*: Returned 0 images because query forced "food packaging" and checked `pages.length === 0` instead of `urls.length === 0` (3 government PDF records were matched and rejected, terminating search).
   - *Fix*: Implemented category-aware search cascades (`produce food`, `fruit`, `food`) that check valid extracted URL counts (`urls.length >= 3`).

5. **Spurious Results on Blocked Queries**:
   - *Input*: `GET /api/foods/image-search?q=gun%20sexy%20nsfw`
   - *Expected*: Safely returns empty array (`images: []`).
   - *Actual*: Stripped all words, then appended generic "grocery food packaging", returning 4 random grocery images as if search succeeded.
   - *Fix*: Validated that query has at least 2 alphanumeric characters remaining after sanitization (`isValid: false` returns `images: []`).

6. **Category Normalization with Spaces**:
   - *Input*: Category passed as "Canned Goods" or "dry-goods".
   - *Expected*: Maps to `canned goods food`.
   - *Actual*: Looked up exact key without normalization, falling back to generic `grocery food`.
   - *Fix*: Normalized spaces/hyphens to underscores and added aliases to `CATEGORY_BIAS_MAP`.

7. **Custom URL Input Validation & Broken Image Fallback**:
   - *Input*: Pasting non-image URL (`.pdf`, `.html`, `.exe`) in custom URL input.
   - *Expected*: Rejected with error message.
   - *Actual*: Accepted, saving broken link.
   - *Fix*: Validated against disallowed file extensions and added broken-image fallback state in State 1.

8. **Over-Caching Empty Results**:
   - *Input*: Upstream transient failure returning 0 images.
   - *Expected*: Not cached for 1 hour.
   - *Actual*: Cached `images: []` for 1 hour.
   - *Fix*: Cache only writes when `finalImages.length > 0`.

9. **Next.js Suspense Alignment**:
   - *Input*: Next.js App Router Suspense pattern requirement.
   - *Fix*: Exported `ProductImagePickerSkeleton` and wrapped `ProductImagePicker` with `<Suspense fallback={<ProductImagePickerSkeleton />}>`.

---

## 2. Verification Record
- **Next.js Production Build (`npm run build`)**: Turbopack compiled successfully with 0 errors and 0 warnings.
- **Integration Test Suite (`node scripts/test-image-search-integration.js`)**: All 4 tests passed (Biasing, URL validation, DDG safe search, Wikimedia fallback for both produce and packaged goods).
- **Live Server E2E Test Suite (`node scripts/e2e-api-tests.js`)**: All 8 live HTTP tests passed against Next.js production server on port 3009.
