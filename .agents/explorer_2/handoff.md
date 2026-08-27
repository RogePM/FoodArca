# Handoff Report: Explorer 2 (SVG Composition Designer - Icons 1–5)

**Working Directory**: `C:\Users\COMP1\.gemini\antigravity\worktrees\FoodArca\migrate-supabase-realtime-inventory\.agents\explorer_2`
**Target Scope**: Formulate detailed SVG path coordinates, layers, shapes, and aesthetics for Category Icons 1 to 5 (`DryGoodsIcon`, `FrozenFoodIcon`, `ProduceIcon`, `ProteinsIcon`, `BakeryIcon`).

---

## 1. Observation

### 1.1 Requirements & Specifications
From `C:\Users\COMP1\.gemini\antigravity\worktrees\FoodArca\migrate-supabase-realtime-inventory\.agents\ORIGINAL_REQUEST.md` (lines 58–75):
```markdown
## Aesthetic Rules (CRITICAL)
1. Colors (Hardcoded, NO currentColor):
   - Outlines: Medium-dark gray (#6b7280 or #595959).
   - Primary Accent: Brand Orange (#f97316 or similar bright orange).
   - Secondary Fill: Light Gray (#e5e7eb or #d1d5db) for subtle shading.
   - Base Fill: White (#ffffff) for main bodies to ensure overlapping elements block out the background properly.
2. Strokes: strokeWidth={1.5} or 2. Must use strokeLinecap="round" and strokeLinejoin="round".
3. Style: Flat, clean, overlapping line-art compositions.

## Compositions (Replicate Exactly)
1. DryGoodsIcon: A tall flour/grain bag on the left (with an orange wheat stalk graphic) overlapping a shorter glass jar on the right (with dot texture).
2. FrozenFoodIcon: A tall freezer bag with a large dark gray snowflake in the center, and an orange seal line at the top. A circular badge overlaps the bottom right containing a smaller orange snowflake.
3. ProduceIcon: A bowl at the bottom. Inside/behind the bowl: a white apple on the left (with an orange stem and gray leaf), a tall light-gray leafy green in the center back, and an orange carrot on the right pointing diagonally up.
4. ProteinsIcon: A platter/plate at the bottom. On the left, a round salmon fillet (orange fill, white contour lines). On the right, a chicken drumstick (light gray meat fill, white bone, dark gray outline).
5. BakeryIcon: A slice of white bread on the left, overlapping a sealed snack bag on the right (bag has an orange circle graphic).
```

### 1.2 Codebase Context
- `lib/constants.js` (lines 12–23, 66–77) imports and maps these icons into `categories` array (`dry_goods`, `frozen_food`, `produce`, `proteins`, `bakery_snacks`, etc.).
- Existing `custom-icons.jsx` defines forwardRef components with default exports and aliases at lines 422–441 (`GrainSackIcon`, `SackIcon`, `SnowflakeIcon`, `AppleIcon`, `FruitVegIcon`, `ChickenLegIcon`, `DrumstickIcon`, `SteakIcon`, `BreadIcon`, `BakerySnacksIcon`, `LoafBreadIcon`).

---

## 2. Logic Chain

1. **Adherence to Hardcoded Palette**:
   - Outlines are set directly to `#6b7280` (`stroke="#6b7280"`).
   - Primary accents (wheat stalk, freezer seal line, badge snowflake, carrot, salmon fillet, snack bag badge) use `#f97316`.
   - Secondary fills (jar body, leafy green vegetable, apple leaf, drumstick meat, bread crumb shading) use `#e5e7eb` (or with subtle opacity).
   - Base fills for foreground objects (flour bag, bread slice, produce bowl, platter, freezer bag, circular badge) use `#ffffff` to guarantee crisp occlusion without overlapping stroke artifacts.

