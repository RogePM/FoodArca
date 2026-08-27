# Briefing - Teamwork Preview Reviewer (Round 2)

## Task Objective
Adversarially review, stress-test, and fix any defects in the migration of FoodArca dashboard from legacy single-page hash routing (`client-page.jsx`) to Next.js App Router nested routes (`/dashboard/inventory`, `/dashboard/add`, `/dashboard/remove`, `/dashboard/recent`, `/dashboard/settings`).

## Scope & Requirements
1. **R1**: App Router nested routes under `/app/dashboard/` (`inventory`, `add`, `remove`, `recent`, `settings`).
2. **R2**: Preserved shared layout shell (Sidebar, TopBar, BottomNav) in `app/dashboard/layout.jsx`.
3. **R3**: Component integration (`InventoryView`, `AddItemView`, `DistributionModule`, `SettingsView`, `DashboardHome`, etc.) functioning seamlessly without broken navigation, broken state, or stale router/hash references.
4. **Acceptance Criteria**:
   - `npx next build` / `npm run build` succeeds with 0 errors.
   - Sub-route folders exist with page files.
   - Legacy `client-page.jsx` router is retired.
   - Shared layout correctly wraps nested pages.
5. **Adversarial Checks**:
   - Check all components for stale `#` hash references, `window.location.hash`, or obsolete navigation callbacks.
   - Command palette, search query params, barcode scanner navigation callbacks, breadcrumbs, links.
   - Org switcher cookie/session sync vs localStorage on deep route navigation.
   - Test suites, linting, build integrity.
