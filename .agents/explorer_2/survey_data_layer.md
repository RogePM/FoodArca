# Survey: Inventory Data Layer, Batch Management & Deductions

**Explorer 2 Investigation Report**  
**Date:** 2026-08-21  
**Target:** Mobile Checkout / Removal Flow (`components/pages/distribution`)  
**Workspace:** `C:\Users\COMP1\.gemini\antigravity\worktrees\FoodArca\migrate-supabase-realtime-inventory`

---

## Executive Summary

This report provides a comprehensive data layer investigation of the FoodArca inventory management system. It details the Supabase database schema, TypeScript types, API routes, batch modeling, existing Add/Deduct mechanics, realtime state propagation, and the complete data architecture required for the mobile **Checkout / Removal Flow** and its **Quick Action Sheet**.

---

## 1. Database Schema & TypeScript Type System

The database is built on PostgreSQL hosted via Supabase with Row Level Security (RLS) and strict relational integrity.

### 1.1 Core Database Tables

#### Table: `catalog_items`
Represents the organization-level product master (SKU / barcode definition).
```sql
CREATE TABLE public.catalog_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name text NOT NULL,
  barcode text,
  category_id bigint REFERENCES public.categories(id),
  unit_of_measure text NOT NULL, -- CHECK constraint: 'count', 'oz', 'lbs', 'kg', 'fl_oz', 'gallon'
  input_unit_value numeric NOT NULL DEFAULT 1,
  pack_size integer,
  photo_url text,
  weight_per_unit_lbs numeric GENERATED ALWAYS AS (
    -- Computed column stored in Postgres based on input_unit_value & unit_of_measure
  ) STORED,
  created_at timestamptz NOT NULL DEFAULT now()
);
```

#### Table: `inventory_batches`
Represents the actual physical stock lots located at a specific pantry location, tracking distinct expiration dates and quantities.
```sql
CREATE TABLE public.inventory_batches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  catalog_item_id uuid NOT NULL REFERENCES public.catalog_items(id) ON DELETE CASCADE,
  location_id uuid NOT NULL REFERENCES public.locations(id) ON DELETE CASCADE,
  quantity numeric NOT NULL DEFAULT 0, -- Current available stock count/units
  expiration_date date,               -- ISO Date: 'YYYY-MM-DD' or NULL
  expiration_precision text,          -- 'day', 'month', 'unknown'
  source_type text,                   -- 'donation', 'purchased', 'usda_commodity', 'retail_rescue'
  donor_name text,
  received_date date NOT NULL DEFAULT CURRENT_DATE,
  created_at timestamptz NOT NULL DEFAULT now()
);
```

#### Table: `activity_logs`
Immutable audit log tracking all physical stock movements.
```sql
CREATE TABLE public.activity_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id),
  location_id uuid REFERENCES public.locations(id),
  user_id uuid REFERENCES public.app_users(id),
  action_type text NOT NULL, -- 'scan_in', 'scan_out', 'waste_disposal', 'audit_update'
  quantity_changed numeric NOT NULL,
  total_weight_lbs_changed numeric,
  reason text,
  item_snapshot jsonb NOT NULL, -- JSON snapshot of the catalog item at movement time
  created_at timestamptz NOT NULL DEFAULT now()
);
```

#### Reference Table: `categories`
Shared global categories for classification:
- `id`: integer PK
- `name`: text (e.g., 'Canned Goods', 'Dry Goods', 'Produce', 'Proteins', 'Dairy', 'Bakery & Snacks', 'Beverages', 'Frozen Food', 'Hygiene', 'Other')
- `is_food`: boolean

#### Table: `locations`
- `id`: uuid PK
- `organization_id`: uuid FK
- `name`: text
- `address_line1`, `city`, `state`, `zip`, `timezone`

---

### 1.2 TypeScript Interfaces (`lib/database.types.ts`)

```typescript
export interface CatalogItemRow {
  id: string;
  organization_id: string;
  name: string;
  barcode: string | null;
  category_id: number | null;
  unit_of_measure: string;
  input_unit_value: number;
  pack_size: number | null;
  photo_url: string | null;
  weight_per_unit_lbs: number | null;
  created_at: string;
}

export interface InventoryBatchRow {
  id: string;
  catalog_item_id: string;
  location_id: string;
  quantity: number;
  expiration_date: string | null;
  expiration_precision: string | null;
  source_type: string | null;
  donor_name: string | null;
  received_date: string;
  created_at: string;
}

export interface ActivityLogRow {
  id: string;
  organization_id: string;
  location_id: string | null;
  user_id: string | null;
  action_type: 'scan_in' | 'scan_out' | 'waste_disposal' | 'audit_update';
  quantity_changed: number;
  total_weight_lbs_changed: number | null;
  reason: string | null;
  item_snapshot: Json;
  created_at: string;
}
```

