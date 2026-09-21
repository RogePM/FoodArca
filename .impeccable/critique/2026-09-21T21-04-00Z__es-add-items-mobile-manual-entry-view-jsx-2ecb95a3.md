---
target: edit item form (isEditing branch of mobile-manual-entry-view.jsx)
total_score: 26
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 2
target_identity: "file:C:\\Users\\COMP1\\Documents\\FoodArca\\components\\pages\\add-items\\mobile-manual-entry-view.jsx"
target_fingerprint: "sha256:4954982eea9202f335631d5a13250e102b0b8678ff29bd8472539399f6635f62"
target_path: "C:\\Users\\COMP1\\Documents\\FoodArca\\components\\pages\\add-items\\mobile-manual-entry-view.jsx"
timestamp: 2026-09-21T21-04-00Z
slug: es-add-items-mobile-manual-entry-view-jsx-2ecb95a3
closed: true
---
Method: dual-agent (A: design-review sub-agent · B: detector+browser sub-agent)

## Design Health Score

| # | Heuristic | Score | Key Finding |
|---|-----------|-------|-------------|
| 1 | Visibility of System Status | 2 | No loading/success feedback on Save or Delete |
| 2 | Match System / Real World | 4 | Count/weight toggle, pack-size presets, source types genuinely mirror pantry intake mechanics |
| 3 | User Control and Freedom | 2 | Close (X) discards in-progress edits with zero dirty-state warning |
| 4 | Consistency and Standards | 3 | "More details" card lacks the eyebrow label the other 3 cards have; delete uses native `confirm()` while category picker uses a custom sheet |
| 5 | Error Prevention | 2 | No dirty-state guard on close; delete confirm doesn't name the item |
| 6 | Recognition Rather Than Recall | 4 | Inline labels, live autocomplete, category icon all reduce recall |
| 7 | Flexibility and Efficiency | 2 | No shortcuts/bulk path; Enter-to-advance is vestigial in single-screen mode |
| 8 | Aesthetic and Minimalist Design | 3 | Clean spacing overall, but low-contrast label text adds visual noise |
| 9 | Error Recovery | 1 | Save button just silently disables — no message explains why (missing name/category/qty) |
| 10 | Help and Documentation | 2 | Only inline hints; acceptable minimalism for this audience, no true help affordance |
| **Total** | | **26/40** | **Acceptable — significant improvements needed** |

## Design Specificity Verdict

**LLM assessment**: Genuinely domain-authored where it counts — the count-vs-weight intake toggle, per-unit weight math, pack-size presets, and source types (Donation/Rescue/USDA) all reflect real food-donation intake mechanics, and inline code comments show deliberate field-ordering reasoning ("Quantity — most commonly edited, surfaced first"). But the *chrome* around those fields — stacked gray cards, uppercase eyebrow labels, a native `window.confirm()` for delete — is interchangeable with any generic SaaS settings form. The product-specific thinking lives in the field logic, not in the surrounding presentation.

**Deterministic scan**: `impeccable detect --json` returned `[]` (exit 0) — no mechanical design-quality rule violations against this file. This is a genuinely clean result, not a gap in coverage; the issues below come from live browser measurement (contrast, touch targets, DOM structure), which the detector doesn't check.

**Browser evidence**: No visual overlay was injected for this run (out of scope for this critique pass), but direct `getBoundingClientRect()` and computed-style measurements were taken live in a 375×812 mobile tab. See Priority Issues below for exact numbers.

## Overall Impression

The underlying food-intake logic is well thought out and the field-level components are cleanly shared with the add-item wizard. What's missing is polish on the surrounding experience: the modal has no dialog semantics, several text elements measurably fail contrast, several tap targets are undersized for a "used one-handed on a distribution floor" tool, and there's no feedback loop confirming a save actually took — which cuts against the product's own stated "never show a stale number" principle. Nothing here blocks task completion (no P0s), but the gap between the care put into the data model and the care put into the modal chrome is the biggest opportunity.

## What's Working

1. **Field ordering is intentionally UX-driven, not arbitrary.** Code comments explicitly justify layout order by edit frequency ("Quantity — most commonly edited... surfaced first," "Identity — least commonly edited, so it sits lowest") — real thought went into this, not just implementation convenience.
2. **Shared field components keep both flows honest.** `ItemNameField`, `QuantityFields`, etc. are reused verbatim between add and edit, so interaction patterns (clear buttons, autocomplete, unit pickers) stay consistent instead of drifting into two different implementations.
3. **The count-vs-weight intake model is a real domain mechanic.** `computePerUnitLbs` and the pack-size system solve an actual bulk/loose-donation problem a generic inventory form wouldn't have.

## Priority Issues

**[P1] Edit overlay has no dialog semantics or focus trap**
- **Why it matters**: Live `read_page` confirmed the underlying inventory grid's filter buttons and tile edit-pencil buttons remain in the accessibility tree and precede the modal's own controls in reading/tab order. A screen-reader or keyboard-only user (Sam) tabbing through the "modal" hits stale background content first, and nothing marks this as a dialog.
- **Fix**: Add `role="dialog"` and `aria-modal="true"` to the overlay container, trap focus on mount/restore on unmount, and `aria-hidden`/`inert` the background grid while open.
- **Suggested command**: `/impeccable harden`

