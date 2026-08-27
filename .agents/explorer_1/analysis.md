# Codebase & Component Survey Analysis

## 1. Executive Summary
This survey investigates the integration of `components/ui/custom-icons.jsx` across the FoodArca application. The target file exports 10 primary category icon components and 18 semantic aliases. These icons represent the 10 grocery inventory categories defined in `lib/constants.js`.

The project is undergoing a complete visual rewrite:
- Moving from the previous `currentColor` + category-tinted fills approach to a **hardcoded color palette** (medium-dark gray `#6b7280` outlines, `#f97316` brand orange accent, `#e5e7eb` light gray secondary fill, and `#ffffff` base fills for background blocking).
- Implementing exact 10 multi-element overlapping compositions.

---

## 2. Icon Exports & Consumers Architecture

### 2.1 Core Exports & Aliases
`components/ui/custom-icons.jsx` provides:

| Primary Icon Component | Category Value | Export Aliases |
| :--- | :--- | :--- |
| `DryGoodsIcon` | `dry_goods` | `GrainSackIcon`, `SackIcon` |
| `FrozenFoodIcon` | `frozen_food` | `SnowflakeIcon` |
| `ProduceIcon` | `produce` | `AppleIcon`, `FruitVegIcon` |
| `ProteinsIcon` | `proteins` | `ChickenLegIcon`, `DrumstickIcon`, `SteakIcon` |
| `BakeryIcon` | `bakery_snacks` | `BreadIcon`, `BakerySnacksIcon`, `LoafBreadIcon` |
| `CannedGoodsIcon` | `canned_goods` | `CanIcon`, `TinCanIcon` |
| `BeveragesIcon` | `beverages` | `WaterBottleIcon`, `BottleIcon` |
| `DairyIcon` | `dairy` | `MilkCartonIcon` |
| `HygieneIcon` | `hygiene` | `SoapIcon`, `SoapBubblesIcon` |
| `OtherIcon` | `other` | `BoxIcon`, `PackageIcon` |

### 2.2 Hub: `lib/constants.js`
All 10 primary icons are imported in `lib/constants.js` and attached to the `categories` array:
```javascript
import {
  DryGoodsIcon,
  FrozenFoodIcon,
  ProduceIcon,
  ProteinsIcon,
  BakeryIcon,
  CannedGoodsIcon,
  BeveragesIcon,
  DairyIcon,
  HygieneIcon,
  OtherIcon,
} from '@/components/ui/custom-icons';

export const categories = [
  { name: 'Dry Goods', icon: DryGoodsIcon, value: 'dry_goods', style: { bg: 'bg-orange-50/50', border: 'border-orange-100', text: 'text-orange-700', badge: 'bg-orange-200' } },
  { name: 'Frozen Food', icon: FrozenFoodIcon, value: 'frozen_food', style: { bg: 'bg-violet-50/50', border: 'border-violet-100', text: 'text-violet-600', badge: 'bg-violet-200' } },
  ...
];
```

### 2.3 UI Consumers Survey
The icons are rendered in diverse layouts across the dashboard, distribution flows, inventory management, modals, and landing pages:

1. **`components/pages/distribution/distribution-desktop-table.jsx` (lines 245–247)**:
   - Rendered inside colored category avatar tiles:
     ```jsx
     <div className={`h-11 w-11 rounded-2xl flex items-center justify-center shrink-0 shadow-sm ${Style.bg} ${Style.text}`}>
       <Icon className="h-5 w-5" strokeWidth={2.5} />
     </div>
     ```
2. **`components/pages/distribution/no-barcode-visual-grid-sheet.jsx` (lines 418–423)**:
   - Rendered at large scale in product cards:
     ```jsx
     <div className={`w-20 h-20 rounded-full ${catVisual.style.bg} flex items-center justify-center`}>
       <catVisual.Icon className="w-12 h-12" strokeWidth={1} />
     </div>
     ```
3. **`components/pages/distribution/quick-action-sheet.jsx` (lines 175–181)**:
   - Rendered in quick selection item rows:
     ```jsx
     <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 border ${catVisual.style.border} ${catVisual.style.bg}`}>
       <catVisual.Icon className={`w-5 h-5 ${catVisual.style.text}`} strokeWidth={1.75} />
     </div>
     ```
4. **`components/pages/distribution/mobile-checkout-cart-view.jsx` (lines 191–197)**:
   - Rendered in checkout cart items:
     ```jsx
     <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 border-2 ${catVisual.style.border} ${catVisual.style.bg}`}>
       <catVisual.Icon className={`h-6 w-6 ${catVisual.style.text}`} strokeWidth={2} />
     </div>
     ```
