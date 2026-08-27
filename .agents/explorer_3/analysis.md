# SVG Composition Blueprint & Specification (Icons 6–10)

## Overview & Design System
This document specifies the exact SVG geometric paths, coordinate layouts, layer hierarchy, and aesthetic implementation for Icons 6 to 10 in the FoodArca custom category icon library (`components/ui/custom-icons.jsx`).

### Unified Aesthetic Rules
1. **Palette (Hardcoded Colors — No `currentColor`):**
   - **Outlines (`#6b7280`):** Neutral gray-500 for clear, crisp silhouettes.
   - **Primary Accent (`#f97316`):** Vibrant brand orange for focal elements, labels, graphics, and highlights.
   - **Secondary Fill (`#e5e7eb`):** Light gray-200 for metallic surfaces, lids, rims, and subtle dimensional shading.
   - **Base Mask Fill (`#ffffff`):** Opaque white for solid body fills that cleanly block overlapping elements beneath them.
2. **Stroke & Geometry:**
   - Default `strokeWidth={1.5}` (with optional `2` for prominent accents).
   - `strokeLinecap="round"`, `strokeLinejoin="round"`.
   - Grid & ViewBox: Exactly calibrated to the standard `24x24` viewBox (`viewBox="0 0 24 24"`).
3. **Layering Model:**
   - **Layer 1 (Background element):** Base fill `#ffffff`, secondary shading `#e5e7eb`, accent highlights `#f97316`, outline stroke `#6b7280`.
   - **Layer 2 (Foreground overlapping element):** Base fill `#ffffff` (masks out Layer 1), secondary fill `#e5e7eb`, accent graphics `#f97316`, outline stroke `#6b7280`.

---

## Detailed Specifications for Icons 6 to 10

### 1. `CannedGoodsIcon` (Icon #6)
- **Concept:** Overlapping two-can composition featuring a tall ribbed industrial can in the back right and a shorter pantry can in the front left with a tomato graphic label.
- **Bounding Box:** `x: 3.0` to `21.0`, `y: 3.5` to `21.0` (Height: 17.5, Width: 18.0)
- **Layer Breakdown:**
  1. *Back Tall Can Body:* Path cylinder from `x: 12` to `21`, `y: 3.5` to `19.0` with `fill="#ffffff"` and `stroke="#6b7280"`.
  2. *Back Can Metallic Lid:* Ellipse at `cx="16.5" cy="4.5" rx="4.5" ry="1.2"` with `fill="#e5e7eb"` and `stroke="#6b7280"`.
  3. *Back Can Orange Top Stripe:* Filled rectangle path `M12 7.5 H21 V9.5 H12 Z` with `fill="#f97316" stroke="none"`.
  4. *Back Can Ribs:* Three horizontal line ridges at `y=12.0`, `y=14.5`, and `y=17.0` spanning `x: 12` to `21` with `stroke="#6b7280"`.
  5. *Front Shorter Can Body:* Path cylinder from `x: 3` to `13.5`, `y: 9.0` to `19.5` with `fill="#ffffff"` (blocks back can) and `stroke="#6b7280"`.
  6. *Front Can Metallic Lid & Pull-Tab:* Ellipse `cx="8.25" cy="10" rx="5.25" ry="1.4"` with `fill="#e5e7eb"`; pull-tab ring `cx="8.25" cy="9.8" rx="1.5" ry="0.6"` and lever `x: 8.25, y: 9.2->8.2`.
  7. *Front Can Tomato Graphic:* Central tomato circle `cx="8.25" cy="15.5" r="2.3"` with `fill="#f97316" stroke="#f97316"`; tomato calyx/stem `M8.25 13.2 V12.4 M7.2 13.6 L8.25 13 L9.3 13.6` with `stroke="#6b7280" strokeWidth="1"`.

