# Project: Mobile-First Checkout / Remove Items Flow

## Architecture & Data Flow

### 1. View & Routing Architecture
- `components/pages/distribution/index.jsx`: Root coordinator for the Distribution page. Uses `useMediaQuery("(min-width: 768px)")` to mount `DistributionDesktopTable` on desktop (md+) and `MobileDistributionFlow` on mobile (<md).
- `components/pages/distribution/mobile-distribution-flow.jsx`: Mobile state machine orchestrating subviews:
  - `activeView`: `'CART'` (default hub), `'CAMERA'` (continuous scanner overlay), `'VISUAL_GRID'` (No Barcode search sheet).
  - `sheetState`: `'CLOSED' | 'QUICK_ACTION'`.
  - `quickActionItem`: Currently selected item object with its grouped active batches.
  - `cart`: Staged removal cart items array persisted in `sessionStorage` (`foodarca_staged_distribution_cart`).

### 2. Component Hierarchy
```
components/pages/distribution/
├── index.jsx                             # Device detection & root coordinator (DONE)
├── mobile-distribution-flow.jsx          # Mobile state machine & view router (DONE)
├── mobile-checkout-cart-view.jsx         # Cart-first default hub (Empty & Staged states, FABs, sticky checkout footer) (DONE)
├── no-barcode-visual-grid-sheet.jsx      # "No Barcode" bottom sheet (search bar, category chips, 2-column inventory grid) (DONE)
├── quick-action-sheet.jsx                # Quick Action Sheet enforcing explicit expiration batch selection & quantity (DONE)
├── checkout-modal.jsx                    # Final distribution confirmation modal (calls POST /api/client-distributions) (DONE)
├── cart-drawer.jsx                       # Slide-up cart drawer (for desktop/tablet or secondary access)
└── distribution-desktop-table.jsx        # Desktop inventory distribution table
```

### 3. Data Flow & State Management
- **Pantry Inventory**: Queried from `GET /api/foods` (flat batch records) and grouped by `catalogItemId` or `barcode` client-side via `groupInventoryByProduct`. Realtime updates via `PantryProvider` (`lastInventoryUpdate`).
- **Batch Grouping & FEFO Sorting**: For each catalog item, active inventory batches (`inventory_batches`) are grouped and sorted by `expiration_date` ascending (FEFO).
- **Cart Staging**: Cart items stage `{ id, batchId, catalogItemId, name, category, unit, quantity, expirationDate, availableBatchStock, photoUrl }` synced to `sessionStorage` (`foodarca_staged_distribution_cart`).
- **Checkout Execution**: Cart is submitted to `POST /api/client-distributions` which invokes Supabase RPC `scan_out_item`, deducting stock and writing to `activity_logs`.

---

## Feature Inventory

| # | Feature | Description | Milestone | Status | Source |
|---|---------|-------------|-----------|:------:|--------|
| 1 | Device Responsive Coordinator | Route dynamically between Desktop Table and Mobile Flow using `useMediaQuery` (`768px`) | M1 | **DONE** | ORIGINAL_REQUEST §R1 |
| 2 | Cart-First Default Hub | Mobile view defaults to "Checkout Cart" (`activeView === 'CART'`) with empty state illustration and dual FABs | M1 | **DONE** | ORIGINAL_REQUEST §R1 |
| 3 | Neutral Styling & Terminology | Clean white/neutral styling with Checkout terminology ("Checkout Cart", "Deduct", "Checkout") and icons (`MinusSquare`, `ShoppingCart`, `Minus`) | M1 | **DONE** | ORIGINAL_REQUEST §R1 |
| 4 | Removal Cart Staging & Persistence | Display staged deduction cards with quantity increment/decrement, remove, clear cart, and `sessionStorage` sync | M1 | **DONE** | ORIGINAL_REQUEST §R1 |
| 5 | Bottom Nav Accommodations | Ensure layout, FABs, empty state, and footer accommodate persistent bottom nav (`pb-[calc(90px+env(safe-area-inset-bottom))]`) | M1 | **DONE** | ORIGINAL_REQUEST §R1, Acceptance Criteria |
| 6 | "No Barcode" Visual Grid Sheet | Slide-up bottom sheet with search input, category filters, and 2-column local inventory grid | M2 | **DONE** | ORIGINAL_REQUEST §R2 |
| 7 | Inventory Batch Grouping | Client-side grouping of flat batch data into product cards with aggregated stock and active batch lists | M2 | **DONE** | ORIGINAL_REQUEST §R2 |
| 8 | Quick Action Sheet Interception | Intercept item selection (from Visual Grid or Barcode Scanner) with Quick Action Sheet | M2 | **DONE** | ORIGINAL_REQUEST §R2 |
| 9 | Explicit Batch Selection Enforcement | When product has multiple expiration batches, require explicit batch selection (FEFO tags & stock) before staging | M2 | **DONE** | ORIGINAL_REQUEST §R2, Acceptance Criteria |
| 10 | Quantity Clamping & Validation | Allow setting deduction quantity between 1 and available batch stock (minus already staged amount) | M2 | **DONE** | ORIGINAL_REQUEST §R2 |
| 11 | Barcode Scanner Branching | Integrated `BarcodeScannerOverlay` with 1500ms debounce and in-flight guard triggering Quick Action Sheet | M3 | **DONE** | ORIGINAL_REQUEST §R1, §R2 |
| 12 | Checkout Execution & Confirmation | Modal/footer triggering `POST /api/client-distributions` with proper error handling, toasts, and cart clearing | M3 | **DONE** | ORIGINAL_REQUEST §R1 |
| 13 | TopBar/Layout Immersion Handling | Consistent top bar / header handling on mobile for Remove Items | M3 | **DONE** | ORIGINAL_REQUEST §R1 |
| 14 | Rigorous QA Agent-as-Judge Verification | Independent review verifying 100% UI/UX parity against `components/pages/add-items`, terminology, and batch selection | M4 | **DONE** | ORIGINAL_REQUEST §R3 |
| 15 | End-to-End Test Suite Validation | Opaque-box and component test verification covering all 5 tiers | M4 | **DONE** | Acceptance Criteria |

