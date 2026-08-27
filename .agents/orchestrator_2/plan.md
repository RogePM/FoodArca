# Project Plan: FoodArca Custom Icons Rewrite

## Objective
Rewrite `components/ui/custom-icons.jsx` to provide 10 custom grocery category SVG icon components according to exact aesthetic rules and compositions.

## Target Icons
1. DryGoodsIcon (Flour/grain bag on left with orange wheat stalk graphic + glass jar with dot texture on right)
2. FrozenFoodIcon (Freezer bag with dark gray snowflake + orange seal line + circular badge bottom right with small orange snowflake)
3. ProduceIcon (Bowl at bottom + white apple with orange stem & gray leaf on left + light-gray leafy green center back + orange carrot pointing diagonally up right)
4. ProteinsIcon (Platter/plate at bottom + round salmon fillet with orange fill & white contour lines on left + chicken drumstick with light gray meat & white bone & dark gray outline on right)
5. BakeryIcon (White bread slice on left + sealed snack bag with orange circle graphic on right)
6. CannedGoodsIcon (Tall ribbed can back right with orange stripe near top + shorter can front left with orange tomato graphic)
7. BeveragesIcon (Tall bottle on left with orange water drop graphic + shorter soda can on right with orange wave graphic)
8. DairyIcon (Tall milk bottle on left with cow face graphic + yogurt cup on right with orange lid & spoon sticking out)
9. HygieneIcon (Pump bottle on left with orange pump & drop + toilet paper roll on right)
10. OtherIcon (Shopping basket with vertical slots + circular badge bottom right with orange plus sign inside)

## Aesthetic Rules
- Hardcoded colors (no `currentColor`):
  - Outlines: `#6b7280` or `#595959`
  - Primary Accent: Brand Orange (`#f97316`)
  - Secondary Fill: Light Gray (`#e5e7eb` or `#d1d5db`)
  - Base Fill: White (`#ffffff`) for blocking backgrounds
- Strokes: `strokeWidth={1.5}` or `2`, `strokeLinecap="round"`, `strokeLinejoin="round"`
- Style: Flat, clean, overlapping line-art compositions

## Execution Steps
1. Phase 1: Exploration - 3 Explorers inspect codebase, current custom-icons.jsx, usage across app, test runner, build setup, and detailed SVG path designs.
2. Phase 2: Implementation - 1 Worker writes the complete custom-icons.jsx and verifies build/tests.
3. Phase 3: Review - 2 Reviewers independently verify compliance with specs, SVG validity, rendering, aesthetic rules, and tests.
4. Phase 4: Verification & Audit - 2 Challengers + 1 Auditor run empirical checks and integrity audit.
5. Phase 5: Gate & Report - Synthesize, evaluate gates, and report to Sentinel.