---

### 1.3 Database RPC Functions

1. **`scan_out_item(p_catalog_item_id: string, p_location_id: string, p_quantity: number)`**:
   - Executes stock deduction in PostgreSQL.
   - Automatically resolves batches using **FEFO (First-Expired, First-Out)** order.
   - Decrements batch quantity; deletes empty batches (or sets quantity to 0).
   - Generates the associated `activity_logs` entry (`action_type: 'scan_out'`) with `item_snapshot`.
   - Uses row locking (`SELECT FOR UPDATE`) to prevent concurrency race conditions.

2. **`delete_catalog_item_safe(p_item_id: string)`**:
   - Deletes batches and catalog items safely while preserving activity logs.

---

## 2. Item & Batch Representation

### 2.1 API Endpoint: `GET /api/foods`
When querying inventory via `GET /api/foods` (with header `x-pantry-id: <locationId or orgId>`):
1. Authenticates session cookies.
2. Resolves `location_id` and verifies membership in `user_organizations`.
3. Executes query:
   ```javascript
   auth.supabase
     .from('inventory_batches')
     .select(`
       id, quantity, expiration_date, expiration_precision, source_type, received_date,
       catalog_item:catalog_items (
         id, name, barcode, photo_url, unit_of_measure, input_unit_value, weight_per_unit_lbs,
         category:categories ( id, name, is_food )
       )
     `)
     .eq('location_id', locationId)
     .order('expiration_date', { ascending: true, nullsFirst: false });
   ```
4. Flattens data into UI consumption objects:
   ```javascript
   {
     _id: batch.id,                   // Batch UUID
     id: batch.id,                    // Batch UUID
     catalogItemId: item.id,          // Catalog Item UUID
     name: item.name,                 // Product name
     barcode: item.barcode || '',     // Barcode string
     category: cat.name || 'General', // Category name
     quantity: batch.quantity,        // Quantity in THIS specific batch
     unit: item.unit_of_measure,      // e.g. 'units', 'cans', 'lbs', 'boxes'
     expirationDate: batch.expiration_date, // 'YYYY-MM-DD' or null
     expirationPrecision: batch.expiration_precision || 'none',
     sourceType: batch.source_type || 'donation',
     receivedDate: batch.received_date,
     weightPerUnit: item.weight_per_unit_lbs || 1,
     photoUrl: item.photo_url || null
   }
   ```

### 2.2 Handling Multiple Active Expiration Dates per Product
Because `GET /api/foods` returns **one record per inventory batch**, a product with 3 distinct expiration dates will return 3 records sharing the same `catalogItemId`, `name`, and `barcode`, but having distinct `id` (`batchId`), `expirationDate`, and `quantity`.

#### Client-Side Grouping Algorithm (FEFO Batch Hierarchy)
In `components/pages/inventory/index.jsx` and `components/pages/distribution/`:
```javascript
const groupBatches = (inventoryList) => {
  const groups = new Map();

  inventoryList.forEach(item => {
    // Unique key per product
    const key = item.catalogItemId || (item.barcode ? `bc_${item.barcode}` : `name_${item.name.toLowerCase()}`);
    
    if (!groups.has(key)) {
      groups.set(key, {
        catalogItemId: item.catalogItemId,
        name: item.name,
        barcode: item.barcode,
        category: item.category,
        unit: item.unit,
        photoUrl: item.photoUrl,
        weightPerUnit: item.weightPerUnit,
        totalQuantity: 0,
        batches: []
      });
    }

    const group = groups.get(key);
    const qty = parseFloat(item.quantity) || 0;
    group.totalQuantity += qty;
    group.batches.push(item);
  });

  // Sort batches within each group by FEFO (earliest expiration first, no date last)
  return Array.from(groups.values()).map(group => {
    group.batches.sort((a, b) => {
      if (!a.expirationDate) return 1;
      if (!b.expirationDate) return -1;
      return new Date(a.expirationDate) - new Date(b.expirationDate);
    });
    group.earliestExpiration = group.batches[0]?.expirationDate || null;
    return group;
  });
};
```

---

## 3. Existing Add Flow: Batch Creation & Increments

### 3.1 Flow Architecture
1. **Scanning / Manual Input**:
   - `components/pages/add-items/mobile-add-flow.jsx` coordinates scanning and manual entry.
   - Barcode scan calls `GET /api/barcode/[code]`.
   - If found in `catalog_items`, shows Known Item confirmation sheet with prefilled name, category, unit.
   - If not found, opens `MobileManualEntryView` for multi-step product registration.
2. **Staging**:
   - Confirmed items are added to local state `cartItems` and persisted to `sessionStorage` (`foodarca_staged_batch`).