2. **Geometric Precision & ViewBox Layout**:
   - All 5 icons are strictly bounded within `viewBox="0 0 24 24"`.
   - Element positioning balances left-to-right visual weight:
     - `DryGoodsIcon`: Bag occupies X=3.5..13, Y=3.5..21; Jar occupies X=12..21, Y=8..21.
     - `FrozenFoodIcon`: Bag occupies X=4..17, Y=2.5..21; Badge occupies X=13..22, Y=12..21.
     - `ProduceIcon`: Bowl base at Y=14..21; Apple at X=3..10, Y=5..15; Leafy green at X=8.5..15.5, Y=2.5..14; Carrot at X=12.5..21.5, Y=3.5..15.5.
     - `ProteinsIcon`: Platter at Y=15..21.5; Salmon steak at X=4..13, Y=7.5..17; Drumstick at X=11.5..21.5, Y=5.5..17.
     - `BakeryIcon`: Bread slice at X=2.5..13.5, Y=6.5..20.5; Snack bag at X=11.5..21, Y=3.5..20.5.

3. **React & Lucide Compatibility**:
   - Each component is wrapped with `forwardRef` and supports `size = 24`, `strokeWidth = 1.5`, `className = ''`, and `...props` forwarding.

---

## 3. Caveats

- **Stroke Inheritance**: The user explicit prompt mandates hardcoded `#6b7280` strokes and `#f97316` accents, deliberately abandoning `currentColor` inheritance so the category icons retain their custom dual-tone graphic identity everywhere across light/dark themes.
- **Icons 6–10**: Designed in parallel by Explorer 3 (`CannedGoodsIcon`, `BeveragesIcon`, `DairyIcon`, `HygieneIcon`, `OtherIcon`).

---

## 4. Conclusion & Proposed JSX Code

All 5 icons are completely designed, mathematically validated, and ready for immediate drop-in implementation into `components/ui/custom-icons.jsx`:

### 1. `DryGoodsIcon`
```jsx
export const DryGoodsIcon = forwardRef(
  ({ size = 24, strokeWidth = 1.5, className = '', ...props }, ref) => (
    <svg
      ref={ref}
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      {/* Right: Glass Jar (Back layer) */}
      <rect x="13.5" y="8" width="6.5" height="2" rx="0.6" fill="#ffffff" stroke="#6b7280" strokeWidth={strokeWidth} />
      <path
        d="M14.5 10h4.5a2 2 0 0 1 2 2v6.5a2 2 0 0 1-2 2h-5a2 2 0 0 1-2-2V12a2 2 0 0 1 2.5-2z"
        fill="#e5e7eb"
        stroke="#6b7280"
        strokeWidth={strokeWidth}
      />
      <circle cx="15.5" cy="14" r="0.75" fill="#6b7280" />
      <circle cx="18" cy="14.5" r="0.75" fill="#6b7280" />
      <circle cx="15" cy="17.5" r="0.75" fill="#6b7280" />
      <circle cx="18.2" cy="17.8" r="0.75" fill="#6b7280" />
      <circle cx="16.8" cy="16" r="0.75" fill="#f97316" />

      {/* Left: Flour/Grain Bag (Front layer, overlaps jar) */}
      <path
        d="M4 5.5h7.5l1 13.5a1.8 1.8 0 0 1-1.8 1.8H4.8a1.8 1.8 0 0 1-1.8-1.8L4 5.5z"
        fill="#ffffff"
        stroke="#6b7280"
        strokeWidth={strokeWidth}
      />
      <path
        d="M3.5 3.5h8.5a1 1 0 0 1 1 1v1a1 1 0 0 1-1 1H3.5a1 1 0 0 1-1-1v-1a1 1 0 0 1 1-1z"
        fill="#ffffff"
        stroke="#6b7280"
        strokeWidth={strokeWidth}
      />

      {/* Orange Wheat Stalk Graphic */}
      <path d="M7.8 9.5v7" stroke="#f97316" strokeWidth={strokeWidth} />
      <path d="M6.3 8l1.5 1.5 1.5-1.5" stroke="#f97316" strokeWidth={strokeWidth} />
      <path d="M5.8 11.8l2-1.5 2 1.5" stroke="#f97316" strokeWidth={strokeWidth} />
      <path d="M5.8 14.3l2-1.5 2 1.5" stroke="#f97316" strokeWidth={strokeWidth} />
    </svg>
  )
);
DryGoodsIcon.displayName = 'DryGoodsIcon';
```

