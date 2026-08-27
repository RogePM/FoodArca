# Briefing — Round 3 Reviewer

## Task Summary
Refactor the FoodArca dashboard from a single-page hash-routing SPA (`app/dashboard/client-page.jsx`) into proper Next.js App Router nested routes (`/dashboard/inventory`, `/dashboard/add`, `/dashboard/remove`, `/dashboard/recent`, `/dashboard/settings`), while preserving all existing functionality, layouts, and components.

## Core Requirements & Audit Matrix
1. **R1: Migrate to App Router Nested Routes**:
   - `app/dashboard/page.js` -> Dashboard home overview (`DashboardHome`)
   - `app/dashboard/inventory/page.jsx` -> Inventory table & visual grid (`InventoryView`)
   - `app/dashboard/add/page.jsx` -> Add items workflow (`AddItemView`)
   - `app/dashboard/remove/page.jsx` -> Distribution & removal module (`DistributionModule`)
   - `app/dashboard/recent/page.jsx` -> Audit activity history log (`RecentChangesView`)
   - `app/dashboard/settings/page.jsx` -> General & billing configuration (`SettingsView`)
2. **R2: Shared Persistent Layout Shell**:
   - `app/dashboard/layout.jsx` -> Server-side auth verification via `@supabase/ssr` cookies and active organization checking, wrapping pages in `DashboardLayout`.
   - `components/layout/dashboard-layout.jsx` -> Desktop `Sidebar`, `TopBar`, mobile `BottomNav`, responsive heights with `100dvh` and safe-area insets.
3. **R3: Component Integration & Functional Integrity**:
   - Legacy `app/dashboard/client-page.jsx` retired (deleted).
   - Zero stale references to `client-page.jsx` across the entire codebase.
   - Clean lifecycle management for `PantryProvider`, barcode camera streams, and billing deep links.

## Verification Executed
- Build verification: `npm run build` and `npx next build` compiled 28/28 routes in 13.5s with 0 errors.
- Test suites:
  - `scripts/test-app-router-migration.cjs` (7/7 checks passed)
  - `scripts/test-route-logic.cjs` (12/12 route resolution assertions passed)
  - `scripts/comprehensive-adversarial-audit.cjs` (9/9 deep adversarial checks passed)