3. **Bulk Submission**:
   - Submits `POST /api/foods/bulk` with `{ items: cartItems }`.
   - Route logic:
     * Normalizes units and expiration precision.
     * Upserts `catalog_items` by `organization_id` + `barcode`.
     * Inserts new records into `inventory_batches`.
     * Inserts audit log entries into `activity_logs` with `action_type: 'scan_in'`.

---

## 4. Existing Deduction & Distribution Mechanics

### 4.1 `POST /api/client-distributions`
- Request payload:
  ```json
  {
    "cart": [
      {
        "itemId": "<batch_id>",
        "catalogItemId": "<catalog_item_id>",
        "itemName": "Canned Corn",
        "quantityDistributed": 3,
        "unit": "cans"
      }
    ],
    "clientName": "Walk-in",
    "clientId": "SYS"
  }
  ```
- Execution:
  1. Verifies caller membership.
  2. For each item in `cart`, resolves `catalogItemId`.
  3. Calls Supabase RPC `scan_out_item({ p_catalog_item_id: catalogItemId, p_location_id: locationId, p_quantity: qty })`.
  4. Database handles decrementing batches in FEFO order and logs `action_type: 'scan_out'`.

### 4.2 `PUT /api/foods/[id]`
- Direct batch editing (e.g., in `EditItemModal`).
- Updates `inventory_batches` row (`quantity`, `expiration_date`, `source_type`).
- Logs `action_type: 'audit_update'` with `quantity_changed` and `item_snapshot`.

### 4.3 `DELETE /api/foods/[id]`
- Calls RPC `delete_catalog_item_safe` to remove catalog item and all associated batches.

---

## 5. State Management & Realtime Reactivity

### 5.1 `PantryProvider` (`components/providers/PantryProvider.js`)
- Supplies `PantryContext`:
  * `organizationId`, `locationId`, `pantryId`
  * `pantryDetails`, `availablePantries`, `switchPantry`, `refreshPantry`
  * `lastInventoryUpdate`: Timestamp updated automatically when database changes occur.
- **Supabase Realtime Channel**:
  ```javascript
  supabase
    .channel(`inventory-realtime-${locationId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'inventory_batches',
        filter: `location_id=eq.${locationId}`,
      },
      (payload) => {
        console.log('⚡ Realtime inventory change detected:', payload);
        setLastInventoryUpdate(Date.now());
      }
    )
    .subscribe();
  ```
- Any view observing `lastInventoryUpdate` (or refreshing on `pantryId` change) receives instant inventory updates without manual page reloads.

---

## 6. Architecture for Quick Action Sheet & Mobile Checkout Flow

The required mobile checkout flow in `components/pages/distribution` demands a cart-first architecture, visual grid, barcode scanning, and a **Quick Action Sheet** that manages batch selection and deduction staging.

### 6.1 Data Models for Removal Cart & Staging

#### Staged Removal Item Structure
```typescript
export interface StagedRemovalItem {
  id: string;                      // Unique cart line ID (e.g. `${batchId}-${timestamp}`)
  batchId: string;                 // Target inventory_batch ID (UUID)
  catalogItemId: string;           // Catalog Item UUID
  name: string;                    // Product Name
  barcode: string;                 // Barcode
  category: string;                // Category slug / name
  categoryName?: string;           // Display category
  unit: string;                    // Unit of measure ('cans', 'units', etc.)
  quantity: number;                // Quantity to deduct/remove
  expirationDate: string | null;   // Selected batch expiration date
  expirationPrecision?: string;    // 'day', 'month', 'none'
  availableBatchStock: number;     // Available stock in this specific batch
  photoUrl: string | null;         // Product image URL
}
```

### 6.2 Session Storage Persistence
Mirrors `foodarca_staged_batch` from Add flow:
- Storage Key: `foodarca_staged_distribution_cart`
- Synchronized on every cart state mutation:
  ```javascript
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem('foodarca_staged_distribution_cart');
      if (saved) setCart(JSON.parse(saved));
    } catch (e) {}
  }, []);

  useEffect(() => {
    try {
      sessionStorage.setItem('foodarca_staged_distribution_cart', JSON.stringify(cart));
    } catch (e) {}
  }, [cart]);
  ```

---

### 6.3 Quick Action Sheet Logic & Batch Selection Flow

When an item is selected via **Barcode Scan** or tapped in the **"No Barcode" Visual Grid**:

```
[User scans barcode OR taps product card in Visual Grid]
                           │
                           ▼
          [Query all active batches for product]
          (filter location_id, catalog_item_id, quantity > 0)
          (sort FEFO: earliest expirationDate first)
                           │
             ┌─────────────┴─────────────┐
             ▼                           ▼
    [Single Active Batch]       [Multiple Active Batches]
             │                           │
  Auto-select batch             Display batch selection list
  Available: batch.quantity     (Exp date badge, stock, source)
             │                  User MUST pick active batch
             │                           │
             └─────────────┬─────────────┘
                           │
                           ▼
          [Quantity Stepper & Validation]
          1 <= quantity <= (selectedBatch.quantity - alreadyInCartForBatch)
                           │
                           ▼
          [Tap "Deduct / Stage in Cart"]
                           │
                           ▼
          [Append StagedRemovalItem to Cart]
          (Trigger Haptic + Success Toast + Return to Cart/Grid)
