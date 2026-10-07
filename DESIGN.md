---
name: Food Arca
description: Mobile-first inventory SaaS for food pantries — calm, photo-first, built for a volunteer's thumb mid-shift.
colors:
  ink: "#1a1f36"
  ink-muted: "#697386"
  neutral-900: "#111827"
  neutral-500: "#6b7280"
  neutral-400: "#9ca3af"
  neutral-200: "#e5e7eb"
  neutral-100: "#f3f4f6"
  surface: "#ffffff"
  brand-add: "#e27f2c"
  brand-settings: "#d97757"
  brand-add-hover: "#cf6f20"
  destructive: "#dc2626"
  destructive-bg: "#fef2f2"
typography:
  heading:
    fontFamily: "Inter, sans-serif"
    fontSize: "clamp(19px, 3.4dvh, 23px)"
    fontWeight: 600
    lineHeight: "1.3"
    letterSpacing: "-0.01em"
  section-title:
    fontFamily: "Inter, sans-serif"
    fontSize: "16px"
    fontWeight: 500
    lineHeight: "1.3"
    letterSpacing: "-0.01em"
  row-title:
    fontFamily: "Inter, sans-serif"
    fontSize: "14px"
    fontWeight: 500
    lineHeight: "1.375"
  body:
    fontFamily: "Inter, sans-serif"
    fontSize: "13.5px"
    fontWeight: 400
    lineHeight: "1.6"
  caption:
    fontFamily: "Inter, sans-serif"
    fontSize: "12px"
    fontWeight: 400
    lineHeight: "1.375"
rounded:
  pill: "9999px"
  card: "16px"
  photo: "12px"
spacing:
  xs: "8px"
  sm: "12px"
  md: "16px"
  lg: "24px"
  xl: "40px"
components:
  card:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.card}"
    padding: "16px"
  button-primary:
    backgroundColor: "{colors.brand-add}"
    textColor: "{colors.surface}"
    rounded: "{rounded.pill}"
    padding: "0 24px"
    height: "clamp(46px, 6.5dvh, 52px)"
  button-primary-hover:
    backgroundColor: "{colors.brand-add-hover}"
  icon-chip:
    backgroundColor: "{colors.neutral-100}"
    rounded: "{rounded.pill}"
    size: "40px"
  photo-thumb:
    backgroundColor: "{colors.neutral-100}"
    rounded: "{rounded.photo}"
    size: "40px"
---

# Design System: Food Arca

## Overview

**Creative North Star: "The Volunteer's Counter"**

Food Arca's dashboard is built for someone standing at a counter mid-shift, phone in one hand, a box of donations in the other. Every screen in this system reads like a clean, well-organized shelf: a small number of clearly-sized things, generous white space between groups, and photos doing the identification work that text would otherwise force someone to read under pressure. Nothing about it performs "software" — no dashboards-for-the-sake-of-dashboards, no dense data walls, no decorative flourishes. The system earns its calm by being genuinely restrained: one accent color, one shadow, one card radius, reused everywhere rather than reinvented per screen.

The reference implementations that define this system today are `/dashboard/settings` (the original polish benchmark), `/dashboard/add`'s empty-cart state, its filled-cart state (the staged-items list, confirmed to match this system in a later pass), and its four confirmation sheets (Clear Cart, Add to Inventory, Exit, How it works). Everything below was extracted from those implementations, not invented in the abstract — this file exists so the next screen built for this app inherits their specific decisions instead of quietly drifting from them, which is exactly what happened before this documentation pass (see the Colors section's Named Rule) and what happened again, independently, to the filled-cart state and its sheets before they were brought back in line (see Components → Cart Item Row and → Confirmation Sheet).

**Key Characteristics:**
- Photo-first recognition over text-first reading — a volunteer scans by image, not by label
- One primary action per screen, unmistakably louder than everything else on it
- Secondary/optional content is pushed away from the primary action with real vertical space, not just smaller type
- A single soft shadow and a single card radius, reused without variation
- No decorative chrome: no kickers, no gradients, no stat-filled empty states

