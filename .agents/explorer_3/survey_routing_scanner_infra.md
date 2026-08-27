# FoodArca Architecture Survey: Routing, Navigation, Scanner, UI Components & Build Infrastructure

**Explorer 3 Investigation Report**  
**Date:** 2026-08-21  
**Project Workspace:** `C:\Users\COMP1\.gemini\antigravity\worktrees\FoodArca\migrate-supabase-realtime-inventory`  
**Target Flow Context:** Mobile-first Checkout / Item Removal (`components/pages/distribution`), mirroring Intake / Add flow (`components/pages/add-items`)

---

## Executive Summary

This investigation surveys the application layout, navigation shell, persistent bottom navigation, camera/barcode scanner subsystems, UI component primitives, and build/test tooling within FoodArca. 

FoodArca is a **Next.js 16 (App Router) + React 19** inventory management web application styled with **Tailwind CSS 3.4**, **Radix UI**, **Lucide React**, and **Framer Motion 12**. The dashboard layout employs a responsive split architecture:
- **Desktop:** Fixed sidebar (`280px` width) + sticky TopBar (`72px` height) + main content area.
- **Mobile:** Fullscreen viewport (`100dvh`), persistent bottom navigation bar (`z-[100]`, height `~75px + env(safe-area-inset-bottom)`), with top bar suppressed on full-screen flows (like `Add Items`).
- **Scanner Subsystem:** Dual-engine architecture in `components/ui/BarcodeScannerOverlay.jsx` featuring native GPU hardware barcode detection (`BarcodeDetector` API for Android/Chromium) with `@zxing/library` `BrowserMultiFormatReader` fallback for iOS Safari.
- **Tooling Infrastructure:** Next.js build (`next build`), Next lint (`next lint`), JavaScript/JSX with `@/*` path mapping via `jsconfig.json`.

---

## 1. Routing & Layout Architecture

### 1.1 App Router & Dashboard Client Sub-Routing

| Layer | File Path | Role / Mechanics |
|---|---|---|
| **Root Layout** | `app/layout.js` | Mounts `Inter` font, Google Analytics, global CSS (`app/globals.css`), and wraps entire tree in `<PantryProvider>`. |
| **Dashboard Layout** | `app/dashboard/layout.jsx` | Sub-layout wrapping dashboard children with metadata and `<PantryProvider>`. |
| **Server Auth Guard** | `app/dashboard/page.js` | Server component executing `supabase.auth.getUser()`, membership check in `user_organizations`, default location resolution from `locations`, and redirects unauthenticated users to `/` or onboarding to `/onboarding`. Passes `initialUser` and `initialPantryId` props to client app. |
| **Client Router Hub** | `app/dashboard/client-page.jsx` | Client component managing active view state (`activeView`) synchronized with `window.location.hash` (`#Dashboard`, `#Add%20Items`, `#Remove%20Items`, `#View%20Inventory`, `#Recent%20Changes`, `#Settings`). Uses `<AnimatePresence mode="wait">` and `<motion.div>` for view transitions. |
| **Dashboard Layout Shell** | `components/layout/dashboard-layout.jsx` | Orchestrates responsive layout: desktop sidebar vs mobile bottom navigation, conditional top bar display, and scrollable main container. |

```
app/dashboard/page.js (Server Component: Auth & Org Guard)
  └── app/dashboard/client-page.jsx (Client Component: Hash Routing)
        └── components/layout/dashboard-layout.jsx (Layout Shell)
              ├── Desktop Sidebar (hidden md:block) [components/layout/sidebar.jsx]
              ├── TopBar (conditional on mobile) [components/layout/topbar.jsx]
              ├── <main> Content Area (with bottom safe-area padding)
              │     ├── 'Dashboard'       -> <DashboardHome />
              │     ├── 'Add Items'       -> <AddItemView /> -> (DesktopAddView / MobileAddFlow)
              │     ├── 'Remove Items'    -> <DistributionModule />
              │     ├── 'View Inventory'  -> <InventoryView />
              │     ├── 'Recent Changes'  -> <RecentChangesView />
              │     └── 'Settings'        -> <SettingsView />
              └── Mobile BottomNav (md:hidden fixed bottom-0 z-[100]) [components/layout/bottom-nav.jsx]
```

### 1.2 Persistent Bottom Navigation Bar (`components/layout/bottom-nav.jsx`)

The mobile navigation bar is mounted persistently inside `components/layout/dashboard-layout.jsx`.

