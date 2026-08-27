# SVG Composition & Geometric Analysis: Category Icons 1–5

**Explorer 2 Investigation Report**
**Target**: Category Icons 1 to 5 (`DryGoodsIcon`, `FrozenFoodIcon`, `ProduceIcon`, `ProteinsIcon`, `BakeryIcon`)
**Workspace**: `FoodArca / components/ui/custom-icons.jsx`

---

## 1. Executive Summary & Design System

This analysis provides the exact geometric coordinates, layering hierarchy, SVG path data, and complete React JSX component specifications for the first 5 grocery category icons in the FoodArca design system rewrite.

### Aesthetic System Rules Compliance
1. **Hardcoded Color Palette (NO `currentColor`)**:
   - **Primary Outline**: Medium-dark gray (`#6b7280` / `#595959`)
   - **Primary Accent**: Brand Orange (`#f97316`)
   - **Secondary Fill**: Light Gray (`#e5e7eb` / `#d1d5db`) for subtle shading, veins, and glass body
   - **Base Fill**: Pure White (`#ffffff`) for opaque body blocking on all overlapping elements
2. **Stroke Geometry**:
   - Standard stroke width: `1.5` (with `strokeWidth` prop support defaulting to `1.5`)
   - Line terminations: `strokeLinecap="round"`, `strokeLinejoin="round"`
3. **Grid & Canvas**:
   - ViewBox: `0 0 24 24`
   - Bounding Box: Symmetrical padding (~2px to 22px), optically balanced center of gravity
4. **Layering & Depth**:
   - Front elements use `fill="#ffffff"` to naturally occlude and layer over background elements without alpha bleed or overlapping line clutter.

---

## 2. Detailed Icon Specifications (Icons 1 to 5)

---

### Icon 1: `DryGoodsIcon`

#### Composition Concept
A tall flour/grain bag on the left with a brand orange wheat stalk graphic, overlapping a shorter glass storage jar on the right with textured grain dots.

#### Visual Hierarchy & Layers
1. **Layer 1 (Right Back - Glass Jar)**:
   - **Lid**: Rounded rectangular lid (`x="13.5" y="8" width="6.5" height="2" rx="0.6"`) with `fill="#ffffff" stroke="#6b7280"`.
   - **Jar Body**: Tapered glass shoulder and base (`d="M14.5 10 h4.5 a2 2 0 0 1 2 2 v6.5 a2 2 0 0 1-2 2 h-5 a2 2 0 0 1-2-2 V12 a2 2 0 0 1 2.5-2 z"`) with `fill="#e5e7eb" stroke="#6b7280"`.
   - **Texture Dots (Grain/Rice/Seeds)**: 5 dot indicators inside jar:
     - Gray dots: `cx="15.5" cy="14" r="0.75"`, `cx="18" cy="14.5" r="0.75"`, `cx="15" cy="17.5" r="0.75"`, `cx="18.2" cy="17.8" r="0.75"` with `fill="#6b7280"`.
     - Accent dot: `cx="16.8" cy="16" r="0.75"` with `fill="#f97316"`.
2. **Layer 2 (Left Front - Tall Flour / Grain Bag)**:
   - **Bag Body**: Upright sack (`d="M4 5.5 h7.5 l1 13.5 a1.8 1.8 0 0 1-1.8 1.8 H4.8 a1.8 1.8 0 0 1-1.8-1.8 L4 5.5 z"`) with `fill="#ffffff" stroke="#6b7280"`.
   - **Bag Rolled Collar / Folded Top**: (`d="M3.5 3.5 h8.5 a1 1 0 0 1 1 1 v1 a1 1 0 0 1-1 1 H3.5 a1 1 0 0 1-1-1 v-1 a1 1 0 0 1 1-1 z"`) with `fill="#ffffff" stroke="#6b7280"`.
