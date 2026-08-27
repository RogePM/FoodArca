# Briefing: Dashboard App Router Migration Review

## 1. Review Objectives & Scope
Independently audit, break-test, and refine the refactored Next.js App Router nested dashboard routes (/dashboard, /dashboard/inventory, /dashboard/add, /dashboard/remove, /dashboard/recent, /dashboard/settings), validating shared layout shell persistence, component integrity, routing ergonomics, and realtime state handling.

## 2. Requirements Matrix
- **R1. App Router Nested Routes**: Replace monolithic client-page.jsx with native nested route directories (pp/dashboard/{inventory,add,remove,recent,settings}/page.jsx + pp/dashboard/page.js).
- **R2. Shared Layout Shell**: Persistent UI (Sidebar, TopBar, BottomNav) wrapped via pp/dashboard/layout.jsx and DashboardLayout.
- **R3. Component Integration**: Preserve full functionality of InventoryView, AddItemView, DistributionModule, RecentChangesView, SettingsView, DashboardHome without logic or styling regression.
- **R4. Production Build**: Build cleanly with Turbopack with 0 errors.

## 3. Adversarial Attack Vectors Examined
1. Duplicate router pushes on <Link> clicks in Sidebar and BottomNav.
2. Redundant nested <PantryProvider> context in pp/dashboard/layout.jsx vs pp/layout.js.
3. Hash synchronization and deep-linking in SettingsView (#billing vs #general).
4. Full-screen mobile header hiding behavior across routes (/dashboard/add, /dashboard/remove, /dashboard/inventory).
5. Live Supabase subscription lifecycle and router hook compatibility.