```jsx
// 6. Canned Goods - Tall ribbed can (back right) & shorter can with tomato graphic (front left)
export const CannedGoodsIcon = forwardRef(
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
      {/* Back tall ribbed can */}
      <path d="M12 4.5 C12 3.5 21 3.5 21 4.5 V19 C21 20.2 12 20.2 12 19 Z" fill="#ffffff" stroke="#6b7280" />
      <ellipse cx="16.5" cy="4.5" rx="4.5" ry="1.2" fill="#e5e7eb" stroke="#6b7280" />
      <path d="M12 7.5 H21 V9.5 H12 Z" fill="#f97316" stroke="none" />
      <line x1="12" y1="12" x2="21" y2="12" stroke="#6b7280" />
      <line x1="12" y1="14.5" x2="21" y2="14.5" stroke="#6b7280" />
      <line x1="12" y1="17" x2="21" y2="17" stroke="#6b7280" />
      {/* Front shorter can (overlapping) */}
      <path d="M3 10 C3 9 13.5 9 13.5 10 V19.5 C13.5 21 3 21 3 19.5 Z" fill="#ffffff" stroke="#6b7280" />
      <ellipse cx="8.25" cy="10" rx="5.25" ry="1.4" fill="#e5e7eb" stroke="#6b7280" />
      <ellipse cx="8.25" cy="9.8" rx="1.5" ry="0.6" stroke="#6b7280" />
      <line x1="8.25" y1="9.2" x2="8.25" y2="8.2" stroke="#6b7280" />
      {/* Tomato graphic */}
      <circle cx="8.25" cy="15.5" r="2.3" fill="#f97316" stroke="#f97316" />
      <path d="M8.25 13.2 V12.4 M7.2 13.6 L8.25 13 L9.3 13.6" stroke="#6b7280" strokeWidth="1" />
    </svg>
  )
);
CannedGoodsIcon.displayName = 'CannedGoodsIcon';
```

---

### 2. `BeveragesIcon` (Icon #7)
- **Concept:** Dual drink composition featuring a tall water bottle on the left (with cap and orange water drop) overlapping a shorter soda/seltzer can on the right (with metallic lid, pull-tab, and orange wave graphic).
- **Bounding Box:** `x: 3.0` to `21.0`, `y: 2.5` to `21.5` (Height: 19.0, Width: 18.0)
- **Layer Breakdown:**
  1. *Tall Bottle Cap:* Metallic cap `x: 5.5` to `9.0`, `y: 2.5` to `4.5` with `fill="#e5e7eb"` and `stroke="#6b7280"`.
  2. *Tall Bottle Body:* Contoured flask silhouette `M6.2 4.5 V6.5 L3 9.5 V19.5 C3 20.5 4 21.5 5 21.5 H9.5 C10.5 21.5 11.5 20.5 11.5 19.5 V9.5 L8.3 6.5 V4.5` with `fill="#ffffff"` and `stroke="#6b7280"`.
  3. *Tall Bottle Base Shading:* Line at `y=19.0` with `stroke="#e5e7eb"`.
  4. *Orange Water Drop Graphic:* Water drop at `cx=7.25, cy=16.3` with `fill="#f97316" stroke="#f97316"`.
  5. *Shorter Soda Can Body:* Beveled soda can `M12.5 7.5 H19.5 L21 9 V19.5 C21 20.5 20 21.5 19 21.5 H13 C12 21.5 11 20.5 11 19.5 V9 L12.5 7.5 Z` with `fill="#ffffff"` (masks out bottle on left) and `stroke="#6b7280"`.
  6. *Soda Can Top Rim & Bevel:* Ellipse `cx="16" cy="7.5" rx="3.5" ry="1"` with `fill="#e5e7eb"`, pull tab `M15 7.5 H17`, and upper collar seam `y=9.0`.
  7. *Soda Can Orange Wave Graphic:* Flowing wave ribbon `M11 14.5 C13 13 14.5 16 17 14.5 C18.5 13.5 19.8 14 21 14.5 V16.5 C19.8 16 18.5 15.5 17 16.5 C14.5 18 13 15 11 16.5 Z` with `fill="#f97316" stroke="none"` and crest curve with `stroke="#f97316"`.