3. **Layer 3 (Wheat Stalk Graphic - Brand Orange)**:
   - **Central Stem**: `d="M7.8 9.5 v7"` with `stroke="#f97316" strokeWidth={1.5}`.
   - **Top Awns / Kernels**: `d="M6.3 8 L7.8 9.5 L9.3 8"` with `stroke="#f97316" strokeWidth={1.5}`.
   - **Middle Kernels 1**: `d="M5.8 11.8 L7.8 10.3 L9.8 11.8"` with `stroke="#f97316" strokeWidth={1.5}`.
   - **Middle Kernels 2**: `d="M5.8 14.3 L7.8 12.8 L9.8 14.3"` with `stroke="#f97316" strokeWidth={1.5}`.

#### Complete JSX Template
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

---

### Icon 2: `FrozenFoodIcon`

#### Composition Concept
A tall stand-up freezer bag with a large dark gray snowflake in the center and an orange seal line at the top. A circular badge overlaps the bottom right containing a smaller orange snowflake.

#### Visual Hierarchy & Layers
1. **Layer 1 (Freezer Bag Body & Seal)**:
   - **Top Header Strip**: Sealed strip with sombrero punch hole (`d="M4.5 2.5 h12 a1 1 0 0 1 1 1 v2 H3.5 v-2 a1 1 0 0 1 1-1 z"`) with `fill="#ffffff" stroke="#6b7280" strokeWidth={1.5}`.
   - **Punch Hole**: `<rect x="9" y="3.4" width="3" height="1" rx="0.5" stroke="#6b7280" strokeWidth={1} />`.
   - **Stand-up Pouch Body**: (`d="M4.5 5.5 L5 19.5 a1.8 1.8 0 0 0 1.8 1.8 h7.4 a1.8 1.8 0 0 0 1.8-1.8 L16.5 5.5 H4.5 z"`) with `fill="#ffffff" stroke="#6b7280" strokeWidth={1.5}`.
   - **Orange Zip Seal Line**: `<line x1="4.5" y1="6" x2="16.5" y2="6" stroke="#f97316" strokeWidth={1.5} />`.
2. **Layer 2 (Large Dark Gray Snowflake in Center)**:
   - **Vertical Spine**: `<line x1="9.5" y1="9" x2="9.5" y2="17" stroke="#6b7280" strokeWidth={1.5} />`.
   - **Diagonal Spine 1**: `<line x1="6.5" y1="11.2" x2="12.5" y2="14.8" stroke="#6b7280" strokeWidth={1.5} />`.
   - **Diagonal Spine 2**: `<line x1="6.5" y1="14.8" x2="12.5" y2="11.2" stroke="#6b7280" strokeWidth={1.5} />`.
   - **Snowflake Branch Ticks**:
     - Top branch: `<path d="M8.5 10.2 l1-1 l1 1" stroke="#6b7280" strokeWidth={1.2} />`.
     - Bottom branch: `<path d="M8.5 15.8 l1 1 l1-1" stroke="#6b7280" strokeWidth={1.2} />`.
3. **Layer 3 (Circular Badge - Bottom Right)**:
   - **Circular Container**: `<circle cx="17.5" cy="16.5" r="4.5" fill="#ffffff" stroke="#6b7280" strokeWidth={1.5} />`.
4. **Layer 4 (Small Orange Snowflake inside Badge)**:
   - **Vertical**: `<line x1="17.5" y1="13.5" x2="17.5" y2="19.5" stroke="#f97316" strokeWidth={1.5} />`.
   - **Horizontal**: `<line x1="14.5" y1="16.5" x2="20.5" y2="16.5" stroke="#f97316" strokeWidth={1.5} />`.
   - **Diagonals**:
     - `<line x1="15.4" y1="14.4" x2="19.6" y2="18.6" stroke="#f97316" strokeWidth={1.2} />`.
     - `<line x1="15.4" y1="18.6" x2="19.6" y2="14.4" stroke="#f97316" strokeWidth={1.2} />`.

#### Complete JSX Template
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