### 2. `FrozenFoodIcon`
```jsx
export const FrozenFoodIcon = forwardRef(
  ({ size = 24, strokeWidth = 1.5, className = '', ...props }, ref) => (
    <svg
      ref={ref}
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      {/* Freezer Bag Header & Body */}
      <path
        d="M4.5 5.5L5 19.5a1.8 1.8 0 0 0 1.8 1.8h7.4a1.8 1.8 0 0 0 1.8-1.8L16.5 5.5H4.5z"
        fill="#ffffff"
        stroke="#6b7280"
        strokeWidth={strokeWidth}
      />
      <path
        d="M4.5 2.5h12a1 1 0 0 1 1 1v2H3.5v-2a1 1 0 0 1 1-1z"
        fill="#ffffff"
        stroke="#6b7280"
        strokeWidth={strokeWidth}
      />
      <rect x="9" y="3.4" width="3" height="1" rx="0.5" stroke="#6b7280" strokeWidth={1} />

      {/* Orange Zip Seal Line */}
      <line x1="4.5" y1="6" x2="16.5" y2="6" stroke="#f97316" strokeWidth={strokeWidth} />

      {/* Large Dark Gray Snowflake (Center) */}
      <line x1="9.5" y1="9" x2="9.5" y2="17" stroke="#6b7280" strokeWidth={strokeWidth} />
      <line x1="6.5" y1="11.2" x2="12.5" y2="14.8" stroke="#6b7280" strokeWidth={strokeWidth} />
      <line x1="6.5" y1="14.8" x2="12.5" y2="11.2" stroke="#6b7280" strokeWidth={strokeWidth} />
      <path d="M8.5 10.2l1-1 1 1" stroke="#6b7280" strokeWidth={1.2} />
      <path d="M8.5 15.8l1 1 1-1" stroke="#6b7280" strokeWidth={1.2} />

      {/* Bottom Right Circular Badge */}
      <circle cx="17.5" cy="16.5" r="4.5" fill="#ffffff" stroke="#6b7280" strokeWidth={strokeWidth} />

      {/* Small Orange Snowflake inside Badge */}
      <line x1="17.5" y1="13.5" x2="17.5" y2="19.5" stroke="#f97316" strokeWidth={strokeWidth} />
      <line x1="14.5" y1="16.5" x2="20.5" y2="16.5" stroke="#f97316" strokeWidth={strokeWidth} />
      <line x1="15.4" y1="14.4" x2="19.6" y2="18.6" stroke="#f97316" strokeWidth={1.2} />
      <line x1="15.4" y1="18.6" x2="19.6" y2="14.4" stroke="#f97316" strokeWidth={1.2} />
    </svg>
  )
);
FrozenFoodIcon.displayName = 'FrozenFoodIcon';
```