- **CSS Classes & Dimensions:**
  ```jsx
  className="md:hidden fixed bottom-0 left-0 right-0 w-full z-[100] bg-[#fafaf8]/90 backdrop-blur-2xl border-t border-gray-200/50 pt-2 pb-[calc(10px+env(safe-area-inset-bottom))] flex items-center justify-evenly px-2 shadow-[0_-8px_32px_rgba(0,0,0,0.08)]"
  ```
- **Z-Index:** `z-[100]`.
- **Height:** Physical height is `~64px–75px` + `env(safe-area-inset-bottom)`.
- **Content Padding Offset:**
  - `components/layout/dashboard-layout.jsx` sets:
    ```jsx
    <main className="flex-1 flex flex-col overflow-x-hidden overflow-y-auto pb-[calc(90px+env(safe-area-inset-bottom))] md:pb-6">
    ```
  - Sticky bottom action bars in views (e.g. `distribution-mobile-list.jsx`) require explicit bottom padding (`pb-[90px]` or `pb-[calc(1rem+env(safe-area-inset-bottom))]`) to avoid clipping under the bottom nav bar.
- **Fullscreen Overlays:**
  - Fullscreen camera scanner flows or full modal checkout sheets intentionally bypass the bottom nav by rendering with `fixed inset-0 z-[9999]` or `z-[10000]`.
- **Navigation Tabs Structure:**
  - **Left Tabs:** `Home` (`view: 'Dashboard'`, icon: `LayoutDashboard`), `Inventory` (`view: 'View Inventory'`, icon: `Boxes`).
  - **Center Action:** `Add` (`view: 'Add Items'`, icon: `Plus`, orange squircle `h-10 w-10 bg-[#d97757] text-white rounded-[14px]`).
  - **Right Tabs:** `Remove` (`view: 'Remove Items'`, icon: `MinusSquare`), `Recent` (`view: 'Recent Changes'`, icon: `History`).

---

## 2. Barcode Scanner Subsystem & Camera Lifecycle

### 2.1 Scanner Component Architecture (`components/ui/BarcodeScannerOverlay.jsx`)

The barcode scanner is implemented as a self-contained, high-performance overlay component supporting dual detection engines:

```
                  ┌─────────────────────────────────────┐
                  │     BarcodeScannerOverlay.jsx       │
                  └──────────────────┬──────────────────┘
                                     │
                    Is "BarcodeDetector" in window & !iOS?
                                     │
                   ┌─────────────────┴─────────────────┐
                   ▼                                   ▼
          [Native GPU Engine]                 [ZXing JS Engine]
        window.BarcodeDetector           @zxing/library BrowserMultiFormatReader
    (Android Chrome, Chromium)                (iOS Safari, Firefox fallback)
   - Continuous rAF animation loop          - reader.decodeFromConstraints()
   - Dynamic bounding-box reticle           - Stable ref onScan callback
   - Native haptic vibration (60ms)         - 100ms decode attempt polling
   - 500ms debounce cooldown                - Clean reset on unmount
```

#### Key Implementation Details:
1. **Engine A: Native GPU `BarcodeDetector` (Android/Chrome):**
   - Media stream initialized via `navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment", width: { ideal: 1920 }, height: { ideal: 1080 }, focusMode: "continuous", exposureMode: "continuous", whiteBalance: "continuous" } })`.
   - Continuous scanning loop via `requestAnimationFrame(nativeHunt)`.
   - Supports formats: `["ean_13", "ean_8", "upc_a", "code_128"]`.
   - Realtime bounding box calculations (`detectedItem.boundingBox`) snapped to the video element coordinates with green target animation reticle (`#22c55e`).
2. **Engine B: ZXing `BrowserMultiFormatReader` (iOS Safari / WebKit Fallback):**
   - Uses `@zxing/library` directly rather than `react-zxing`'s hook to eliminate stream recreation re-render bugs and "video play" race conditions in React 19.
   - Initialized once on mount via `setTimeout(startZxing, 50)` with clean `reader.reset()` and stream track teardown on component unmount.
3. **Camera Stream Lifecycle & Permissions:**
   - Permissions requested automatically when mounting `BarcodeScannerOverlay`.
   - On cleanup/unmount, all media tracks (`stream.getTracks().forEach(t => t.stop())`) are immediately stopped, preventing background camera battery drain.
4. **Debouncing and Concurrency Protection:**
   - **Overlay-level debounce:** 500ms cooldown after successful detection.
   - **Flow-level debounce (in `mobile-add-flow.jsx`):** 1500ms time gate on identical barcode (`lastScanRef`), plus `pendingScansRef = useRef(new Set())` to prevent duplicate API lookups in-flight.