---

### Icon 3: `ProduceIcon`

#### Composition Concept
A produce bowl at the bottom. Inside and behind the bowl: a white apple on the left (with an orange stem and gray leaf), a tall light-gray leafy green in the center back, and an orange carrot on the right pointing diagonally up.

#### Visual Hierarchy & Layers
1. **Layer 1 (Center Back - Tall Light-Gray Leafy Green)**:
   - **Leaf Head**: (`d="M12 2.5 C10.2 4 9 6.2 9 8.5 c0 2.5.8 4.5 1.5 5.5 h3 c.7-1 1.5-3 1.5-5.5 0-2.3-1.2-4.5-3-6 z"`) with `fill="#e5e7eb" stroke="#6b7280" strokeWidth={1.5}`.
   - **Leaf Vein Ribs**: (`d="M12 4 v9 M12 6.5 l-1.5 1.5 M12 6.5 l1.5 1.5 M12 9 l-1.5 1.5 M12 9 l1.5 1.5"`) with `stroke="#6b7280" strokeWidth={1.2}`.
2. **Layer 2 (Left - White Apple)**:
   - **Apple Body**: (`d="M6.5 8.8 C5.2 8 3.5 9 3.5 11 c0 2.6 1.7 4.5 3 4.5 s3-1.9 3-4.5 c0-2-1.7-3-3-2.2 z"`) with `fill="#ffffff" stroke="#6b7280" strokeWidth={1.5}`.
   - **Apple Stem (Brand Orange)**: (`d="M6.5 8.8 c0-1.5.6-2.5 1.5-3"`) with `stroke="#f97316" strokeWidth={1.5}`.
   - **Apple Leaf (Light Gray)**: (`d="M7.5 6.5 c1-.8 2.2-.6 2.5.3 0 .8-1.2 1-2.5-.3 z"`) with `fill="#e5e7eb" stroke="#6b7280" strokeWidth={1.2}`.
3. **Layer 3 (Right - Orange Carrot)**:
   - **Carrot Body**: (`d="M13 14.2 L17.5 6 c.6-.9 1.9-.6 2.3.4 .4.9 0 1.9-.9 2.5 l-4.7 6.6 c-.7.6-1.5.3-1.8-.3 -.2-.4-.3-.7.6-1 z"`) with `fill="#f97316" stroke="#6b7280" strokeWidth={1.5}`.
   - **Carrot Notches (White)**: White highlight ridges `<line x1="16.5" y1="8.5" x2="15.3" y2="9.3" stroke="#ffffff" strokeWidth={1.2} />`, `<line x1="15" y1="11.5" x2="13.8" y2="12.3" stroke="#ffffff" strokeWidth={1.2} />`.
   - **Carrot Fronds (Gray)**: `<path d="M18.8 6 l1.2-2.5 M19.2 6.5 l2-.8 M18.5 5.8 l-.5-2.3" stroke="#6b7280" strokeWidth={1.5} />`.
4. **Layer 4 (Front Bottom - Bowl)**:
   - **Bowl Silhouette**: (`d="M2.5 14 c0 4.2 4.2 7 9.5 7 s9.5-2.8 9.5-7 c-4 1.2-15 1.2-19 0 z"`) with `fill="#ffffff" stroke="#6b7280" strokeWidth={1.5}`.
   - **Bowl Foot & Rim**: `<line x1="8" y1="21" x2="16" y2="21" stroke="#6b7280" strokeWidth={1.5} />` and `<path d="M2.5 14 c4 1.2 15 1.2 19 0" stroke="#6b7280" strokeWidth={1.2} />`.

#### Complete JSX Template
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

---

### Icon 4: `ProteinsIcon`

#### Composition Concept
A serving platter/plate at the bottom. On the left, a round salmon fillet (orange fill, white contour lines). On the right, a chicken drumstick (light gray meat fill, white bone, dark gray outline).