## Colors

The palette is almost entirely neutral (ink, white, and four steps of gray) with one warm accent used sparingly for the single primary action per screen.

### Primary
- **Brand Orange** (`#e27f2c` on Add/scan flow screens, `#d97757` on Settings and its siblings): the one accent color, reserved for the primary CTA, the active bottom-nav tab, and each mobile screen's sticky header bar. Used on well under 10% of any given screen's surface area.

### Neutral
- **Ink** (`#1a1f36`): primary heading and body text color — warmer and slightly softer than pure black.
- **Ink Muted** (`#697386`): tertiary metadata text (e.g. pack-size labels) where gray-500 is too light against a busy row.
- **Neutral 900 / Gray-900** (`#111827`, i.e. Tailwind `gray-900`): section titles ("Recently Added", "More Tools & Preferences") and list-row primary text.
- **Neutral 500 / Gray-500**: secondary/caption text — subtitles, categories, descriptions under a title.
- **Neutral 400 / Gray-400**: disabled-weight icons and de-emphasized links (chevrons, "View all").
- **Neutral 200 / Gray-200**: default card and tile borders (`border-gray-200`).
- **Neutral 100 / Gray-100**: icon-chip backgrounds and row dividers (`divide-gray-100`).
- **Surface** (`#ffffff`): the only background color used behind content. A warm off-white (`#fbf9f6`) was tried on the Add page and explicitly reverted in favor of pure white once compared side-by-side with Settings — white is the standard, not a stylistic option.

### Named Rules
**The One Accent Rule.** Exactly one warm color plays "the brand orange" on any given screen — never two accents fighting for attention on the same surface. It is reserved for the single primary CTA, the sticky header, and the active bottom-nav state; everything else stays neutral.

**The Unconverged Orange Rule (open item).** As of this writing, the codebase has *two* live values both claiming to be that one accent: `#e27f2c` (Add/scan flow) and `#d97757` (Settings). This is drift, not a deliberate two-tone system — until a harmonization pass picks one, match whichever value the screen you're extending already uses; never introduce a third.

## Typography

**Body Font:** Inter (via `next/font/google`, applied globally in `app/layout.js`) — the only typeface in the system. No serif, display, or monospace face is used anywhere in the dashboard.

**Character:** Plain, legible, unremarkable on purpose — the type never competes with the product photos for attention.

### Hierarchy
- **Heading** (600, `clamp(19px, 3.4dvh, 23px)`, tight leading, `-0.01em` tracking): a card's own headline, e.g. "Scan to Add." Appears once per hero card, never as a page-level title — page identity comes from the sticky header and the active bottom-nav tab, not a big `<h1>`.
- **Section Title** (500, 16px, `-0.01em` tracking): the label on a bordered list card, e.g. "Recently Added," "More Tools & Preferences." Always sits inside the card it labels, never floating above it.
- **Row Title** (500, 14px): the primary text of a list row or grid tile — an item name, a tool name.
- **Body** (400, 13.5px, relaxed leading, gray-500): one short line of supporting copy under a heading. Never more than a sentence; if it needs two, it's doing too much.
- **Caption** (400, 12px, gray-500): the secondary line under a row title (category, description).

### Named Rules
**The One-Line Body Rule.** Supporting copy under a heading is one sentence. If a second sentence feels necessary, the content belongs in a modal (see "How it works") instead of inline.

**No Kicker Rule.** No uppercase eyebrow/label ever sits above a heading. The heading carries its own weight — an early draft of the Add page used one ("Inbound Staging") and it was removed as part of reaching this system, not as a one-off preference.

## Layout

Mobile screens are edge-to-edge with a `16px` (`px-4`) side gutter; desktop/tablet variants of the same screens (Settings) add a `max-w-2xl mx-auto` cap with `md:px-6`.