```

#### Batch Selection Enforcement Rules
1. **Multi-Batch Product**:
   - When `productGroup.batches.length > 1`:
     * Render a segmented batch picker or list of radio batch cards.
     * Each batch card shows: Expiration Date (formatted with urgency badge: Expired, Expiring Soon, Good), Available Quantity in this batch, and Source Type.
     * Pre-select the earliest FEFO batch by default, but require explicit visual confirmation.
2. **Quantity Bounds Validation**:
   - Compute `alreadyStagedQty` for `selectedBatch.id` in `cart`.
   - `maxAllowed = Math.max(0, selectedBatch.quantity - alreadyStagedQty)`.
   - Prevent quantity input from exceeding `maxAllowed` or dropping below `1`.
   - If `maxAllowed === 0`, disable add button with "All batch stock already in cart".
3. **Cart Staging**:
   - If an item for `selectedBatch.id` already exists in `cart`, increment its quantity by the chosen amount (up to `selectedBatch.quantity`).
   - Otherwise, append new `StagedRemovalItem`.

---

### 6.4 Checkout Execution Flow

When user taps **"Checkout / Distribute"**:
1. Open confirmation modal (or submit directly in Fast Mode).
2. Format payload for `POST /api/client-distributions`:
   ```javascript
   const payload = {
     cart: cart.map(item => ({
       itemId: item.batchId,
       catalogItemId: item.catalogItemId,
       itemName: item.name,
       category: item.category,
       quantityDistributed: item.quantity,
       unit: item.unit,
       reason: 'distribution-regular'
     }))
   };
   ```
3. API calls `scan_out_item` RPC for each item.
4. On 200/201 response:
   - Clear cart state & remove `foodarca_staged_distribution_cart` from `sessionStorage`.
   - Supabase Realtime channel fires on `inventory_batches` and increments `lastInventoryUpdate`.
   - Inventory refetches immediately across all pages.

---

## 7. Comparative Analysis: Add vs Removal Architecture

| Dimension | Add Flow (`components/pages/add-items`) | Removal / Checkout Flow (`components/pages/distribution`) |
| :--- | :--- | :--- |
| **Default Hub** | `MobileCartView` (Staged Add Cart) | `MobileDistributionCartView` (Removal Cart) |
| **Branch 1** | Camera Barcode Scanner (`BarcodeScannerOverlay`) | Camera Barcode Scanner (`BarcodeScannerOverlay` with Deduct Reticle) |
| **Branch 2** | `MobileManualEntryView` (Create new catalog item/batch) | "No Barcode" Visual Search Grid (`LocalInventoryGridSheet`) |
| **Action Sheet** | "Known Item Found" sheet (Quantity, unit, exp date) | **Quick Action Sheet** (Batch/lot selection, available stock, qty) |
| **Session Key** | `foodarca_staged_batch` | `foodarca_staged_distribution_cart` |
| **API Endpoint** | `POST /api/foods/bulk` | `POST /api/client-distributions` |
| **Postgres Action** | `scan_in` | `scan_out` (via `scan_out_item` RPC) |
| **Primary Theme** | Clean White/Neutral + Brand Orange + Plus Icons | Clean White/Neutral + Removal/Minus Icons + Checkout Terminology |

---

## 8. Summary of File Locations & Key Code Artifacts

- **Database Types**: `lib/database.types.ts`
- **Pantry Context & Realtime**: `components/providers/PantryProvider.js`
- **Inventory Fetch / Add**: `app/api/foods/route.js`, `app/api/foods/bulk/route.js`
- **Distribution / Scan Out**: `app/api/client-distributions/route.js`
- **Barcode & Dictionary**: `app/api/barcode/[code]/route.js`, `app/api/foods/dictionary/route.js`
- **Add Flow Reference**: `components/pages/add-items/mobile-add-flow.jsx`, `components/pages/add-items/mobile-cart-view.jsx`
- **Distribution Module**: `components/pages/distribution/index.jsx`, `components/pages/distribution/distribution-mobile-list.jsx`
- **Inventory Utils**: `components/pages/inventory/inventory-utils.js`
- **Navigation & Layout**: `components/layout/dashboard-layout.jsx`, `components/layout/bottom-nav.jsx`