```jsx
// 7. Beverages - Tall bottle with orange water drop (left) & shorter soda can with orange wave (right)
export const BeveragesIcon = forwardRef(
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
      {/* Bottle cap */}
      <rect x="5.5" y="2.5" width="3.5" height="2" rx="0.5" fill="#e5e7eb" stroke="#6b7280" />
      {/* Bottle body */}
      <path d="M6.2 4.5 V6.5 L3 9.5 V19.5 C3 20.5 4 21.5 5 21.5 H9.5 C10.5 21.5 11.5 20.5 11.5 19.5 V9.5 L8.3 6.5 V4.5" fill="#ffffff" stroke="#6b7280" />
      <path d="M4 19 H10.5" stroke="#e5e7eb" />
      {/* Orange water drop graphic */}
      <path d="M7.25 12.5 C6.2 14 5.5 15.2 5.5 16.3 C5.5 17.5 6.3 18.5 7.25 18.5 C8.2 18.5 9 17.5 9 16.3 C9 15.2 8.3 14 7.25 12.5 Z" fill="#f97316" stroke="#f97316" />
      {/* Shorter soda can (overlapping) */}
      <path d="M12.5 7.5 H19.5 L21 9 V19.5 C21 20.5 20 21.5 19 21.5 H13 C12 21.5 11 20.5 11 19.5 V9 L12.5 7.5 Z" fill="#ffffff" stroke="#6b7280" />
      <ellipse cx="16" cy="7.5" rx="3.5" ry="1" fill="#e5e7eb" stroke="#6b7280" />
      <path d="M15 7.5 H17" stroke="#6b7280" />
      <line x1="11" y1="9" x2="21" y2="9" stroke="#6b7280" />
      <line x1="11" y1="19.5" x2="21" y2="19.5" stroke="#e5e7eb" />
      {/* Orange wave graphic */}
      <path d="M11 14.5 C13 13 14.5 16 17 14.5 C18.5 13.5 19.8 14 21 14.5 V16.5 C19.8 16 18.5 15.5 17 16.5 C14.5 18 13 15 11 16.5 Z" fill="#f97316" stroke="none" />
      <path d="M11 14.5 C13 13 14.5 16 17 14.5 C18.5 13.5 19.8 14 21 14.5" stroke="#f97316" fill="none" />
    </svg>
  )
);
BeveragesIcon.displayName = 'BeveragesIcon';
```

---

### 3. `DairyIcon` (Icon #8)
- **Concept:** Wholesome dairy pairing consisting of a tall vintage glass milk bottle on the left (featuring a detailed cow face outline graphic) and a yogurt tub on the right (with bright orange foil peel lid and a spoon sticking out).
- **Bounding Box:** `x: 3.0` to `23.0`, `y: 2.5` to `21.5` (Height: 19.0, Width: 20.0)
- **Layer Breakdown:**
  1. *Milk Bottle Foil Cap & Neck:* Top cap `M5.5 2.5 H9.5 V4 H5.5 Z` with `fill="#e5e7eb"` and `stroke="#6b7280"`.
  2. *Milk Bottle Body:* Glass bottle `M6 4 V6 L3 9 V19.5 C3 20.5 4 21.5 5 21.5 H10 C11 21.5 12 20.5 12 19.5 V9 L9 6 V4` with `fill="#ffffff"` and `stroke="#6b7280"`.
  3. *Liquid Level Shading:* Meniscus line `M3 10.5 C5 10 7 11 12 10.5` with `stroke="#e5e7eb"`.
  4. *Cow Face Graphic:*
     - Muzzle: Ellipse `cx="7.5" cy="16" rx="2" ry="1.2"` with `fill="#e5e7eb" stroke="#6b7280" strokeWidth="1"`.
     - Nostrils: Two small solid dots at `(6.8, 16)` and `(8.2, 16)`.
     - Head crown: Arc `M6 14.5 C5.8 13.2 9.2 13.2 9 14.5`.
     - Horns & Ears: Diagonal horn lines `(6.3, 13.2)->(5.8, 12.2)` and `(8.7, 13.2)->(9.2, 12.2)`; curved ears.
     - Eyes: Eye dots at `(6.6, 14)` and `(8.4, 14)`.
  5. *Yogurt Spoon:* Sticking out diagonally from inside cup `M15.5 10.5 L18.5 5 C19.2 3.8 21 4.8 20.2 6.2 L17.5 11` with `fill="#ffffff"` and `stroke="#6b7280"`.
  6. *Yogurt Cup Body:* Tapered tub `M12 11.5 L13.5 19.8 C13.7 20.6 14.2 21.2 15 21.2 H18.5 C19.3 21.2 19.8 20.6 20 19.8 L21.5 11.5 Z` with `fill="#ffffff"` and `stroke="#6b7280"`.
  7. *Yogurt Orange Lid:* Prominent foil rim `M11 10 C11 9.5 11.5 9 12 9 H21.5 C22 9 22.5 9.5 22.5 10 V11.5 H11 Z` with `fill="#f97316" stroke="#f97316"`, plus corner pull tab `M22.5 11.5 L23 13`.
  8. *Cup Label Shading:* Horizontal band `M12.7 15.5 H20.8` with `stroke="#e5e7eb" strokeWidth="1.5"`.

