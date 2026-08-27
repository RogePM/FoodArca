# Handoff Report — Explorer 1 (Codebase & Component Surveyor)

## 1. Observation
- **Target File**: `components/ui/custom-icons.jsx` (442 lines). Currently exports 10 components:
  - `CannedGoodsIcon`, `BeveragesIcon`, `BakeryIcon`, `ProduceIcon`, `ProteinsIcon`, `DairyIcon`, `FrozenFoodIcon`, `DryGoodsIcon`, `HygieneIcon`, `OtherIcon`.
  - 18 aliases: `CanIcon`, `TinCanIcon`, `WaterBottleIcon`, `BottleIcon`, `BreadIcon`, `BakerySnacksIcon`, `LoafBreadIcon`, `AppleIcon`, `FruitVegIcon`, `ChickenLegIcon`, `DrumstickIcon`, `SteakIcon`, `MilkCartonIcon`, `SnowflakeIcon`, `GrainSackIcon`, `SackIcon`, `SoapIcon`, `SoapBubblesIcon`, `BoxIcon`, `PackageIcon`.
- **Primary Integration**: `lib/constants.js` imports all 10 icons and associates them with the `categories` array (`dry_goods`, `frozen_food`, `produce`, `proteins`, `bakery_snacks`, `canned_goods`, `beverages`, `dairy`, `hygiene`, `other`).
- **UI Prop Invocations Observed**:
  - `components/pages/distribution/distribution-desktop-table.jsx:246`: `<Icon className="h-5 w-5" strokeWidth={2.5} />` inside a styled tile.
  - `components/pages/distribution/no-barcode-visual-grid-sheet.jsx:420`: `<catVisual.Icon className="w-12 h-12" strokeWidth={1} />`.
  - `components/pages/distribution/quick-action-sheet.jsx:178`: `<catVisual.Icon className={"w-5 h-5 " + catVisual.style.text} strokeWidth={1.75} />`.
  - `components/pages/distribution/mobile-checkout-cart-view.jsx:194`: `<catVisual.Icon className={"h-6 w-6 " + catVisual.style.text} strokeWidth={2} />`.
  - `components/modals/edit-item-modal.jsx:294`: `<c.icon className="h-4 w-4 mr-2 opacity-70" strokeWidth={2} />`.
  - `components/pages/add-items/desktop-add-view.jsx:613`: `<selectedOption.icon className="h-4 w-4 text-[#697386]" strokeWidth={1.8} />`.
  - `app/(marketing)/features/MobileExperienceSection.jsx:108`: `<IconComp size={22} />`.
- **Project Tooling & Build**:
  - `package.json`: Next.js 16.2.10, React 19.0.0, Lucide React 0.525.0.
  - `npm run build`: Successfully built all 23 routes in 9.9s (exit code 0).
  - `node components/ui/custom-icons.adversarial.mjs`: Test harness using SWC and React 19 SSR (exit code 0).

## 2. Logic Chain
1. **Component Interface Compatibility**: Because consumers invoke category icons using varied props (`size`, `strokeWidth`, `className`, arbitrary rest props, and `ref`), each rewritten icon component in `custom-icons.jsx` must implement `React.forwardRef` and accept `({ size = 24, strokeWidth = 1.5, className = '', ...props }, ref)`.
2. **Hardcoded Color System Migration**:
   - The original implementation relied on `currentColor` (`stroke={color || 'currentColor'}`).
   - The new specification explicitly prohibits `currentColor` and mandates hardcoded colors:
     - Outlines: `#6b7280` (or `#595959`)
     - Primary Accent: `#f97316` (Brand Orange)
     - Secondary Fill: `#e5e7eb` (Light Gray)
     - Base Fill: `#ffffff` (White background blocker)
   - Because parent containers often pass Tailwind text color classes (e.g. `text-yellow-700`, `text-violet-600`), hardcoding `#6b7280` in SVG stroke attributes ensures immunity to cascading text colors while preserving outer dimensions and layout classes (`h-5 w-5`, `w-12 h-12`).
3. **Layering & White Base Fills**: The compositions describe overlapping multi-object line-art (e.g. bread overlapping snack bag, bag overlapping glass jar, milk bottle next to yogurt cup). White fills (`fill="#ffffff"`) on foreground elements are essential to occlude background strokes and achieve clean rendering.
4. **Alias Preservation**: Multiple internal components and test suites may reference shorthand aliases (`AppleIcon`, `SnowflakeIcon`, `MilkCartonIcon`, etc.). Retaining all 18 alias exports guarantees zero broken references across the codebase.

## 3. Caveats
- No caveats regarding component usage or props — all consumer files were inspected directly.
- The existing test suite in `components/ui/custom-icons.adversarial.mjs` was written for the previous `currentColor` spec and will need to be updated in Phase 4 (Verification & Audit) to validate the new hardcoded color rules and new motif compositions.

## 4. Conclusion
The codebase is fully mapped and prepared for Worker 1 to rewrite `components/ui/custom-icons.jsx`.
- **Core Requirements for Worker 1**:
  - Rewrite 10 icons to match the exact compositions in `ORIGINAL_REQUEST.md`.
  - Use hardcoded colors: `#6b7280` outlines, `#f97316` orange accents, `#e5e7eb` secondary fills, `#ffffff` base fills.
  - Standardize on `viewBox="0 0 24 24"`, `strokeWidth={1.5}` or `2`, `strokeLinecap="round"`, `strokeLinejoin="round"`.
  - Maintain `forwardRef`, `displayName`, and all 18 export aliases.
- **Build Safety**: `npm run build` will verify syntax and route integration.

## 5. Verification Method
1. Inspect `analysis.md` and `components/ui/custom-icons.jsx`.
2. Run build verification:
   ```bash
   npm run build
   ```
3. Run AST / JSX rendering test:
   ```bash
   node components/ui/custom-icons.adversarial.mjs
   ```
