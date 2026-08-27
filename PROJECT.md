# Project: Custom SVG Category Icons Redesign

## Architecture
- Target file: `components/ui/custom-icons.jsx`
- Reference standard: `CannedGoodsIcon` (lines 12–46)
- Target icons to redesign:
  1. `BeveragesIcon` (Modern to-go cafe tumbler with warm amber `#f59e0b` sleeve and metallic `#e5e7eb` lid)
  2. `BakeryIcon` (Flaky French croissant with warm golden wheat `#fbbf24` fill)
  3. `ProduceIcon` (MUST be crisp leafy cabbage/lettuce head with fresh green `#4ade80` fill — NOT an apple)
  4. `ProteinsIcon` (Marbled steak cut with coral rose `#fb7185` fill and bone core)
  5. `DairyIcon` (Modern glass milk bottle with soft sky-blue `#60a5fa` milk fill and metallic `#e5e7eb` cap)
  6. `FrozenFoodIcon` (Frosty ice cream popsicle bar with icy cyan `#38bdf8` fill and wooden `#fde68a` stick)
  7. `DryGoodsIcon` (Tied burlap grain sack with warm golden oat `#fde047` fill and wheat stalk)
  8. `HygieneIcon` (Modern pump soap dispenser bottle with soft lavender `#a78bfa` fill and floating bubbles)
  9. `OtherIcon` (Isometric parcel package box with slate `#94a3b8` / `#cbd5e1` fill and shipping label)

## Feature Inventory
| # | Feature | Description | Milestone | Source |
|---|---------|-------------|-----------|--------|
| 1 | Reference Standard Calibration | `CannedGoodsIcon`: `stroke={color}`, `strokeWidth=1.2`, subtle internal fills `opacity="0.5"` | M1 | Survey (E1) |
| 2 | Redesign `BeveragesIcon` | To-go cup with warm amber sleeve, metallic lid, `stroke={color}`, `strokeWidth=1.2` | M1 | R1.1, R2 |
| 3 | Redesign `BakeryIcon` | Croissant with warm golden fill, `stroke={color}`, `strokeWidth=1.2` | M1 | R1.2, R2 |
| 4 | Redesign `ProduceIcon` | Crisp leafy cabbage/lettuce (NOT apple), green fill `#4ade80`, `stroke={color}` | M1 | R1.3, R2 |
| 5 | Redesign `ProteinsIcon` | Steak cut with coral fill `#fb7185`, `stroke={color}`, `strokeWidth=1.2` | M1 | R1.4, R2 |
| 6 | Redesign `DairyIcon` | Glass milk bottle with blue fill `#60a5fa`, `stroke={color}`, `strokeWidth=1.2` | M1 | R1.5, R2 |
| 7 | Redesign `FrozenFoodIcon` | Ice pop with icy cyan fill `#38bdf8`, `stroke={color}`, `strokeWidth=1.2` | M1 | R1.6, R2 |
| 8 | Redesign `DryGoodsIcon` | Burlap grain sack with oat fill `#fde047`, `stroke={color}`, `strokeWidth=1.2` | M1 | R1.7, R2 |
| 9 | Redesign `HygieneIcon` | Pump soap dispenser with lavender fill `#a78bfa`, `stroke={color}`, `strokeWidth=1.2` | M1 | R1.8, R2 |
| 10 | Redesign `OtherIcon` | Isometric box with slate fill `#94a3b8`, `stroke={color}`, `strokeWidth=1.2` | M1 | R1.9, R2 |
| 11 | Preserve Aliases & Signatures | Maintain all 20 export aliases, `displayName`, `forwardRef`, `ref` forwarding | M1 | Survey (E1) |
| 12 | Build Verification | `npm run build` succeeds with exit code 0 across all 23 Next.js routes | M1 | Survey (E3) |
| 13 | Multi-Agent Review & Challenge | 2 Reviewers, 2 Challengers independently verify visual & code specs | M1 | R3, AC |
| 14 | Forensic Integrity Audit | 1 Forensic Auditor verifies authentic implementation (CLEAN) | M1 | Audit policy |

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| 1 | Icon Redesign & Multi-Agent Gate | Implement 9 redesigned icons in `components/ui/custom-icons.jsx`, run `npm run build`, review & challenge & audit | none | DONE |

## Code Layout
- Exclusive Write Ownership: `components/ui/custom-icons.jsx`
- Read-Only Dependencies: `lib/constants.js`, `package.json`