```jsx
// 8. Dairy - Tall milk bottle with cow face graphic (left) & yogurt cup with orange lid and spoon (right)
export const DairyIcon = forwardRef(
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
      {/* Milk bottle cap & body */}
      <path d="M5.5 2.5 H9.5 V4 H5.5 Z" fill="#e5e7eb" stroke="#6b7280" />
      <path d="M6 4 V6 L3 9 V19.5 C3 20.5 4 21.5 5 21.5 H10 C11 21.5 12 20.5 12 19.5 V9 L9 6 V4" fill="#ffffff" stroke="#6b7280" />
      <path d="M3 10.5 C5 10 7 11 12 10.5" stroke="#e5e7eb" />
      {/* Cow face outline graphic */}
      <ellipse cx="7.5" cy="16" rx="2" ry="1.2" fill="#e5e7eb" stroke="#6b7280" strokeWidth="1" />
      <circle cx="6.8" cy="16" r="0.35" fill="#6b7280" stroke="none" />
      <circle cx="8.2" cy="16" r="0.35" fill="#6b7280" stroke="none" />
      <path d="M6 14.5 C5.8 13.2 9.2 13.2 9 14.5" stroke="#6b7280" strokeWidth="1" />
      <path d="M6.3 13.2 L5.8 12.2 M8.7 13.2 L9.2 12.2" stroke="#6b7280" strokeWidth="1" />
      <path d="M5.6 13.8 C4.8 13.4 5 14.4 5.6 14.5 M9.4 13.8 C10.2 13.4 10 14.4 9.4 14.5" stroke="#6b7280" strokeWidth="1" />
      <circle cx="6.6" cy="14" r="0.3" fill="#6b7280" stroke="none" />
      <circle cx="8.4" cy="14" r="0.3" fill="#6b7280" stroke="none" />
      {/* Spoon sticking out from yogurt cup */}
      <path d="M15.5 10.5 L18.5 5 C19.2 3.8 21 4.8 20.2 6.2 L17.5 11" fill="#ffffff" stroke="#6b7280" />
      {/* Yogurt cup body */}
      <path d="M12 11.5 L13.5 19.8 C13.7 20.6 14.2 21.2 15 21.2 H18.5 C19.3 21.2 19.8 20.6 20 19.8 L21.5 11.5 Z" fill="#ffffff" stroke="#6b7280" />
      {/* Orange lid */}
      <path d="M11 10 C11 9.5 11.5 9 12 9 H21.5 C22 9 22.5 9.5 22.5 10 V11.5 H11 Z" fill="#f97316" stroke="#f97316" />
      <path d="M22.5 11.5 L23 13" stroke="#f97316" strokeWidth="1.5" />
      <path d="M12.7 15.5 H20.8" stroke="#e5e7eb" strokeWidth="1.5" />
    </svg>
  )
);
DairyIcon.displayName = 'DairyIcon';
```