#### Visual Hierarchy & Layers
1. **Layer 1 (Bottom - Platter / Plate)**:
   - **Platter Base**: (`d="M2 17.5 C2 19.8 6.5 21.5 12 21.5 s10-1.7 10-4 c0-2-4.5-2.5-10-2.5 S2 15.5 2 17.5 z"`) with `fill="#ffffff" stroke="#6b7280" strokeWidth={1.5}`.
   - **Platter Lip**: `<path d="M2 17 c3.5 2 16.5 2 20 0" stroke="#6b7280" strokeWidth={1.2} />`.
2. **Layer 2 (Left - Round Salmon Fillet)**:
   - **Salmon Meat Cut**: (`d="M4.5 11.5 C4.5 8.8 6.5 7.5 8.5 7.5 s4 1.3 4 4 c0 3-1.8 5-4 5 s-4-2-4-5 z"`) with `fill="#f97316" stroke="#6b7280" strokeWidth={1.5}`.
   - **Center Spine Core**: `<circle cx="8.5" cy="11.5" r="1" fill="#ffffff" stroke="#6b7280" strokeWidth={1} />`.
   - **White Muscle Contour Lines**: (`d="M5.5 10 c1.5 1 4.5 1 6 0 M5.5 13 c1.5 1 4.5 1 6 0"`) with `stroke="#ffffff" strokeWidth={1.2}`.
3. **Layer 3 (Right - Chicken Drumstick)**:
   - **White Bone Shaft & Knobs**:
     - Shaft: `<line x1="17" y1="10.5" x2="19.5" y2="8" stroke="#6b7280" strokeWidth={1.5} />`.
     - Double condyle knobs:
       `<path d="M19.5 6.5 a1 1 0 0 1 1.4 1.4 1 1 0 0 1-1.4 1.4" fill="#ffffff" stroke="#6b7280" strokeWidth={1.2} />`
       `<path d="M18.5 5.5 a1 1 0 0 1 1.4 1.4 1 1 0 0 1-1.4 1.4" fill="#ffffff" stroke="#6b7280" strokeWidth={1.2} />`
   - **Plump Light-Gray Meat Bulb**:
     (`d="M12.5 13.5 c-1-2.2.5-4.5 2.8-4.5 1.8 0 3 1 3.7 2.5 l-1 3.5 c-1 1.5-3.5 1.5-4.7 0 a2.5 2.5 0 0 1-.8-1.5 z"`) with `fill="#e5e7eb" stroke="#6b7280" strokeWidth={1.5}`.
   - **Crisp Skin Contour Notch**: `<path d="M14.5 11.5 c.8 1.2 2 1.8 3 1.2" stroke="#6b7280" strokeWidth={1.2} />`.

#### Complete JSX Template
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

---

### Icon 5: `BakeryIcon`

#### Composition Concept
A slice of white bread on the left, overlapping a sealed snack bag on the right (the bag has an orange circle graphic).

#### Visual Hierarchy & Layers
1. **Layer 1 (Right Back - Sealed Snack Bag)**:
   - **Top Crimp Strip**: (`d="M11.5 3.5 h9 v2 h-9 z"`) with `fill="#ffffff" stroke="#6b7280" strokeWidth={1.5}`.
   - **Bottom Crimp Strip**: (`d="M11.5 18.5 h9 v2 h-9 z"`) with `fill="#ffffff" stroke="#6b7280" strokeWidth={1.5}`.
   - **Crimp Hash Ridges**: `<path d="M14 3.5 v2 M17 3.5 v2 M20 3.5 v2 M14 18.5 v2 M17 18.5 v2 M20 18.5 v2" stroke="#6b7280" strokeWidth={1} />`.
   - **Bag Main Body**: (`d="M11.5 5.5 h9 v13 h-9 z"`) with `fill="#ffffff" stroke="#6b7280" strokeWidth={1.5}`.
   - **Orange Circle Graphic**: `<circle cx="16" cy="12" r="2.5" fill="#f97316" stroke="none" />`.
