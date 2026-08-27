# Architectural Survey & UI Pattern Investigation: Add Items vs Distribution / Checkout

**Date:** 2026-08-21  
**Investigator:** Explorer 1 (Reference Architecture & UI Patterns)  
**Target Repository:** FoodArca (`migrate-supabase-realtime-inventory`)  
**Scope:** `components/pages/add-items/`, `components/pages/distribution/`, app layout, routing, state managers, hooks, styling tokens, and API endpoints.

---

## Table of Contents
1. [Executive Summary](#1-executive-summary)
2. [High-Level Routing & Layout Architecture](#2-high-level-routing--layout-architecture)
3. [Deep-Dive Analysis: "Add Items" Architecture](#3-deep-dive-analysis-add-items-architecture)
   - 3.1 [Component Tree & Responsibility Breakdown](#31-component-tree--responsibility-breakdown)
   - 3.2 [Mobile Add Flow Router (`mobile-add-flow.jsx`)](#32-mobile-add-flow-router-mobile-add-flowjsx)
   - 3.3 [Mobile Cart View (`mobile-cart-view.jsx`)](#33-mobile-cart-view-mobile-cart-viewjsx)
   - 3.4 [Barcode Scanner & Camera Overlay (`BarcodeScannerOverlay.jsx`)](#34-barcode-scanner--camera-overlay-barcodescanneroverlayjsx)
   - 3.5 [Fast Intake Sheet / Confirmation Popup](#35-fast-intake-sheet--confirmation-popup)
   - 3.6 [Manual Entry Multi-Step Flow (`mobile-manual-entry-view.jsx`)](#36-manual-entry-multi-step-flow-mobile-manual-entry-viewjsx)
   - 3.7 [Desktop Add View (`desktop-add-view.jsx`)](#37-desktop-add-view-desktop-add-viewjsx)
4. [Current State Analysis: "Distribution / Remove Items"](#4-current-state-analysis-distribution--remove-items)
   - 4.1 [Existing Components in `components/pages/distribution/`](#41-existing-components-in-componentspagesdistribution)
   - 4.2 [Identified Gaps & Divergences from Mobile-Add-Flow](#42-identified-gaps--divergences-from-mobile-add-flow)
5. [State Management, Persistence & Data Flow](#5-state-management-persistence--data-flow)
   - 5.1 [Cart Lifecycle & Staged List Mechanics](#51-cart-lifecycle--staged-list-mechanics)
   - 5.2 [Batch Selection & FEFO Deduction Logic](#52-batch-selection--fefo-deduction-logic)
   - 5.3 [API Contracts: Ingest vs Distribution](#53-api-contracts-ingest-vs-distribution)
6. [Design System, Styling Tokens & Responsive Rules](#6-design-system-styling-tokens--responsive-rules)
   - 6.1 [Color Palette & Neutral Theme Hierarchy](#61-color-palette--neutral-theme-hierarchy)
   - 6.2 [Typography, Radius & Sizing](#62-typography-radius--sizing)
   - 6.3 [BottomNav Accommodation & Safe Areas](#63-bottomnav-accommodation--safe-areas)
   - 6.4 [Framer Motion Animation Tokens](#64-framer-motion-animation-tokens)
7. [Terminology & Iconography Mapping (Add vs Checkout)](#7-terminology--iconography-mapping-add-vs-checkout)
8. [Blueprint for Checkout / Distribution Refactor](#8-blueprint-for-checkout--distribution-refactor)

---

## 1. Executive Summary

FoodArca's intake flow (`components/pages/add-items`) represents a refined, mobile-first, **Cart-First** architecture. The default mobile view is the Cart itself, from which operators seamlessly transition into a continuous camera barcode scanner or a manual entry workflow, stage items into a locally persistent batch (`sessionStorage`), edit or adjust quantities, and commit the batch to Supabase in a single transactional or bulk call.

In contrast, the current distribution flow (`components/pages/distribution`) has a split desktop/mobile implementation where the mobile list (`distribution-mobile-list.jsx`) is a hybrid search-and-cart list with a bottom drawer (`cart-drawer.jsx`) and a standalone scanner overlay (`continuous-scanner.jsx`). It lacks the streamlined Cart-first hub, the visual search grid ("No Barcode" bottom sheet), and the critical **Quick Action Sheet** needed to enforce explicit expiration batch selection when checking out items with multiple active inventory batches.

To fulfill requirements **R1** (Cart-First Architecture), **R2** (Visual Grid & Quick Action Sheet), and **R3** (QA Verification), the distribution module must be refactored into a dedicated mobile architecture mirroring `mobile-add-flow.jsx` and `mobile-cart-view.jsx`, while maintaining the clean white/neutral design tokens and substituting ingestion terminology/icons with dedicated checkout/removal terminology and iconography.

---

## 2. High-Level Routing & Layout Architecture

### 2.1 View Routing
The main application shell lives in `app/dashboard/client-page.jsx` and uses window hash navigation (`#Dashboard`, `#Add Items`, `#Remove Items`, `#View Inventory`, `#Recent Changes`, `#Settings`).

```
DashboardClientApp (app/dashboard/client-page.jsx)
 ├── DashboardLayout (components/layout/dashboard-layout.jsx)
 │    ├── Sidebar (Desktop, hidden md:block)
 │    ├── TopBar (Hidden on mobile when activeView === 'Add Items')
 │    ├── <main> (Scrollable viewport, pb-[calc(90px+env(safe-area-inset-bottom))] md:pb-6)
 │    └── BottomNav (Mobile navigation bar, fixed bottom-0, z-[100])
 └── Active View Component:
      ├── 'Add Items'   -> <AddItemView /> (components/pages/add-items/add-item-view.jsx)
      └── 'Remove Items' -> <DistributionModule /> (components/pages/distribution/index.jsx)
```

### 2.2 Responsive Device Splitting
`components/pages/add-items/add-item-view.jsx` uses a custom `useMediaQuery("(min-width: 768px)")` hook with dynamic imports (`{ ssr: false }`) to cleanly branch into:
- **Desktop (`>= 768px`)**: `<DesktopAddView />` (split-pane intake form + staged batch drawer)
- **Mobile (`< 768px`)**: `<MobileAddFlow />` (full-screen mobile state machine)

`components/pages/distribution/index.jsx` currently renders both `<DistributionDesktopTable />` (with Tailwind `hidden md:block`) and `<DistributionMobileList />` (with `md:hidden`) side-by-side in JSX, alongside a desktop `<CartSidebar />` and mobile `<CartDrawer />`.

---

## 3. Deep-Dive Analysis: "Add Items" Architecture

### 3.1 Component Tree & Responsibility Breakdown

```
components/pages/add-items/
├── add-item-view.jsx              # Responsive coordinator (Device detector)
├── mobile-add-flow.jsx            # Mobile Router & State Coordinator (CART, CAMERA, MANUAL_ENTRY)
├── mobile-cart-view.jsx           # Mobile Default Cart View, Staged List, Action Buttons & Modals
├── mobile-manual-entry-view.jsx   # 3-Step Wizard with 0ms Autocomplete Dictionary
├── desktop-add-view.jsx           # Desktop single-screen power-intake layout + guide modal
├── add-item-modal.jsx             # Alternative modal intake form
├── form-view.jsx                  # iOS settings-style linear form layout
├── scan-view.jsx                  # Scan / Manual landing menu with recent activity logs
└── sucess-view.jsx                # Success confirmation card with 7s auto-dismiss timer
```

---

### 3.2 Mobile Add Flow Router (`mobile-add-flow.jsx`)

`MobileAddFlow` manages the top-level mobile state machine.

#### State Machine Definition:
1. **`activeView`**: `'CART'` (default) | `'CAMERA'` | `'MANUAL_ENTRY'`
2. **`sheetState`**: `'CLOSED'` (default) | `'KNOWN'` (Fast Intake popup over camera)
3. **`cartItems`**: Array of staged food items, persisted to `sessionStorage` key `'foodarca_staged_batch'`.
4. **`scannedItem`**: Current item object being inspected or edited.
5. **`toastMessage`**: Floating toast notification `{ title: string, count: number }` shown after adding an item.
6. **`pendingScansRef`**: `useRef(new Set())` preventing concurrent duplicate API calls for the same barcode.
7. **`lastScanRef`**: `useRef({ code: null, time: 0 })` debouncing identical barcodes within 1500ms.

#### View Hierarchy in `mobile-add-flow.jsx`:

```jsx
// Active View: 'CART'
<MobileCartView
  cartItems={cartItems}
  setCartItems={setCartItems}
  pantryId={pantryId}
  onBack={(viewName) => { ... }}
  onEdit={(item) => openManualEntry(item, 'CART')}
/>

// Active View: 'MANUAL_ENTRY'
<MobileManualEntryView
  onBack={() => setActiveView(manualEntryReturnView)}
  initialItem={scannedItem}
  pantryId={pantryId}
  onSave={(updatedItem) => { ... }}
/>

// Active View: 'CAMERA'
<div className="fixed inset-0 z-[9999] flex flex-col w-full h-[100dvh] bg-black overflow-hidden">
  <BarcodeScannerOverlay onScan={handleScan} isPaused={false} ... />
  
  {/* Top Controls: Back to Cart Button + Manual Entry Button */}
  <div className="absolute top-0 inset-x-0 p-4 pt-safe z-40 flex justify-between">
    <Button onClick={() => setActiveView('CART')}>ChevronLeft</Button>
    <Button onClick={handleManualEntry}>Keyboard Manual</Button>
  </div>

  {/* Floating Toast Flash */}
  <AnimatePresence>{toastMessage && <Toast />}</AnimatePresence>

  {/* Mini-Cart Bottom Bar */}
  <div className="absolute bottom-0 inset-x-0 bg-white h-[76px] px-6 ...">
    <ShoppingBag /> {cartItems.length} items staged
    <Button onClick={() => setActiveView('CART')}>View Cart</Button>
  </div>

  {/* Fast Intake Popup (SheetState === 'KNOWN') */}
  <AnimatePresence>
    {sheetState === 'KNOWN' && <KnownItemPopup />}
  </AnimatePresence>
</div>
```

---

### 3.3 Mobile Cart View (`mobile-cart-view.jsx`)

`MobileCartView` serves as the home base and default screen of the intake experience.

#### Key Layout Behaviors:
1. **Dynamic Viewport Height**:
   - When cart is empty: `flex-1 w-full relative bg-white flex flex-col min-h-full` (allows the standard dashboard BottomNav to remain visible).
   - When items exist: `fixed inset-0 z-[9999] w-full h-[100dvh] bg-white flex flex-col` (locks to full screen, presenting the sticky checkout footer).
2. **Empty Cart State**:
   - Centered illustration with double soft concentric rings (`w-36 h-36 rounded-full border-2 border-dashed border-gray-200` + inner `w-24 h-24 rounded-full bg-orange-50`).
   - Icon: `<ShoppingBag className="w-10 h-10 text-[#d97757]" />`.
   - Title: `"Your cart is empty"` (`text-[20px] font-semibold text-[#1a1f36]`).
   - Subtitle: `"Scan a barcode or type in an item to get started."` (`text-gray-400 text-[15px]`).
   - Action link: `"How it works →"` opening portal bottom sheet.
3. **Staged Items List**:
   - Card styling: `bg-white border-2 border-gray-200 rounded-2xl p-3 flex gap-3 items-center`.
   - Visual: 56x56 thumbnail photo or category-themed icon block (`rounded-2xl border-2 ${catVisual.style.border} ${catVisual.style.bg}`).
   - Text metadata: Title (`font-semibold text-[#1a1f36] text-[15px]`), Category & formatted expiration (`text-[12px] font-medium text-gray-500`).
   - Actions: `Edit` (opens manual entry with existing item data) and `Remove` (`removeFromBatch`).
   - Stepper: `bg-white border-2 border-gray-200 rounded-xl h-12` with `<Minus />`, number display, `<Plus />`, and optional unit badge.
   - Batch footer: `"Empty cart"` button triggering confirmation modal.
4. **Floating Action Buttons (FABs)**:
   - Positioned `absolute right-4 z-40`:
     - Empty cart: `bottom-[calc(42px+env(safe-area-inset-bottom))]`
     - Populated cart: `bottom-[calc(120px+env(safe-area-inset-bottom))]`
   - Secondary FAB: `w-14 h-14 rounded-full bg-white text-[#1a1f36] border border-gray-200` with `<Keyboard className="w-6 h-6" />`.
   - Primary FAB: `w-14 h-14 rounded-full bg-[#d97757] text-white shadow-lg` with `<Scan className="w-6 h-6" />`.
5. **Sticky Submission Footer**:
   - Fixed at bottom: `fixed bottom-0 left-0 right-0 z-[10000] bg-white px-6 pt-3 pb-[calc(1rem+env(safe-area-inset-bottom))]`.
   - Button: `h-[56px] rounded-2xl text-[16px] font-bold bg-[#d97757] text-white`.
   - States: Idle (`ShoppingBag` icon + "Add to inventory"), Loading (`Loader2` spinner + "Submitting…"), Success (`CheckCircle2` + "Batch successfully added!").
6. **Modal Dialogs (Radix / Portal)**:
   - `showClearConfirm`: Bottom sheet confirmation to empty cart.
   - `showSubmitConfirm`: Bottom sheet confirmation summarizing total items before committing.
   - `showHowItWorks`: Step-by-step visual onboarding guide.

---

### 3.4 Barcode Scanner & Camera Overlay (`BarcodeScannerOverlay.jsx`)

Dual-engine barcode detection architecture:
1. **Engine A (High Speed GPU Native)**: `window.BarcodeDetector` on Chrome / Android for 60fps zero-overhead tracking with animated green bounding box reticle (`#22c55e`).
2. **Engine B (ZXing BrowserMultiFormatReader)**: WebAssembly / JS fallback for iOS Safari and older browsers.
3. **HUD & Target**: Center crosshair target with white corner indicators, vignette mask (`radial-gradient`), haptic feedback (`navigator.vibrate(60)`), and lock-on tracking.

---

### 3.5 Fast Intake Sheet / Confirmation Popup

When a scanned barcode is recognized via `/api/barcode/${code}`, `mobile-add-flow.jsx` opens a bottom popup without leaving the camera feed:
- Position: `absolute bottom-[calc(76px+12px+env(safe-area-inset-bottom))] inset-x-4 z-50 bg-white rounded-[24px] shadow-2xl border border-gray-100`.
- Header: Item thumbnail, product name, category badge.
- Row 1: Quantity stepper (`- [numeric input] +`) + Radix DropdownMenu for units (`DropdownMenuContent z-[10050]`).
- Row 2: Date input overlay with formatted display (`MMM d, yyyy`), transparent native date picker, and reset `<X />` button.
- CTA: `"Add to Batch"` (`bg-[#d97757] text-white h-[50px] rounded-2xl`).

---

### 3.6 Manual Entry Multi-Step Flow (`mobile-manual-entry-view.jsx`)

A full-screen 3-step intake wizard:
- **Step 1: Identify** — Product name with 0ms instant autocomplete dictionary (`/api/foods/dictionary`), category selector dropdown, image preview.
- **Step 2: Quantify** — Quantity stepper, unit selector, items per pack preset selector (`none`, `3`, `6`, `8`, `12`, `24`, `36`, `48`, `custom`), per-unit weight with unit switch (`lbs`, `oz`, `fl_oz`, `kg`, `g`, `ml`, `l`, `gal`).
- **Step 3: Details** — Expiration date picker, source type (`donation`, `retail_rescue`, `purchased`, `usda`), donor name.
- **Top Header**: Step progress indicator bar (`h-1 bg-[#d97757]` animated from 33% to 100%), Back/Close button.
- **Bottom CTA**: Pinned sticky pill button (`h-[60px] rounded-full bg-[#d97757] text-white font-extrabold uppercase`).

---

### 3.7 Desktop Add View (`desktop-add-view.jsx`)

The desktop intake powerhouse features:
- **Split Layout**: Form inputs on the left, live Staged Batch Table on the right.
- **Real-Time Live Weight Calculation**: Formula translating packaging units, pack sizes, and unit weights into total estimated batch weight.
- **Smart Memory Lookup**: Instant restoration of prior pantry preferences for repeated UPCs.
- **Intake Guide Modal (`IntakeGuideModal`)**: 7-step guide, weight modes (By Count vs By Weight), pack size guide, barcode tips, expiration precision, acquisition sources.

---

## 4. Current State Analysis: "Distribution / Remove Items"

### 4.1 Existing Components in `components/pages/distribution/`

| File | Purpose | Current Implementation Details |
|---|---|---|
| `index.jsx` | Main distribution controller | Fetches inventory from `/api/foods`, handles smart add, renders desktop table + mobile list, cart sidebar, cart drawer, checkout modal. |
| `distribution-mobile-list.jsx` | Current mobile view | Top search bar with Scan button + autocomplete dropdown; below shows cart items. If cart empty: shows static "Cart is Empty" placeholder with "Tap to Scan". |
| `distribution-desktop-table.jsx` | Desktop table view | Sortable columns (Item, Expiration, Available Stock, Distribute Qty with inline stepper). Category & status filters. |
| `continuous-scanner.jsx` | Scanner view | Wraps `BarcodeScannerOverlay` with toast notification and custom reticle. |
| `cart-drawer.jsx` | Mobile cart drawer | Slide-up Radix Sheet listing cart items with steppers and Checkout CTA. |
| `cart-sidebar.jsx` | Desktop cart sidebar | Pinned right-hand sidebar showing cart summary, inline number inputs, "Distribute Items" CTA. |
| `checkout-modal.jsx` | Checkout dialog | Fast mode switch, client search, submits to `POST /api/client-distributions`. |

---

### 4.2 Identified Gaps & Divergences from Mobile-Add-Flow

1. **Not Cart-First on Mobile**:
   - `distribution-mobile-list.jsx` mixes search bar, autocomplete, and cart list in a single scroll container rather than providing a dedicated, clean Cart Hub like `mobile-cart-view.jsx`.
2. **Missing "No Barcode" Visual Grid Bottom Sheet**:
   - When an operator does not have a barcode scanner (or has unbarcoded bulk items), they need a visual grid bottom sheet of pantry inventory items with search and category filtering. Currently, there is only a text autocomplete dropdown.
3. **Missing "Quick Action Sheet" (Batch Selection Enforcement)**:
   - When adding an item from the visual grid or camera scan, if that item exists in multiple expiration batches (e.g. 5 units expiring in 2 days, 20 units expiring in 30 days), the current mobile flow auto-picks the first batch or increments blindly without presenting an explicit batch selection modal.
   - The user must be able to see all available expiration batches for the product, pick which batch to deduct from (with FEFO highlighted), select quantity (up to available stock), and stage it.
4. **Visual & Iconographic Inconsistencies**:
   - Add items uses terracotta `#d97757`, ShoppingBag icons, and "Add to inventory" phrasing.
   - Distribution in various places uses green `#154734` / `#166534` or orange `#d97757` inconsistently.
   - Requirements specify maintaining the **clean, white/neutral styling** of Add Items, while using **Checkout/Removal terminology** ("Checkout Cart", "Deduct", "Distribute") and **Removal/Cart iconography** (`MinusSquare`, `ShoppingCart`, `Minus`).

---

## 5. State Management, Persistence & Data Flow

### 5.1 Cart Lifecycle & Staged List Mechanics

| Action | Add Items Flow | Distribution / Checkout Flow |
|---|---|---|
| **Staged Item ID** | Random UUID (`${Date.now()}-${random}`) | Must reference specific `batch.id` or `catalogItemId` |
| **Persistence** | `sessionStorage.foodarca_staged_batch` | In-memory `cart` or `sessionStorage.foodarca_distribution_cart` |
| **Quantity Validation** | Unconstrained positive integer | **Clamped** to `0 <= quantity <= availableBatchStock` |
| **Batch Selection** | Creates new batch / expiration date | Selects from existing inventory batches in database |
| **Removal** | Filter out item ID from staged array | Filter out batch ID from staged cart |
| **Finalization Endpoint** | `POST /api/foods/bulk` | `POST /api/client-distributions` (calls `scan_out_item` RPC) |

---

### 5.2 Batch Selection & FEFO Deduction Logic

In inventory management, **FEFO** (First Expired, First Out) ensures perishable goods approaching expiration are distributed first.

When an item is tapped in the Visual Grid or scanned via Barcode:
1. Lookup all active batches for that item (`catalog_item_id` or barcode).
2. If only **1 batch** exists:
   - Quick Action Sheet displays product info, single batch expiration date, available stock, and a quantity stepper (default: 1, max: batch stock).
3. If **multiple batches** exist:
   - Quick Action Sheet presents a **Batch Selector** list.
   - Each batch card shows: Expiration date, days remaining badge (e.g. "Expiring in 3 days"), available stock count, and a recommended **"FEFO Recommended"** badge on the earliest expiring batch.
   - User taps a batch to select it, sets quantity, and taps "Deduct to Cart".

---

### 5.3 API Contracts: Ingest vs Distribution

#### Ingest (`POST /api/foods/bulk`):
```json
{
  "items": [
    {
      "barcode": "011110038334",
      "name": "Campbells Tomato Soup",
      "category": "canned_goods",
      "quantity": "12",
      "unit": "cans",
      "weightPerUnit": "0.75",
      "expirationDate": "2026-11-30",
      "expirationPrecision": "day",
      "sourceType": "donation"
    }
  ]
}
```

#### Distribution (`POST /api/client-distributions`):
```json
{
  "cart": [
    {
      "itemId": "uuid-batch-id-1234",
      "catalogItemId": "uuid-catalog-id-5678",
      "itemName": "Campbells Tomato Soup",
      "category": "Canned Goods",
      "quantityDistributed": 2,
      "unit": "cans",
      "reason": "distribution-regular"
    }
  ],
  "clientName": "Walk-in",
  "clientId": "SYS",
  "isNewClient": false
}
```
*Note:* The backend `/api/client-distributions` route resolves `catalogItemId` and executes the database RPC `scan_out_item(p_catalog_item_id, p_location_id, p_quantity)` which handles atomic row locking, FEFO deduction across batches, and activity logging.

---

## 6. Design System, Styling Tokens & Responsive Rules

### 6.1 Color Palette & Neutral Theme Hierarchy

| Token | Hex / Class | Used For |
|---|---|---|
| **Canvas Background** | `#fafafa` | Page background, root wrapper |
| **Card / Sheet Surface** | `#ffffff` | Cart items, bottom sheets, modals, popups |
| **Subtle Neutral Surface** | `#f8fafb` / `#f4f4f6` / `gray-50` | Input backgrounds, dropdowns, table headers |
| **Card Borders** | `border-gray-200` (`#e5e7eb`), `border-gray-100` (`#f1f5f9`) | Item cards, popups, inputs |
| **Primary Text** | `#1a1f36` / `text-gray-900` | Headings, item titles, primary labels |
| **Secondary Text** | `#4f566b` / `#697386` / `text-gray-500` | Categories, counts, instructions |
| **Muted Text / Icons** | `#8792a2` / `#a3acb9` / `text-gray-400` | Subtitles, placeholders, chevrons |
| **Primary Action Tint** | `#d97757` (Terracotta) | Primary CTA buttons, FABs, active highlights |
| **Action Active / Hover** | `#c06245` / `#c66547` | Pressed state for buttons |
| **Action Soft Background** | `#fff0eb` | Active badges, selected dropdown items |
| **Danger / Remove** | `#ef4444` / `text-rose-500` / `bg-rose-500` | Trash buttons, empty cart modal CTA |
| **Success / Verification** | `#059669` / `#22c55e` / `emerald-500` | Checkmarks, successful scan toast, lock-on reticle |
| **Expiring Status** | `amber-400` / `yellow-500` | Expiring batch indicators |

---

### 6.2 Typography, Radius & Sizing

- **Font Family**: Inter / Geist Sans (`font-sans`)
- **Corner Radii**:
  - Item Cards: `rounded-2xl` (16px) or `rounded-[20px]`
  - Bottom Sheets & Popups: `rounded-t-3xl` (24px) / `rounded-[24px]`
  - Buttons / Inputs: `rounded-xl` (12px) or `rounded-2xl` (16px)
  - Steppers / Badges: `rounded-xl` (12px) / `rounded-full`
- **Touch Target Heights**:
  - Stepper buttons: `w-11 h-12` or `w-14 h-[56px]`
  - Action buttons: `h-[50px]`, `h-14` (56px), `h-[60px]`
  - Inputs: `h-11` (44px) to `h-[56px]` (56px)

---

### 6.3 BottomNav Accommodation & Safe Areas

The application features a fixed bottom navigation bar on mobile:
- **BottomNav Spec**: `fixed bottom-0 left-0 right-0 z-[100] bg-[#fafaf8]/90 backdrop-blur-2xl border-t border-gray-200/50 pb-[calc(10px+env(safe-area-inset-bottom))]` (effective height ~64px + safe area).
- **Layout Padding Rule**:
  - Standard scroll views must use `pb-[calc(90px+env(safe-area-inset-bottom))]`.
  - Full-screen modal flows (`fixed inset-0 z-[9999] h-[100dvh]`) overlay the BottomNav and use `pb-[calc(1.5rem+env(safe-area-inset-bottom))]` on their own sticky footers.
- **Top Safe Area**: `pt-safe` or `pt-[max(env(safe-area-inset-top),16px)]`.

---

### 6.4 Framer Motion Animation Tokens

```jsx
// Screen Transition (Slide from right)
const screenVariants = {
  initial: { x: "100%" },
  animate: { x: 0 },
  exit: { x: "100%" },
  transition: { type: "spring", damping: 25, stiffness: 200 }
};

// Bottom Sheet / Popup Spring
const sheetVariants = {
  initial: { y: "100%", opacity: 0 },
  animate: { y: 0, opacity: 1 },
  exit: { y: "100%", opacity: 0 },
  transition: { type: "spring", damping: 28, stiffness: 300 }
};

// Toast Flash
const toastVariants = {
  initial: { opacity: 0, y: 20, scale: 0.95 },
  animate: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, y: 20, scale: 0.95 }
};
```

---

## 7. Terminology & Iconography Mapping (Add vs Checkout)

To preserve the clean white/neutral visual harmony while clearly distinguishing the Checkout / Removal mode, the following terminology and iconography mappings are established:

| UI Element | Add Items Flow (Ingestion) | Checkout / Removal Flow (Distribution) |
|---|---|---|
| **Module Title** | Add Items | Checkout / Remove Items |
| **Top Navigation Label** | Add | Remove / Checkout |
| **Bottom Nav Tab** | `Add` (`Plus`, `#d97757`) | `Remove` (`MinusSquare`, neutral active) |
| **Cart Screen Header** | `Ready to add` / `Add items` | `Checkout Cart` / `Ready to checkout` |
| **Empty Cart Illustration** | `ShoppingBag` in orange circle | `ShoppingCart` with minus badge in neutral/warm circle |
| **Empty Cart Title** | `Your cart is empty` | `Checkout cart is empty` |
| **Empty Cart Subtitle** | `Scan a barcode or type in an item to get started.` | `Scan a barcode or browse inventory to deduct items.` |
| **Staged List Header / Count** | `X items staged` · `Ready for intake` | `X items staged` · `Ready to deduct` |
| **Secondary FAB** | `Keyboard` (Manual Entry) | `Grid` / `LayoutGrid` (No Barcode Visual Grid) |
| **Primary FAB** | `Scan` (`#d97757`) | `Scan` (`#d97757` or neutral dark with `Minus` badge) |
| **Item Card Stepper** | `+` (Increment) / `-` (Decrement) | `+` (Deduct more) / `-` (Reduce deduction) |
| **Quantity Label** | `Quantity` / `Counted as` | `Quantity to Deduct` / `Available: X` |
| **Popup / Sheet Title** | `Item Found` · `Add to Batch` | `Item Selected` · `Deduct from Inventory` |
| **Batch Selection Header** | *N/A (single entry)* | `Select Expiration Batch` (FEFO indicator) |
| **Main Checkout Button** | `Add to inventory` (`ShoppingBag`) | `Complete Checkout` / `Deduct Items` (`ShoppingCart` / `CheckCircle2`) |
| **Success Flash Toast** | `Added {itemName}` · `Open Cart` | `Deducted {itemName}` · `Open Cart` |
| **Clear Cart Dialog** | `Empty your cart?` · `Empty cart` | `Clear checkout cart?` · `Clear cart` |
| **Confirmation Modal** | `Add to inventory?` | `Confirm checkout?` (Deducts stock from live inventory) |

---

## 8. Blueprint for Checkout / Distribution Refactor

To implement the target architecture in `components/pages/distribution/`:

1. **Root Controller (`components/pages/distribution/index.jsx`)**:
   - Maintain `isDesktop ? <DistributionDesktopTable /> : <MobileDistributionFlow />`.
2. **Mobile Flow Orchestrator (`mobile-distribution-flow.jsx`)**:
   - State: `activeView` (`'CART'`, `'CAMERA'`, `'VISUAL_GRID'`), `quickActionItem` (item queued for batch selection), `cartItems` (staged deductions).
   - Scanner subview: `BarcodeScannerOverlay` with instant lookup against live pantry inventory; triggers Quick Action Sheet upon scan.
3. **Mobile Checkout Cart (`mobile-checkout-cart-view.jsx`)**:
   - Reuses the layout and animations of `mobile-cart-view.jsx`.
   - Displays empty cart state with `ShoppingCart` iconography and "How checkout works" guide.
   - FABs: Visual Grid button (`LayoutGrid` icon) and Barcode Scanner (`Scan` icon).
   - Sticky footer: "Complete Checkout" button triggering final confirmation dialog.
4. **Visual Search Grid Sheet ("No Barcode" Bottom Sheet)**:
   - Search bar + Category pills filter.
   - Responsive 2-column card grid of inventory items with photo, category badge, total available stock, and next expiration date.
   - Tapping an item opens the **Quick Action Sheet**.
5. **Quick Action Sheet (Batch & Quantity Selector)**:
   - Intercepts both camera scans and visual grid selections.
   - Displays item header (name, category, total stock).
   - Renders expiration batches list sorted by FEFO (earliest expiration first).
   - Highlights earliest batch with "FEFO Recommended".
   - Quantity stepper clamped to selected batch stock.
   - "Stage Deduction" CTA adding `{ batchId, catalogItemId, name, quantity, unit, expirationDate }` to checkout cart.

---
*Report generated and validated for Explorer 1 handoff.*
