# Original User Request

## Initial Request — 2026-08-24T17:31:27Z

Execute the SWE Light loop (one implementer on the whole task, followed by adversarial reviewer rounds with an open-issues ledger) for the following UI/UX refinement:

## Requirements:
### R1. Simplify Visual Grid Cards
In `components/pages/distribution/no-barcode-visual-grid-sheet.jsx`:
- Strip down the item cards to the absolute minimum: Item Image/Icon, Item Name, and the "Add to Cart" button.
- Completely remove the category name and expiration date text from these cards to prevent overcrowding.
- If an item has more than one active expiration batch, display a small, elegant badge (e.g., "2 Batches") on the card (top or side) to indicate this to the user.

### R2. Refine Quick Action Sheet UI
In `components/pages/distribution/quick-action-sheet.jsx`:
- Ensure this sheet *only* mounts/appears if the selected item has more than 1 batch.
- Simplify the multi-batch selection UI. It should display a clean, uncluttered list of available batches showing only the expiration date and available stock count.
- Provide a clear, simple "Add to Cart" action for the selected batch. Remove any unnecessary heavy UI elements.

### R3. Typography & Sizing Parity
- Maintain a clean, precise, and light text hierarchy (e.g., `font-medium` instead of heavy bolding).
- Ensure the grid cards and batch selection rows are sized appropriately—not excessively large, but large enough for easy mobile tapping.

### R4. Verification
Use an independent Agent-as-Judge to review the React code and verify that the requested UI elements were removed and the batch badge logic was implemented.

## Acceptance Criteria:
- Code review confirms category and expiration date text have been entirely removed from the item cards in `no-barcode-visual-grid-sheet.jsx`.
- Code review confirms a conditional UI badge exists on the item card indicating the number of batches *only if* batches > 1.
- Code review confirms the `quick-action-sheet.jsx` batch list is simplified to show only expiration date, stock count, and an add action, with lighter font weights.
- Independent reviewer confirms the text hierarchy uses lighter weights (e.g., avoiding excessive `font-bold`) to match a clean, premium aesthetic.
