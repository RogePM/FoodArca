# E2E Test Infra: Mobile-First Checkout / Remove Items Flow

## Test Philosophy
- Opaque-box, requirement-driven QA validation comparing UI/UX against `components/pages/add-items`.
- 5-Tier Verification: Feature Coverage, Boundary & Corner Cases, Cross-Feature Combinations, Real-World Scenarios, and Adversarial/Integrity Verification.

## Feature Inventory & Test Matrix

| # | Feature | Requirement | Tier 1 (Feature) | Tier 2 (Boundary) | Tier 3 (Cross) |
|---|---------|-------------|:----------------:|:-----------------:|:--------------:|
| 1 | Cart-First Default View | ORIGINAL_REQUEST §R1 | 5 tests | 5 tests | ✓ |
| 2 | Neutral Styling & Terminology | ORIGINAL_REQUEST §R1 | 5 tests | 5 tests | ✓ |
| 3 | Visual Grid Bottom Sheet | ORIGINAL_REQUEST §R2 | 5 tests | 5 tests | ✓ |
| 4 | Quick Action Batch Selection | ORIGINAL_REQUEST §R2 | 5 tests | 5 tests | ✓ |
| 5 | Barcode Scanner Branching | ORIGINAL_REQUEST §R1 | 5 tests | 5 tests | ✓ |
| 6 | Bottom Nav Spacing & Layout | Acceptance Criteria | 5 tests | 5 tests | ✓ |

## Real-World Workflows (Tier 4)
1. **Pantry Walk-in Single Item Checkout**: User opens Remove Items, sees empty Cart Hub, taps "No Barcode" visual grid, filters by category, taps canned soup with single batch, stages 2 cans, and submits checkout.
2. **Multi-Expiration Date Batch Selection**: User scans or selects milk carton with 3 active expiration batches (e.g., Exp in 2 days, Exp in 5 days, Exp in 2 weeks). Quick Action Sheet forces explicit selection of the earliest batch, clamps quantity to available stock, and stages in cart.
3. **Continuous Mixed Intake & Removal Flow**: User scans 3 items via camera barcode scanner, stages 2 via visual grid, edits quantity of 1 item in the cart, deletes 1 item, and completes deduction transaction.
4. **Out-of-Stock & Max Quantity Boundary Protection**: User attempts to deduct more than batch stock; Quick Action Sheet clamps quantity and shows warning. Zero stock items are disabled.
5. **Mobile Safe Area & Bottom Nav Integrity**: Responsive verification on 375px viewport checking that bottom nav (`z-[100]`), cart FABs, and checkout sticky footer are completely visible without overlap.

## Tier 5: Adversarial & Forensic Integrity Verification
- AST/Static Analysis of all components in `components/pages/distribution/` to guarantee genuine implementation (no dummy facades, no hardcoded stubs).
- Full UI/UX parity comparison with `components/pages/add-items` reference components.