---

## Milestones

| # | Name | Scope | Dependencies | Status | Key Outputs |
|---|------|-------|-------------|:------:|-------------|
| M1 | Core Cart Hub & Mobile Routing | Implement `index.jsx`, `mobile-distribution-flow.jsx`, and `mobile-checkout-cart-view.jsx` with cart-first routing, empty state, staged list, FABs, terminology/icons, and bottom-nav padding | none | **DONE** | `index.jsx`, `mobile-distribution-flow.jsx`, `mobile-checkout-cart-view.jsx` |
| M2 | Visual Grid & Quick Action Sheet | Implement `no-barcode-visual-grid-sheet.jsx` and `quick-action-sheet.jsx` with batch grouping, explicit multi-expiration batch picker, quantity steppers, and staging | M1 | **DONE** | `no-barcode-visual-grid-sheet.jsx`, `quick-action-sheet.jsx` |
| M3 | Scanner Branching & Checkout Submission | Integrate `BarcodeScannerOverlay` into mobile flow, implement `checkout-modal.jsx`, wire `POST /api/client-distributions`, and polish layout/bottom nav spacing | M1, M2 | **DONE** | `mobile-distribution-flow.jsx`, `checkout-modal.jsx`, `dashboard-layout.jsx` |
| M4 | Final QA Verification & Forensic Audit | Run independent Reviewers (2), Challengers (2), and Forensic Auditor (1) to verify 100% UI/UX parity with `add-items`, batch selection enforcement, and full build integrity | M3 | **DONE** | `TEST_READY.md`, `GATE_STATUS.md` (Gate: **PASS**) |

---

## Interface Contracts

### 1. `MobileDistributionFlow` Props
```typescript
interface MobileDistributionFlowProps {
  initialItems?: InventoryItem[]; // Raw flat batch records from /api/foods
  onCheckoutSuccess?: () => void;
}
```

### 2. Cart Item Staging Data Model
```typescript
interface StagedCartItem {
  id: string; // Unique cart line ID (e.g. `${catalogItemId}-${batchId}`)
  batchId: string; // ID of the specific inventory_batches record
  catalogItemId: string; // ID of the catalog_items master record
  name: string;
  category: string;
  unit: string;
  quantity: number; // Staged deduction quantity (1 <= qty <= availableBatchStock)
  expirationDate: string | null; // 'YYYY-MM-DD' or null
  expirationPrecision?: string;
  availableBatchStock: number;
  photoUrl?: string | null;
  barcode?: string | null;
}
```

### 3. Grouped Inventory Product for Visual Grid
```typescript
interface GroupedInventoryProduct {
  catalogItemId: string;
  name: string;
  category: string;
  barcode?: string | null;
  photoUrl?: string | null;
  unit: string;
  totalQuantity: number;
  batches: Array<{
    id: string;
    quantity: number;
    expirationDate: string | null;
    expirationPrecision?: string;
    sourceType?: string;
    receivedDate?: string;
  }>;
}
```

### 4. `QuickActionSheet` Props
```typescript
interface QuickActionSheetProps {
  isOpen: boolean;
  onClose: () => void;
  product: GroupedInventoryProduct | null;
  onStageItem: (stagedItem: StagedCartItem) => void;
  stagedCart: StagedCartItem[];
}
```

### 5. `NoBarcodeVisualGridSheet` Props
```typescript
interface NoBarcodeVisualGridSheetProps {
  isOpen: boolean;
  onClose: () => void;
  products: GroupedInventoryProduct[];
  onSelectProduct: (product: GroupedInventoryProduct) => void;
}
```