Every mobile screen opens with a **sticky, accent-colored search header** (see Components) instead of a page title. Content below it follows one spacing rhythm:
- **24px** (`pt-6`/`mt-6`) between the sticky header and the first content block.
- **12px** (`gap-3`) between sibling cards in the same row or cluster.
- **24–40px** (`mt-6` to `mt-10`) between a screen's primary content and anything explicitly secondary/optional — the bigger the gap, the more clearly "this is a nice-to-have, not the main task." A "Recently Added" shortcuts list, for example, sits a full `mt-10` below the primary action card specifically so it never competes with it.

Bottom safe-area clearance (`env(safe-area-inset-bottom)`, `pb-safe`) is applied on every screen with a bottom tab bar or floating CTA, for iOS home-indicator clearance.

### Named Rules
**The No-Nested-`dvh`-Minimum Rule.** Never set a `min-height` in viewport units (`100dvh`, etc.) on an element that is already inside a scrollable (`overflow-y-auto`) flex container. iOS Safari recalculates `dvh` live as its dynamic toolbar shows/hides during a scroll gesture, and a forced `dvh` minimum nested inside an already-sized flex child causes real scroll-clipping bugs on physical devices that never show up in a desktop viewport emulator (confirmed on this app's Add page). Use `min-h-full` to mean "fill what my scrollable parent already gives me."

## Elevation & Depth

The system is almost flat. One soft, low-opacity shadow is the entire elevation vocabulary — there is no scale of "low/medium/high" elevation, no colored glow, no neobrutalist hard-offset shadow anywhere in these reference screens.

### Shadow Vocabulary
- **Card lift** (`box-shadow: 0 2px 8px -4px rgba(0,0,0,0.05)`): applied to every card, tile, and CTA button with no variation — hero cards, list cards, grid tiles, confirmation sheets all share this exact value.
- **Header seam** (`box-shadow: 0 1px 0 0 <the screen's accent color>`): a 1px hairline, not a blur, used only on a sticky header to separate it from scrolling content beneath it. Deliberately not a shadow — a colored seam reads as "this bar is fixed chrome," where a blurred shadow would read as "this bar floats above the content," which isn't the intended relationship.

### Named Rules
**The One Shadow Rule.** If a new component needs to feel "lifted," it takes the exact Card Lift value above. A second shadow recipe is a sign the new component should probably just be a card.

## Shapes

- **Cards, tiles, hero panels:** `16px` radius (`rounded-2xl`) — the single card radius in the system, used with no exceptions.
- **System icon containers** (search glyph, keyboard glyph, tool icons): fully round (`rounded-full`), `40–44px`. Circular is reserved for *system* iconography.
- **Product/item photo containers:** `12px` radius (`rounded-xl`), square-ish, never circular. This is a deliberate semantic split established this session: a circle means "this is an app icon," a rounded square means "this is a photo of a real thing a volunteer is holding." Mixing the two (a product photo in a circle) was tried, flagged as a visual clash, and corrected. The filled-cart item photos independently drifted to `rounded-md` (6px) before being caught and corrected to match this rule — a reminder that this radius applies to *every* product/item photo in the app, not just the ones on the empty-cart screen where it was first documented.
- **Primary CTA buttons:** fully round (`rounded-full`, pill) — reserved for the one primary action per screen. A secondary or tertiary action never takes the pill shape; it takes a card or a plain text link instead.
- **Borders:** 1px throughout. `gray-200` for ordinary cards/tiles; `gray-300/70` for a "list card" that itself contains its own bordered rows (see Components → List Card).

## Components

### Sticky Search Header (signature component)
The identity anchor for every mobile screen in this system, replacing a traditional page title. A sticky, full-bleed bar in the screen's accent color, `pt-[calc(12px+env(safe-area-inset-top))] pb-2 px-4`, containing the shared `MobileInventorySearch` field (white pill input, subtle focus ring in the accent color). Bottom edge is a 1px accent-colored seam (see Elevation), not a shadow. This single component is what makes a screen feel like "a page" rather than "a modal stacked on nothing" — every screen that lacks it reads as unfinished.

### Hero Action Card
One per screen, at most. A `rounded-2xl` white card holding a heading, one line of body copy, an optional inline text link for progressive disclosure ("How it works"), a supporting illustration, and a single full-width pill CTA. No caption line under the CTA restating the obvious (a redundant "Uses your device camera" caption was cut from this exact card for being pure noise).

### Compact Option Tile
A 2-up grid of secondary actions living below the Hero Action Card, separated from it by the full `24px` section gap (not the tighter `12px` sibling gap — these are next-best options, not part of the hero). Each tile: `rounded-2xl`, `p-4`, `min-h-[132px]`, icon chip + chevron on one row, label + caption anchored to the bottom via `justify-between` — proportioned to match Settings' 3-column grid tiles rather than shrinking to fit only its own text content.

### List Card ("More Tools" pattern)
A bordered (`border-gray-300/70`) `rounded-2xl` card with its section title living *inside* the card, followed by `divide-y divide-gray-100` rows. Each row: inset hover (`-mx-2 px-2 rounded-xl hover:bg-gray-50/70`), a leading icon-chip or photo-thumb, a title + one-line caption, and a trailing `ChevronRight`. When the card needs a "see more" affordance, it sits as a small `text-gray-400`/`12.5px` link next to the section title — never as a full-width, accent-colored button; that treatment is reserved for the one primary CTA on the screen. This is the same shell used by the Add page's "Added items" cart list (see Cart Item Row below) — it had drifted to `rounded-md`/`shadow-md`/manual per-row borders before being corrected to this one recipe.

### Cart Screen (approved exceptions)
The Add flow's cart (`mobile-cart-view.jsx`) is modeled on a store's Scan & Go cart, without prices, and carries three user-approved exceptions to the rules above: an **orange header bar** with a white "✕ Exit" on the left (no title, no search field — a back arrow with "Cart" beside it read as "go back to the cart") and the primary action as a **white pill with orange text ("Add to stock") on the right**; a **6px (`rounded-md`) radius on the cart's list card** only, for a sharper, receipt-like edge, whose header reads "Total" (14px gray) with units and pounds ("152 units + 18.5 lb", 15px semibold) on the right — no row count, the list already shows it; the card is padded 12px so photos sit at 29px, and the From text and chevron are inset to that same edge; and a fixed, borderless `gray-100` "From" strip under the header that reads as one line ("From · Add source" + chevron). The empty cart is not part of this — it keeps the Add landing page (`empty-cart-landing.jsx`). Exit leaves the add flow (confirming with "Leave for now?"). The bottom of the screen belongs to the floating add control (nothing else is pinned there), the only way back to the scanner: while the cart has 3 items or fewer and the list is at the top, it's a centered white pill with **Scan** (tinted `#fff0eb`, `#b5541a`), **Search** and **Type**; once the cart grows or the list scrolls, it folds into a 56px circle on the right with the pill's shell (white, gray border, same shadow) and a `#fff0eb` inner disc holding a 20px `#b5541a` **+** — it means "add", not "scan". Tapping the circle opens the pill again; scrolling folds it back.

### Cart Item Row
The row pattern inside the cart's list card. Each row: a `48px` `rounded-xl` photo or category placeholder, the name (regular weight, with " · size" when known), a caption with expiry and storage only when they're set (blank stays blank — no "No date"), and thin `Edit`/`Remove` text links (`13px`, `#4b5263`, `decoration-gray-300`) sitting lower in the row. A neutral quantity stepper (`rounded-full`, `border-gray-200`, `h-9`) sits on the trailing edge. Rows are separated by `divide-y divide-gray-100` — never a manual per-row border. Remove shows an Undo toast instead of a confirm sheet.

**The One Quantity Rule.** A staged item's count appears exactly once per row — inside the stepper pill. Don't also print "N units" elsewhere in the row; it was tried, read as redundant, and was cut. The one exception: a weight-tracked item (no stepper, since weight is edited via the Edit sheet) keeps its own "N lbs"-style label, since that's its only quantity indicator.

### Confirmation Sheet
A bottom slide-up sheet (spring transition, `rounded-t-[32px]`) used for anything that changes or discards state (clear cart, add to inventory, exit) — and for any auxiliary modal on the same screen (e.g. "How it works"), even one with no confirm/cancel choice. **One presentation pattern per screen**: a centered scale-in modal was tried for "How it works" alongside three bottom sheets on the same screen and corrected — every overlay on a screen that already has bottom sheets should be a bottom sheet too, not a second modal idiom.

- **Icon-in-circle** at top, `48px`, tinted to signal intent: `bg-red-50`/`text-red-500` for destructive, `bg-[#fff0eb]`/`text-[#e27f2c]` for confirm/progress/informational — never Tailwind's default `orange-50`, which is a slightly different hue from the app's actual accent tint.
- **Headline** is a short question that mirrors the exact label of the button/link that opened the sheet (e.g. the "Add to Inventory" header button opens a sheet titled "Add to Inventory?"; "Clear Cart" opens "Clear your cart?"). This keeps the trigger and its confirmation reading as the same action, not two different vocabularies for one flow.
- **Body copy is exactly one sentence**, shaped `Your {n} item(s) will {outcome}.` — no throat-clearing lead-in ("You'll return to the dashboard...") and no trailing restatement of what the button below already says.
- **Buttons**: a filled primary button (`rounded-full`, pill — same shape as the screen's one primary CTA) stacked over an outlined secondary/cancel button (`rounded-2xl`, the card radius, never a pill — a secondary action doesn't get the primary's shape), always filled-first-then-outlined in that order. A single-action auxiliary sheet (no cancel needed) still uses the pill for its one button.
- **Vocabulary**: the staged items a volunteer is working with are always "your cart" in user-facing copy, never "batch" — "batch" is fine as an internal variable/function name (`submitBatch`, `foodarca_staged_batch`) but never appears in a heading, body line, or button a volunteer reads.

## Do's and Don'ts

### Do:
- **Do** reuse the single Card Lift shadow (`0 2px 8px -4px rgba(0,0,0,0.05)`) and the single `rounded-2xl` card radius on every new card — don't invent a second recipe.
- **Do** give every mobile screen a Sticky Search Header instead of a bold page title; page identity comes from the active bottom-nav tab plus the header, not a heading.
- **Do** separate secondary/optional content from the primary action with a full section gap (24–40px), not just smaller type or a lighter color.
- **Do** keep product/item photos in `rounded-xl` squares and system icons in `rounded-full` circles — the shape itself carries meaning.
- **Do** use `min-h-full`, never a `dvh`-based min-height, on content nested inside an already-scrollable container.
- **Do** make a confirmation sheet's title and primary button echo the exact label of whatever button/link opened it, and keep its body copy to one sentence: "Your {n} item(s) will {outcome}."
- **Do** call the volunteer's staged items "your cart" in every user-facing string — "batch" stays a code-level name only.

### Don't:
- **Don't** add an uppercase eyebrow/kicker label above any heading.
- **Don't** add a caption restating what a CTA obviously does ("Uses your device camera" under "Open Scanner" was cut for exactly this reason).
- **Don't** style a "view more"/tertiary link as a full-width, accent-colored button — that treatment belongs to the one primary CTA per screen only.
- **Don't** introduce a third brand-orange value. The system currently carries two unconverged ones (`#e27f2c`, `#d97757`); match the sibling screen you're extending until they're unified.
- **Don't** mix a decorative rainbow of category colors into system iconography that's meant to read as neutral chrome (flagged and corrected on the Add page's Recently Added icons this session).
- **Don't** show a staged item's quantity twice on one row (a redundant "N units" label was cut once the stepper already showed the live count) — one exception: weight-tracked items, which have no stepper.
- **Don't** mix a centered scale-in modal into a screen whose other overlays are all bottom sheets — pick the one presentation pattern the screen already uses.