5. **`components/pages/distribution/distribution-mobile-list.jsx` (lines 163–164, 252–253)**:
   - Rendered with `<Icon className="h-5 w-5" strokeWidth={2.5} />` inside a rounded background badge.
6. **`components/modals/edit-item-modal.jsx` (line 294)**:
   - Rendered in category dropdown list items:
     ```jsx
     <c.icon className="h-4 w-4 mr-2 opacity-70" strokeWidth={2} />
     ```
7. **`components/pages/add-items/desktop-add-view.jsx` (lines 613, 649)**:
   - Rendered in custom select dropdown trigger and menu options:
     ```jsx
     {selectedOption?.icon && <selectedOption.icon className="h-4 w-4 text-[#697386]" strokeWidth={1.8} />}
     ```
8. **`components/pages/inventory/desktop-table-view.jsx` (lines 70, 93)**:
   - Rendered in category filter dropdown items.
9. **`components/pages/add-items/mobile-cart-view.jsx` (lines 197–201)**:
   - Rendered in mobile intake cart items:
     ```jsx
     <catVisual.Icon className={`h-6 w-6 ${catVisual.style.text}`} />
     ```
10. **Marketing & Feature Pages (`MobileExperienceSection.jsx`, `PersonaSection.jsx`)**:
    - Rendered with numeric sizes: `<IconComp size={22} />`, `<IconComp size={28} />`.

---

## 3. Component Interface & Prop Contract

To guarantee seamless drop-in replacement across all caller sites, each icon component must adhere to this exact interface:

```javascript
export const IconName = forwardRef(
  ({ size = 24, strokeWidth = 1.5, className = '', ...props }, ref) => (
    <svg
      ref={ref}
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="#6b7280"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      {/* Visual paths */}
    </svg>
  )
);
IconName.displayName = 'IconName';
```

### Prop Handling Rules:
1. `size`: Accepts number (`24`, `64`, `22`, `28`) or CSS string (`"100%"`), defaulting to `24`.
2. `strokeWidth`: Default `1.5` (or `2`). Svg stroke elements inherit this or can specify explicit strokeWidth if needed.
3. `className`: Defaults to `''`. Allows Tailwind classes (`h-5 w-5`, `w-12 h-12`, `shrink-0`, `hover:...`, etc.).
4. `ref`: Cleanly forwarded to the root `<svg>`.
5. `...props`: Arbitrary attributes like `data-testid`, `aria-label`, `role="img"`, `style={{...}}` are spread onto `<svg>`.
6. `displayName`: Set explicitly on each export.

---

## 4. Visual Rules & Color Tokens

Per the Follow-up Prompt specification:
- **No `currentColor` inheritance**: The outlines must be hardcoded medium-dark gray (`#6b7280` or `#595959`).
- **Primary Accent**: Brand Orange (`#f97316` or `#ea580c`).
- **Secondary Fill**: Soft Light Gray (`#e5e7eb` or `#f3f4f6`) for shading/depth.
- **Base Fill**: Pure White (`#ffffff`) for solid body shapes so foreground elements cleanly occlude background lines in overlapping compositions.
- **Strokes**: Round linecap (`strokeLinecap="round"`) and round linejoin (`strokeLinejoin="round"`).

---

## 5. Build, Lint & Test Infrastructure

| Script / Command | Target / Framework | Status | Notes |
| :--- | :--- | :--- | :--- |
| `npm run build` | Next.js 16.2.10 (Turbopack) | Passing | Successfully compiles all 23 static/dynamic routes in ~10s. |
| `node components/ui/custom-icons.adversarial.mjs` | Node test runner + SWC + React 19 SSR | Passing (old spec) | Will need updating in Phase 4 for new hardcoded color + composition assertions. |
| `package.json` | Dependencies | Validated | React 19.0.0, Next 16.0.0, Lucide React 0.525.0. |

---

## 6. Recommendations for Worker 1
1. Maintain all 10 component names, exact case, `forwardRef`, `displayName`, and all 18 export aliases.
2. Build each icon on the `viewBox="0 0 24 24"` coordinate grid.
3. Ensure every overlapping element uses `fill="#ffffff"` underneath secondary fills/strokes to create clean visual layers.
4. Keep the root `<svg fill="none" stroke="#6b7280" ...>` and use `<path fill="#f97316" stroke="#6b7280" ...>` or explicit inline fills/strokes.