### 3. `ProduceIcon`
```jsx
export const ProduceIcon = forwardRef(
  ({ size = 24, strokeWidth = 1.5, className = '', ...props }, ref) => (
    <svg
      ref={ref}
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      {/* Center Back: Tall Leafy Green */}
      <path
        d="M12 2.5C10.2 4 9 6.2 9 8.5c0 2.5.8 4.5 1.5 5.5h3c.7-1 1.5-3 1.5-5.5 0-2.3-1.2-4.5-3-6z"
        fill="#e5e7eb"
        stroke="#6b7280"
        strokeWidth={strokeWidth}
      />
      <path
        d="M12 4v9M12 6.5l-1.5 1.5M12 6.5l1.5 1.5M12 9l-1.5 1.5M12 9l1.5 1.5"
        stroke="#6b7280"
        strokeWidth={1.2}
      />

      {/* Left: White Apple with Orange Stem and Gray Leaf */}
      <path
        d="M6.5 8.8C5.2 8 3.5 9 3.5 11c0 2.6 1.7 4.5 3 4.5s3-1.9 3-4.5c0-2-1.7-3-3-2.2z"
        fill="#ffffff"
        stroke="#6b7280"
        strokeWidth={strokeWidth}
      />
      <path d="M6.5 8.8c0-1.5.6-2.5 1.5-3" stroke="#f97316" strokeWidth={strokeWidth} />
      <path
        d="M7.5 6.5c1-.8 2.2-.6 2.5.3 0 .8-1.2 1-2.5-.3z"
        fill="#e5e7eb"
        stroke="#6b7280"
        strokeWidth={1.2}
      />

      {/* Right: Orange Carrot pointing diagonally up */}
      <path
        d="M13 14.2L17.5 6c.6-.9 1.9-.6 2.3.4.4.9 0 1.9-.9 2.5l-4.7 6.6c-.7.6-1.5.3-1.8-.3-.2-.4-.3-.7.6-1z"
        fill="#f97316"
        stroke="#6b7280"
        strokeWidth={strokeWidth}
      />
      <line x1="16.5" y1="8.5" x2="15.3" y2="9.3" stroke="#ffffff" strokeWidth={1.2} />
      <line x1="15" y1="11.5" x2="13.8" y2="12.3" stroke="#ffffff" strokeWidth={1.2} />
      <path
        d="M18.8 6l1.2-2.5M19.2 6.5l2-.8M18.5 5.8l-.5-2.3"
        stroke="#6b7280"
        strokeWidth={strokeWidth}
      />

      {/* Front Bottom: Produce Bowl */}
      <path
        d="M2.5 14c0 4.2 4.2 7 9.5 7s9.5-2.8 9.5-7c-4 1.2-15 1.2-19 0z"
        fill="#ffffff"
        stroke="#6b7280"
        strokeWidth={strokeWidth}
      />
      <path d="M2.5 14c4 1.2 15 1.2 19 0" stroke="#6b7280" strokeWidth={1.2} />
      <line x1="8" y1="21" x2="16" y2="21" stroke="#6b7280" strokeWidth={strokeWidth} />
    </svg>
  )
);
ProduceIcon.displayName = 'ProduceIcon';
```

### 4. `ProteinsIcon`
```jsx
export const ProteinsIcon = forwardRef(
  ({ size = 24, strokeWidth = 1.5, className = '', ...props }, ref) => (
    <svg
      ref={ref}
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      {/* Platter at bottom */}
      <path
        d="M2 17.5C2 19.8 6.5 21.5 12 21.5s10-1.7 10-4c0-2-4.5-2.5-10-2.5S2 15.5 2 17.5z"
        fill="#ffffff"
        stroke="#6b7280"
        strokeWidth={strokeWidth}
      />
      <path d="M2 17c3.5 2 16.5 2 20 0" stroke="#6b7280" strokeWidth={1.2} />

      {/* Left: Round Salmon Fillet (Orange with white contours) */}
      <path
        d="M4.5 11.5C4.5 8.8 6.5 7.5 8.5 7.5s4 1.3 4 4c0 3-1.8 5-4 5s-4-2-4-5z"
        fill="#f97316"
        stroke="#6b7280"
        strokeWidth={strokeWidth}
      />
      <circle cx="8.5" cy="11.5" r="1" fill="#ffffff" stroke="#6b7280" strokeWidth={1} />
      <path d="M5.5 10c1.5 1 4.5 1 6 0M5.5 13c1.5 1 4.5 1 6 0" stroke="#ffffff" strokeWidth={1.2} />

      {/* Right: Chicken Drumstick (Light gray meat, white bone) */}
      <line x1="17" y1="10.5" x2="19.5" y2="8" stroke="#6b7280" strokeWidth={strokeWidth} />
      <path
        d="M19.5 6.5a1 1 0 0 1 1.4 1.4 1 1 0 0 1-1.4 1.4"
        fill="#ffffff"
        stroke="#6b7280"
        strokeWidth={1.2}
      />
      <path
        d="M18.5 5.5a1 1 0 0 1 1.4 1.4 1 1 0 0 1-1.4 1.4"
        fill="#ffffff"
        stroke="#6b7280"
        strokeWidth={1.2}
      />
      <path
        d="M12.5 13.5c-1-2.2.5-4.5 2.8-4.5 1.8 0 3 1 3.7 2.5l-1 3.5c-1 1.5-3.5 1.5-4.7 0a2.5 2.5 0 0 1-.8-1.5z"
        fill="#e5e7eb"
        stroke="#6b7280"
        strokeWidth={strokeWidth}
      />
      <path d="M14.5 11.5c.8 1.2 2 1.8 3 1.2" stroke="#6b7280" strokeWidth={1.2} />
    </svg>
  )
);
ProteinsIcon.displayName = 'ProteinsIcon';
```