### 2.2 Scanner-to-Lookup Flow & Sheet Display

#### In Intake Flow (`components/pages/add-items/mobile-add-flow.jsx`):
1. User scans barcode.
2. `handleScan(code)` fires GET `/api/barcode/[code]` with header `x-pantry-id`.
3. If barcode is recognized in local catalog (`catalog_items`) or OpenFoodFacts:
   - Sets `scannedItem` and populates `formName`, `formCategory`, `formQty`, `formExpDate`, `formUnit`.
   - Opens **Fast Intake Popup** (`sheetState === 'KNOWN'`).
   - User reviews, adjusts quantity stepper or expiration date, and clicks **"Add to Batch"** (`setCartItems(prev => [item, ...prev])`).
4. If barcode is unknown:
   - Routes to `MANUAL_ENTRY` view (`<MobileManualEntryView />`) with pre-filled barcode.

#### In Existing Distribution Flow (`components/pages/distribution/index.jsx` & `continuous-scanner.jsx`):
1. Mounts `<ContinuousScanner>` with `<BarcodeScannerOverlay>`.
2. On scan, matches barcode against active inventory list `inventory.find(i => i.barcode === code && i.quantity > 0)`.
3. Automatically stages item into cart with toast notification `<CheckCircle> Added to current checkout`.
4. *Target Refactor for R1/R2:* Mobile Checkout will replace this with a **Cart-First Architecture** (`MobileCartView` pattern) and a **Quick Action Sheet** (forcing explicit batch selection when multiple expiration dates exist).

---

## 3. UI Component Library & Styling System

### 3.1 Technology Stack

| Library | Version | Usage |
|---|---|---|
| **Tailwind CSS** | `3.4.17` | Utility-first styling with CSS variables defined in `app/globals.css`. |
| **Radix UI** | Multiple (`^1.1.11` – `^2.2.6`) | Unstyled headless primitives (`@radix-ui/react-dialog`, `@radix-ui/react-dropdown-menu`, `@radix-ui/react-scroll-area`, `@radix-ui/react-select`, `@radix-ui/react-avatar`). |
| **Lucide React** | `0.525.0` | Comprehensive iconography with consistent stroke weight (`strokeWidth={2}` or `2.5`). |
| **Framer Motion** | `12.24.12` | Fluid spring physics for bottom sheets (`damping: 28, stiffness: 260`), route transitions, active tab indicators (`layoutId="active-pill"`), and toast badges. |
| **clsx & tailwind-merge** | `2.1.1` / `3.4.0` | Class concatenation helper `cn(...)` in `lib/utils.js`. |

### 3.2 UI Design Tokens & Color Palette

- **Brand Orange (Intake/General Primary):** `#d97757` (default), `#c06245` (darker active), `#fff0eb` / `#fff5f2` (subtle light backgrounds).
- **Distribution / Checkout Green (Action Accent):** `#154734` / `#166534` (Distribute/Checkout action buttons), `#34d399` / `#22c55e` (success badges, reticles).
- **Neutral Backgrounds:** `#fafafa` (app background), `#fafaf8` (bottom nav backdrop), `#ffffff` (cards, sheets).
- **Typography:** Geist Sans / Inter (`font-sans`), Geist Mono (`font-mono`), Playfair Display (`font-serif`).
- **Text Tokens:** `#1a1f36` / `#111827` (bold headers), `#4f566b` / `#6b7280` (body), `#8792a2` / `#a3acb9` (muted captions/labels).

### 3.3 Inventory Category Tokens (`lib/constants.js`)

All 10 inventory categories have standardized colors, background pills, and Lucide icons:

| Category Value | Category Name | Icon | Style Tokens (`bg`, `border`, `text`) |
|---|---|---|---|
| `dry_goods` | Dry Goods | `Archive` | `bg-orange-50/50`, `border-orange-100`, `text-orange-700` |
| `frozen_food` | Frozen Food | `Snowflake` | `bg-cyan-50/50`, `border-cyan-100`, `text-cyan-700` |
| `produce` | Produce | `Carrot` | `bg-emerald-50/50`, `border-emerald-100`, `text-emerald-700` |
| `proteins` | Proteins | `Beef` | `bg-rose-50/50`, `border-rose-100`, `text-rose-700` |
| `bakery_snacks` | Bakery & Snacks | `Croissant` | `bg-yellow-50/50`, `border-yellow-100`, `text-yellow-700` |
| `canned_goods` | Canned Goods | `Cylinder` | `bg-stone-50/50`, `border-stone-100`, `text-stone-700` |
| `beverages` | Beverages | `GlassWater` | `bg-blue-50/50`, `border-blue-100`, `text-blue-700` |
| `dairy` | Dairy | `MilkIcon` | `bg-indigo-50/50`, `border-indigo-100`, `text-indigo-700` |
| `hygiene` | Hygiene | `Bubbles` | `bg-teal-50/50`, `border-teal-100`, `text-teal-700` |
| `other` | Other | `BookXIcon` | `bg-gray-50/50`, `border-gray-100`, `text-gray-700` |

