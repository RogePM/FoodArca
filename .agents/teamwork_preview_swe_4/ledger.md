# Open Issues Ledger

| ID | Issue Description | Raised By (Round) | Resolution Evidence / Test | Status |
|---|---|---|---|---|
| 1 | Direct navigation to deep URLs (e.g. `/dashboard/settings#billing` or `/dashboard/inventory`) upon initial login | implementer_1 | Resolved in Round 1 & Round 2 via hash sync, popstate listeners, and Link routing | CLOSED |
| 2 | Mobile bottom navigation transitions between `/dashboard/add` and `/dashboard/remove` responsive topbar hiding behavior | implementer_1 | Resolved in Round 1 & Round 2 in `DashboardLayout` and `BottomNav` | CLOSED |
| 3 | Verification of live Supabase websocket subscriptions and barcode scanning integration with new route structure | implementer_1 | Duplicate provider removed in r1; single root provider isolation verified; BarcodeScannerOverlay camera stream teardown on unmount verified; 0 duplicate channels | CLOSED |
| 4 | Active organization switcher in `TopBar` cookie/session sync vs localStorage on deep route navigation | reviewer_1 | Verified state persistence and auth flow across all App Router routes | CLOSED |
| 5 | Physical camera hardware & Stripe webhook live integration | reviewer_2 | Synthetic/mocked and tested via code analysis, unit tests, and production build; camera stream teardown verified | CLOSED |