**[P1] Multiple text elements measurably fail WCAG AA contrast**
- **Why it matters**: Live computed-style measurement found several text/background pairs well under the 4.5:1 normal-text threshold: eyebrow labels ("Quantity"/"Expiration"/"Product info") at ~2.43:1, "Optional" badges at ~2.19:1, placeholder text at ~2.29:1, and the orange "Add pack size"/collapsible-toggle links at ~2.87:1. This is a real, measured accessibility violation, not a code-smell guess.
- **Fix**: Darken eyebrow/optional/placeholder text toward `gray-600`/`#5b6472`, and either darken the brand orange or pair it with bold weight + larger size when used for interactive link text.
- **Suggested command**: `/impeccable harden`

**[P2] Touch targets undersized for one-handed floor use**
- **Why it matters**: Measured via `getBoundingClientRect()`: the header Close and Delete buttons and the field clear buttons (name, expiration) are 36×36px — under the 44×44 guideline — and the collapsible toggle links ("Add pack size", "Add storage, source & donor info") are only ~20px tall, i.e. sub-tap-target text links. For a tool whose own principle is "floor speed," used one-handed mid-line (Casey), Close and Delete sitting adjacent at 36px with no confirmation gate on Close is a real mis-tap risk.
- **Fix**: Bump icon buttons to at least 40–44px, and give the collapsible toggles real padding so their hit area reaches ~36–44px tall even though the text itself stays small.
- **Suggested command**: `/impeccable adapt`

**[P2] No save confirmation, and silent data loss on Close**
- **Why it matters**: The Save button has no loading/success state — nothing confirms the edit synced before a volunteer hands the device to the next person, directly undercutting the product's own "never show a stale number" trust principle. Separately, tapping Close (X) immediately discards any in-progress edit with zero dirty-state check.
- **Fix**: Add a brief in-flight/confirmed state on Save (spinner → checkmark before closing), and gate Close behind a lightweight "discard changes?" prompt only when fields differ from `initialItem`.
- **Suggested command**: `/impeccable clarify`

**[P2] Generic native delete confirmation**
- **Why it matters**: `window.confirm("Are you sure you want to delete this item?")` doesn't name the item, doesn't clarify batch scope (tiles elsewhere show multi-batch stacking badges), and doesn't match the app's own custom bottom-sheet pattern already used for category selection — a visible inconsistency (heuristic #4).
- **Fix**: Replace with an in-app sheet naming the specific item and stating what deleting it affects.
- **Suggested command**: `/impeccable clarify`

## Persona Red Flags

**Jordan (First-Timer volunteer)**: The Save button silently disables when required fields are missing with no message explaining why (missing name/category/qty) — Jordan has no way to diagnose what's blocking submission. The unlabeled "More details" card (no eyebrow label, unlike the other three) also breaks the pattern Jordan just learned from the cards above it.

**Sam (Accessibility/screen reader)**: Confirmed live — the overlay has no dialog role or focus trap, so background inventory buttons (several icon-only, blank accessible names) remain reachable ahead of the modal's own controls. Combined with the measured sub-AA contrast on labels and links, this form is materially harder to operate with a screen reader or low vision than it looks in a sighted glance.

**Casey (Distracted, one-handed mobile)**: Close (top-left) and Delete (top-right) are both bare 36px circular icon buttons in the same header row, with no confirmation gate on Close — a thumb slip while juggling a line of people either silently discards edits or opens a destructive delete confirm, both one tap from the primary reading position.

## Minor Observations

- One unassociated `<label>`: "Product photo" renders with no `for` attribute because its `<CleanField>` call omits an `id` prop, so `CleanField`'s `htmlFor={id}` resolves to `undefined` — a one-line fix.
- No heading hierarchy beneath the form's single `<h1>Edit item</h1>`: the four card section labels are `<p>` elements, not `<h2>`/`<h3>`, so screen-reader users can't jump between sections.
- Riley (stress test): a 67-character item name was accepted live with no max-length or truncation warning. Separately, the weight-unit picker includes volume units (fl oz, mL, L, gal) that the code itself documents as contributing `0` toward `totalWeightLbs` — nothing in the UI tells a volunteer that picking "mL" silently zeroes out weight tracking for that item.
- The Quantity card alone can surface 5–6 interactive controls at once (mode toggle, stepper, unit select, weight input, weight-unit select, pack-size toggle) — right at the edge of the "≤4 per group" chunking guideline.
- Cognitive load: edit mode fails "single focus" and "one-thing-at-a-time" — it compresses the same complexity the add wizard paces across 3 steps into one continuous, unpaced scroll.

## Questions to Consider

1. If Quantity really is the most-edited field, why does editing it still require scrolling past three more full cards to reach Save, instead of a minimal "just bump the number" editor with everything else behind "more"?
2. Given "never show a stale number" is a stated product principle, how would a volunteer actually know a real-time save completed before handing the device to the next person?
3. Is the missing dialog/focus-trap semantics and native `window.confirm()` delete an oversight, or is full accessibility compliance genuinely out of scope for this internal volunteer tool right now?