---

### 4. `HygieneIcon` (Icon #9)
- **Concept:** Personal care essential pairing of a liquid soap pump dispenser on the left (with an orange pump actuator and an orange drop motif) overlapping a soft toilet paper roll on the right (with cylindrical oval, hollow core, and a draped perforated sheet).
- **Bounding Box:** `x: 2.5` to `21.5`, `y: 2.5` to `21.5` (Height: 19.0, Width: 19.0)
- **Layer Breakdown:**
  1. *Orange Pump Mechanism:* Plunger head `M4 4.5 H8.5 C9 4.5 9.5 4 9.5 3.5 V2.5 H6.5` with `stroke="#f97316"`, stem `line x1="7.5" y1="4.5" x2="7.5" y2="7"` with `stroke="#f97316"`.
  2. *Orange Dispenser Drop:* Falling teardrop from spout `M4 6.5 C3.3 7.5 3 8.2 3 8.8 C3 9.5 3.5 10 4 10 C4.5 10 5 9.5 5 8.8 C5 8.2 4.7 7.5 4 6.5 Z` with `fill="#f97316" stroke="#f97316"`.
  3. *Bottle Collar:* Metallic screw collar `x: 5.5, y: 6.5, w: 4, h: 1.5` with `fill="#e5e7eb" stroke="#6b7280"`.
  4. *Bottle Body & Label Drop:* White bottle body `M6 8 L2.5 10 V19.5 C2.5 20.5 3.5 21.5 4.5 21.5 H10 C11 21.5 12 20.5 12 19.5 V10 L8.5 8 Z` with `fill="#ffffff" stroke="#6b7280"`, and second orange drop emblem centered on bottle.
  5. *Toilet Paper Roll Body:* Cylinder body `M11.5 8.5 V17 C11.5 19 20.5 19 20.5 17 V8.5 Z` with `fill="#ffffff"` (masks out pump bottle on left) and `stroke="#6b7280"`.
  6. *TP Roll Top Oval & Core:* Top ellipse `cx="16" cy="8.5" rx="4.5" ry="2"` with `fill="#e5e7eb" stroke="#6b7280"`, inner core ellipse `cx="16" cy="8.5" rx="1.8" ry="0.8"` with `fill="#ffffff" stroke="#6b7280"`.
  7. *Draped Toilet Paper Sheet:* Hanging paper flap `M20.5 10 V20.5 C20.5 20.8 20.2 21 19.8 21 H14.5` with `fill="#ffffff" stroke="#6b7280"`, and perforation dashed line `line x1="14.5" y1="16" x2="20.5" y2="16"` with `stroke="#e5e7eb" strokeDasharray="1.5 1"`.