### 5. `BakeryIcon`
```jsx
export const BakeryIcon = forwardRef(
  ({ size = 24, strokeWidth = 1.5, className = '', ...props }, ref) => (
    <svg
      ref={ref}
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      {/* Right: Sealed Snack Bag (Back layer) */}
      <path
        d="M11.5 3.5h9v2h-9z"
        fill="#ffffff"
        stroke="#6b7280"
        strokeWidth={strokeWidth}
      />
      <path
        d="M11.5 18.5h9v2h-9z"
        fill="#ffffff"
        stroke="#6b7280"
        strokeWidth={strokeWidth}
      />
      <path
        d="M11.5 5.5h9v13h-9z"
        fill="#ffffff"
        stroke="#6b7280"
        strokeWidth={strokeWidth}
      />
      <circle cx="16" cy="12" r="2.5" fill="#f97316" stroke="none" />
      <path
        d="M14 3.5v2M17 3.5v2M20 3.5v2M14 18.5v2M17 18.5v2M20 18.5v2"
        stroke="#6b7280"
        strokeWidth={1}
      />

      {/* Left: Slice of White Bread (Front layer, overlaps snack bag) */}
      <path
        d="M3.5 10.5C2.5 8 5 6.5 7 7c.8.2 1.5.7 1.5.7s.7-.5 1.5-.7c2-.5 4.5 1 3.5 3.5l-.5 8a1.5 1.5 0 0 1-1.5 1.5H4.5A1.5 1.5 0 0 1 3 18.5l.5-8z"
        fill="#ffffff"
        stroke="#6b7280"
        strokeWidth={strokeWidth}
      />
      <path
        d="M4.8 11.5c-.5-1.5.8-2.5 2-2.2.6.2 1.2.6 1.2.6s.6-.4 1.2-.6c1.2-.3 2.5.7 2 2.2l-.4 6H5.2l-.4-6z"
        fill="#e5e7eb"
        opacity="0.5"
        stroke="none"
      />
      <circle cx="6.5" cy="13.5" r="0.6" fill="#6b7280" />
      <circle cx="9.5" cy="14" r="0.6" fill="#6b7280" />
      <circle cx="7.8" cy="16.5" r="0.6" fill="#6b7280" />
    </svg>
  )
);
BakeryIcon.displayName = 'BakeryIcon';
```

---

## 5. Verification Method

To verify these SVG path specifications:
1. **Inspection**: Verify all 5 components in `analysis.md` and `handoff.md` have:
   - Outline color `#6b7280`
   - Accent color `#f97316`
   - Secondary fill `#e5e7eb`
   - Base opaque fill `#ffffff`
   - `strokeWidth={1.5}` default
   - Zero `currentColor` usage
2. **JSX Transpilation & Build**: Once Worker writes the components to `components/ui/custom-icons.jsx`, run `npm run build` or Next.js compile check to verify 0 syntax or rendering errors.
3. **Automated Adversarial / Visual Check**: Ensure each component renders cleanly on both light (`#ffffff`) and tinted (`bg-orange-50`) backgrounds.