---

## 4. Build, Test, and Tooling Infrastructure

### 4.1 Scripts in `package.json`

```json
{
  "name": "webverse",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev --turbopack",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "tailwind-init": "echo 'Tailwind CSS v4 is configured via @import in globals.css'"
  }
}
```

### 4.2 Build & Lint Verification

- **Language / Dialect:** JavaScript / JSX (React 19) with `jsconfig.json` configuring paths (`@/*` -> `./*`). A single TypeScript definitions file exists (`lib/database.types.ts`) for Supabase type reference, but the core runtime codebase is standard ES Modules / JSX.
- **Build Execution:** `npm run build` triggers `next build`, performing page bundling, route static/dynamic analysis, and React 19 JSX compilation.
- **Linting:** `npm run lint` triggers `next lint` using ESLint.
- **Test Runners:** There are currently **no pre-installed test runner packages** (e.g. Jest, Vitest, Playwright, Cypress) in `package.json`. Code quality verification relies on `next build`, ESLint, and manual/Agent-as-Judge structural reviews.

---

## 5. Architectural Blueprint for Mobile Checkout Flow (`components/pages/distribution`)

To satisfy **R1** (Cart-First Architecture), **R2** (Visual Grid & Quick Action Sheet), and **R3** (QA Agent-as-Judge verification) while strictly mirroring `components/pages/add-items`:

### 5.1 Component Structure Mapping

| Intake / Add Reference (`add-items/`) | Checkout / Removal Target (`distribution/`) | Responsibility |
|---|---|---|
| `add-item-view.jsx` | `index.jsx` (or `distribution-view.jsx`) | Device responsive switch (`useMediaQuery("(min-width: 768px)")`). Desktop -> `DistributionDesktopTable` + `CartSidebar`; Mobile -> `MobileDistributionFlow`. |
| `mobile-add-flow.jsx` | `mobile-distribution-flow.jsx` | Mobile state coordinator: `activeView` (`'CART' \| 'CAMERA' \| 'VISUAL_GRID'`), sheet state (`'CLOSED' \| 'ACTION_SHEET'`), staged cart state. |
| `mobile-cart-view.jsx` | `mobile-checkout-cart-view.jsx` | Default "Removal Cart" view: Empty state with Checkout Cart illustration & "How checkout works", staged item list with batch details, +/- quantity adjustment, "Checkout / Deduct" primary action button. |
| `scan-view.jsx` | `distribution-scan-view.jsx` (or inline) | Branching trigger for Barcode Scanner (`BarcodeScannerOverlay`) with continuous scan toast and manual/visual grid shortcut. |
| `mobile-manual-entry-view.jsx` | `distribution-visual-grid-sheet.jsx` ("No Barcode") | Searchable bottom sheet / view displaying local inventory grid grouped by product with active batch counts. |
| Fast Intake Popup (`mobile-add-flow.jsx:415-582`) | `quick-action-sheet.jsx` | Intercepts item selection/scan: Displays item card, forces explicit expiration batch selection if multiple batches exist, quantity stepper, and "Add to Checkout Cart" confirmation button. |

### 5.2 Key Layout & Overlap Rules
1. In `mobile-checkout-cart-view.jsx`, when cart is empty, the view stays inside the standard dashboard layout (`pb-[calc(90px+env(safe-area-inset-bottom))]`), keeping the persistent bottom navigation bar fully visible and functional.
2. When the camera scanner or a full modal sheet is open, render as `fixed inset-0 z-[9999]` with top and bottom safe-area insets (`pt-safe`, `pb-[calc(1rem+env(safe-area-inset-bottom))]`).
3. Maintain clean, neutral white styling (`#fafafa`, `#ffffff`, `border-gray-200`) while strictly swapping terminology:
   - "Add to Inventory" -> "Deduct from Inventory" / "Complete Checkout"
   - "Staged for intake" -> "Staged for distribution"
   - "Ready to add" -> "Checkout Cart"
   - Icons: Shopping Cart (`ShoppingCart`), Minus (`Minus`), Trash (`Trash2`), Boxes (`Boxes`).