```jsx
// 9. Hygiene - Pump bottle with orange pump & drop (left) & toilet paper roll (right)
export const HygieneIcon = forwardRef(
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
      {/* Orange pump mechanism */}
      <path d="M4 4.5 H8.5 C9 4.5 9.5 4 9.5 3.5 V2.5 H6.5" fill="none" stroke="#f97316" strokeWidth={strokeWidth} />
      <line x1="7.5" y1="4.5" x2="7.5" y2="7" stroke="#f97316" strokeWidth={strokeWidth} />
      <path d="M4 6.5 C3.3 7.5 3 8.2 3 8.8 C3 9.5 3.5 10 4 10 C4.5 10 5 9.5 5 8.8 C5 8.2 4.7 7.5 4 6.5 Z" fill="#f97316" stroke="#f97316" />
      {/* Bottle collar */}
      <rect x="5.5" y="6.5" width="4" height="1.5" rx="0.5" fill="#e5e7eb" stroke="#6b7280" />
      {/* Bottle body */}
      <path d="M6 8 L2.5 10 V19.5 C2.5 20.5 3.5 21.5 4.5 21.5 H10 C11 21.5 12 20.5 12 19.5 V10 L8.5 8 Z" fill="#ffffff" stroke="#6b7280" />
      <path d="M7.25 13.5 C6.2 15 5.5 16.2 5.5 17.3 C5.5 18.5 6.3 19.5 7.25 19.5 C8.2 19.5 9 18.5 9 17.3 C9 16.2 8.3 15 7.25 13.5 Z" fill="#f97316" stroke="#f97316" />
      {/* TP roll body & top */}
      <path d="M11.5 8.5 V17 C11.5 19 20.5 19 20.5 17 V8.5 Z" fill="#ffffff" stroke="#6b7280" />
      <ellipse cx="16" cy="8.5" rx="4.5" ry="2" fill="#e5e7eb" stroke="#6b7280" />
      <ellipse cx="16" cy="8.5" rx="1.8" ry="0.8" fill="#ffffff" stroke="#6b7280" />
      <path d="M11.5 17 C11.5 19 20.5 19 20.5 17" stroke="#6b7280" />
      {/* Hanging sheet */}
      <path d="M20.5 10 V20.5 C20.5 20.8 20.2 21 19.8 21 H14.5" fill="#ffffff" stroke="#6b7280" />
      <line x1="14.5" y1="16" x2="20.5" y2="16" stroke="#e5e7eb" strokeDasharray="1.5 1" />
    </svg>
  )
);
HygieneIcon.displayName = 'HygieneIcon';
```

---

### 5. `OtherIcon` (Icon #10)
- **Concept:** Universal supermarket shopping basket with distinctive vertical ventilation slots and an overlapping circular badge in the bottom right containing a bold brand orange plus (`+`) sign.
- **Bounding Box:** `x: 2.0` to `22.0`, `y: 2.75` to `22.0` (Height: 19.25, Width: 20.0)
- **Layer Breakdown:**
  1. *Basket Upright Handle:* Arched handle `M6 9.5 V5 C6 4.2 6.8 3.5 7.6 3.5 H16.4 C17.2 3.5 18 4.2 18 5 V9.5` with `stroke="#6b7280" fill="none"`.
  2. *Handle Comfort Grip:* Center grip rectangle `x: 10, y: 2.75, w: 4, h: 1.5, rx: 0.5` with `fill="#e5e7eb" stroke="#6b7280"`.
  3. *Basket Heavy Rim:* Sturdy top rim `x: 2, y: 9.5, w: 20, h: 2.5, rx: 1` with `fill="#e5e7eb" stroke="#6b7280"`.
  4. *Basket Tapered Body:* Tapered basket bin `M3.5 12 L5 19 C5.2 19.6 5.7 20 6.3 20 H17.7 C18.3 20 18.8 19.6 19 19 L20.5 12 Z` with `fill="#ffffff" stroke="#6b7280"`.
  5. *Vertical Ventilation Slots:* Four evenly spaced vertical line slots at `x=7.5`, `x=10.5`, `x=13.5`, `x=16.5` extending from `y=13.5` down to `y=18.5` with `stroke="#6b7280"`.
  6. *Overlapping Circular Badge:* Circle `cx="17.5" cy="17.5" r="4.5"` with `fill="#ffffff"` (cleanly masks out basket corner & right slot) and `stroke="#6b7280" strokeWidth={strokeWidth}`.
  7. *Orange Plus Sign:* Horizontal line `(15, 17.5)->(20, 17.5)` and vertical line `(17.5, 15)->(17.5, 20)` with `stroke="#f97316" strokeWidth={2} strokeLinecap="round"`.

