# Plan: Mobile-First Checkout / Remove Items Flow

## Overview
Implement a mobile-first "Checkout / Remove Items" flow in `components/pages/distribution`, closely mirroring `components/pages/add-items`.
The architecture centers around a "Removal Cart" hub, with branching paths to a barcode scanner and a visual search grid with a Quick Action Sheet forcing explicit batch selection for items with multiple active expiration dates.

## Workflow Phases

### Phase 0: Survey & Scope Mapping (Parallel Explorers)
- **Explorer 1**: Analyze `components/pages/add-items` (components, state flow, layout patterns, sheets, tabs, cart behaviors, icons, terminology, responsive design).
- **Explorer 2**: Analyze inventory data structures, batch/expiration handling, deduct/remove mutations, store/hooks, Supabase realtime setup.
- **Explorer 3**: Analyze routing (`distribution` page vs `add-items` page), bottom navigation integration, scanner components/camera lifecycle, UI design system / Tailwind tokens.

### Phase 1: Architecture & Decomposition (PROJECT.md)
- Synthesize findings into `PROJECT.md`.
- Establish Feature Inventory, Module Boundaries, Interface Contracts, and Milestones.
- Create `TEST_INFRA.md` for test track planning.

### Phase 2: Dual Track Execution
- **Track A: Implementation Track**
  - Milestone 1: Distribution Page & Removal Cart Core Hub (cart-first layout, deduct terminology, minus/cart icons, empty state, bottom nav spacing).
  - Milestone 2: "No Barcode" Visual Search Grid Bottom Sheet (search bar, filter, item cards, grid layout).
  - Milestone 3: Quick Action Sheet & Expiration Batch Selection (batch picker when multiple expiration dates exist, quantity selector, staging to removal cart).
  - Milestone 4: Barcode Scanner Branching & Camera Flow (camera scanner triggering quick action sheet or direct staging, toggle modes).
  - Milestone 5: Checkout / Deduct Submission Flow (transaction execution, inventory deduction, error handling, feedback/toasts, realtime updates).
- **Track B: Testing & QA Track**
  - E2E test harness & automated test runner.
  - Tier 1: Feature Coverage (≥5 per feature).
  - Tier 2: Boundary & Corner Cases (empty cart, out-of-stock, zero quantity, max batch quantity, missing expiration).
  - Tier 3: Cross-Feature Interactions (scan → batch select → edit in cart → deduct).
  - Tier 4: Real-World Workflows (multi-item checkout, multi-batch deductions).
  - Tier 5: Adversarial Coverage Hardening & UI/UX parity comparison with `components/pages/add-items`.

### Phase 3: Verification & Auditing
- Reviewers (2 independent agents per milestone).
- Challengers (2 adversarial verifiers).
- Forensic Auditor (integrity check).
- Pass all gates before declaring victory.

### Phase 4: Final Reporting
- Synthesize all results.
- Write handoff report and notify caller.