2. **Layer 2 (Left Front - Slice of White Bread / Toast)**:
   - **Bread Loaf Slice Outer Silhouette**:
     (`d="M3.5 10.5 C2.5 8 5 6.5 7 7 c.8.2 1.5.7 1.5.7 s.7-.5 1.5-.7 c2-.5 4.5 1 3.5 3.5 l-.5 8 a1.5 1.5 0 0 1-1.5 1.5 H4.5 A1.5 1.5 0 0 1 3 18.5 l.5-8 z"`) with `fill="#ffffff" stroke="#6b7280" strokeWidth={1.5}`.
   - **Inner Soft Crumb / Toast Accent**:
     (`d="M4.8 11.5 c-.5-1.5.8-2.5 2-2.2 .6.2 1.2.6 1.2.6 s.6-.4 1.2-.6 c1.2-.3 2.5.7 2 2.2 l-.4 6 H5.2 l-.4-6 z"`) with `fill="#e5e7eb" opacity="0.5" stroke="none"`.
   - **Crumb Texture Air Pockets**:
     - `<circle cx="6.5" cy="13.5" r="0.6" fill="#6b7280" />`
     - `<circle cx="9.5" cy="14" r="0.6" fill="#6b7280" />`
     - `<circle cx="7.8" cy="16.5" r="0.6" fill="#6b7280" />`

#### Complete JSX Template
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

## 3. Comparison Matrix: Legacy vs New Design

| Icon Component | Legacy Composition | New Target Composition | Palette Compliance | Overlap Mechanism |
| :--- | :--- | :--- | :--- | :--- |
| **`DryGoodsIcon`** | Single tied sack with grain stalk | Flour bag on left (wheat stalk) + glass jar on right (dots) | `#6b7280` outline, `#f97316` wheat, `#e5e7eb` jar, `#ffffff` bag | Bag has opaque `#ffffff` base fill over jar |
| **`FrozenFoodIcon`** | Single popsicle bar on stick | Tall freezer bag (snowflake) + orange seal line + circular badge with small orange snowflake | `#6b7280` outline, `#f97316` seal & small snowflake, `#ffffff` bag & badge | Bag & circular badge use `#ffffff` fill |
| **`ProduceIcon`** | Single cabbage head | Bowl at bottom + white apple on left (orange stem & gray leaf) + tall leafy green center + orange carrot right | `#6b7280` outline, `#f97316` stem & carrot, `#e5e7eb` leafy green & leaf, `#ffffff` apple & bowl | Bowl in front with `#ffffff` fill occludes base of vegetables/apple |
| **`ProteinsIcon`** | Single prime steak cut | Platter at bottom + salmon fillet on left (orange fill, white lines) + chicken drumstick on right (gray meat, white bone) | `#6b7280` outline, `#f97316` salmon, `#e5e7eb` meat, `#ffffff` platter & bone & salmon lines | Platter base underneath, items arranged left/right with white fills |
| **`BakeryIcon`** | Single French croissant | Slice of white bread on left + sealed snack bag on right (orange circle graphic) | `#6b7280` outline, `#f97316` circle badge, `#e5e7eb` inner crumb, `#ffffff` bread & bag | Bread on left has opaque `#ffffff` base fill over snack bag |

---

## 4. Downstream Implementer Guidance

1. All 5 components are fully standalone, standard React JSX components wrapped with `React.forwardRef`.
2. Do not pass `stroke={color}` from props to internal paths; keep all stroke and fill colors hardcoded as specified.
3. Ensure aliases (`GrainSackIcon`, `SackIcon`, `SnowflakeIcon`, `AppleIcon`, `FruitVegIcon`, `ChickenLegIcon`, `DrumstickIcon`, `SteakIcon`, `BreadIcon`, `BakerySnacksIcon`, `LoafBreadIcon`) are preserved at the bottom of `custom-icons.jsx`.