```jsx
// 10. Other - Shopping basket with vertical slots & circular badge with orange plus sign
export const OtherIcon = forwardRef(
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
      {/* Basket handle */}
      <path d="M6 9.5 V5 C6 4.2 6.8 3.5 7.6 3.5 H16.4 C17.2 3.5 18 4.2 18 5 V9.5" fill="none" stroke="#6b7280" />
      <rect x="10" y="2.75" width="4" height="1.5" rx="0.5" fill="#e5e7eb" stroke="#6b7280" />
      {/* Basket rim */}
      <rect x="2" y="9.5" width="20" height="2.5" rx="1" fill="#e5e7eb" stroke="#6b7280" />
      {/* Basket body */}
      <path d="M3.5 12 L5 19 C5.2 19.6 5.7 20 6.3 20 H17.7 C18.3 20 18.8 19.6 19 19 L20.5 12 Z" fill="#ffffff" stroke="#6b7280" />
      {/* Vertical slots */}
      <line x1="7.5" y1="13.5" x2="8" y2="18.5" stroke="#6b7280" />
      <line x1="10.5" y1="13.5" x2="10.7" y2="18.5" stroke="#6b7280" />
      <line x1="13.5" y1="13.5" x2="13.3" y2="18.5" stroke="#6b7280" />
      <line x1="16.5" y1="13.5" x2="16" y2="18.5" stroke="#6b7280" />
      {/* Circular badge overlapping bottom right */}
      <circle cx="17.5" cy="17.5" r="4.5" fill="#ffffff" stroke="#6b7280" strokeWidth={strokeWidth} />
      <line x1="15" y1="17.5" x2="20" y2="17.5" stroke="#f97316" strokeWidth={2} strokeLinecap="round" />
      <line x1="17.5" y1="15" x2="17.5" y2="20" stroke="#f97316" strokeWidth={2} strokeLinecap="round" />
    </svg>
  )
);
OtherIcon.displayName = 'OtherIcon';
```

---

## Semantic Aliases Mapping for Icons 6–10
To maintain full backwards compatibility with all existing app consumers, the following semantic aliases must be exported:
```jsx
// Aliases for Icons 6 to 10
export const CanIcon = CannedGoodsIcon;
export const TinCanIcon = CannedGoodsIcon;
export const WaterBottleIcon = BeveragesIcon;
export const BottleIcon = BeveragesIcon;
export const MilkCartonIcon = DairyIcon;
export const MilkBottleIcon = DairyIcon;
export const SoapIcon = HygieneIcon;
export const SoapBubblesIcon = HygieneIcon;
export const BoxIcon = OtherIcon;
export const PackageIcon = OtherIcon;
export const BasketIcon = OtherIcon;
```

---

## Summary Matrix of Visual Elements

| Icon Component | Primary Motif | Accent Graphic (`#f97316`) | Secondary Shading (`#e5e7eb`) | Background Blocker (`#ffffff`) | Bounding Box |
|---|---|---|---|---|---|
| `CannedGoodsIcon` | Tall ribbed can (back) + short can (front) | Orange stripe on tall can; Orange tomato on short can | Metallic can lids (`cx=16.5`, `cx=8.25`) | Front can body cylinder | `[3..21, 3.5..21]` |
| `BeveragesIcon` | Water bottle (left) + soda can (right) | Orange water drop on bottle; Orange wave on soda can | Bottle cap (`y=2.5`), Can lid ellipse (`y=7.5`) | Soda can body & bottle body | `[3..21, 2.5..21.5]` |
| `DairyIcon` | Milk bottle (left) + yogurt cup w/ spoon (right) | Orange yogurt peel lid + pull tab | Milk cap, cow muzzle, yogurt label band | Bottle body, yogurt tub, spoon | `[3..23, 2.5..21.5]` |
| `HygieneIcon` | Pump dispenser bottle (left) + TP roll (right) | Orange pump head & falling drop & bottle drop | Screw collar, TP roll top ellipse | Bottle body, TP roll body, hanging sheet | `[2.5..21.5, 2.5..21.5]` |
| `OtherIcon` | Shopping basket (slots) + circular badge | Orange plus (`+`) sign inside circular badge | Handle grip, heavy basket top rim | Basket body bin, circular badge | `[2..22, 2.75..22]` |
