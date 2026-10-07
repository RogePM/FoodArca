# Food Arca: Marketing Site Design Guide

This guide covers **only the public marketing site** (the `app/(marketing)` pages and `components/Frontend/*`, plus the nav and footer). Use it to build every new public page (Pricing, Contact, Privacy, and so on) so they look like the home page.

It does **not** cover the signed-in app. The dashboard follows `DESIGN.md` (Inter throughout, no kickers, one accent). The marketing site is different on purpose: it uses a serif for headings and a warmer, quieter page. If you are building something inside `/dashboard`, stop and use `DESIGN.md`.

Product truth still comes from `PRODUCT.md`. In particular, do not invent testimonials, customer numbers or features.

---

## 1. The feel

Quiet, warm and plain-spoken. It should read like a calm tool for people feeding their neighbours, not a loud SaaS landing page.

- **Cream and warm grey, never cold white or blue-grey.** Surfaces are slightly warm.
- **One accent: terracotta.** It marks the single thing to press. Everything else is dark brown-black text and neutrals.
- **Serif for headings, sans for everything else.** The serif gives it a human, editorial tone.
- **Generous space.** Sections breathe. When in doubt, add space, not another element.
- **Show, don't decorate.** The visuals are small, honest product scenes (a phone scanning, an inventory list), not stock illustrations or gradients.
- **Motion is gentle and happens once.** Soft fades on scroll. Nothing bounces, slides in from the side or loops.

---

## 2. Colour

Defined as CSS variables in `app/globals.css` and Tailwind tokens in `tailwind.config.js`. Prefer the tokens where they exist, and use the hex values below for the page surfaces.

### Text
| Role | Value | Use |
|---|---|---|
| Main text | `#1C1917` (token `text-hero-main`, `hsl(24 10% 10%)`) | Headings, strong text |
| Muted text | `#57534E` (token `text-hero-muted`, `hsl(24 5% 32%)`) | Paragraphs, descriptions |
| Faint text | `#A8A29E` | Icons at rest, chevrons only |

### Surfaces (page backgrounds, in the order they appear)
| Surface | Value | Where |
|---|---|---|
| Cream | `#FCFAF7` | Hero, intro, "who it's for", FAQ. The resting colour of the page. |
| Warm grey | `#F5F5F4` | "Scan it, share it" feature section, closing call to action. The one change of tone. |
| Page wrapper | `#FAFAF9` | Behind everything (the wrapper in `page.jsx`) |
| White | `#FFFFFF` | Cards, inputs, secondary buttons, the nav when not compact |
| Footer | `#1C1917` | The dark base of every page |

Rule: alternate **cream → warm grey** to separate big ideas. Do not add a third background colour to a page, and never put a peach or tinted band between them (the old peach "who it's for" band was removed because it clashed).

### Lines
| Role | Value |
|---|---|
| Hairline / card border | `#E7E5E4` |
| Hover border | `#D6D3D1` |
| Inactive rule (left-rule rows) | `#E7E5E4`, active is `#1C1917` |

### Accent and soft panels
| Role | Value | Use |
|---|---|---|
| Terracotta (primary) | `#D97757` (token `bg-brand-primary`) | Primary buttons, the leaf logo |
| Terracotta text link | `#B95B3E`, hover `#9A4A30` | "Learn more" links, check marks |
| Terracotta hover | `#C6654A` | Pressed or hover state of primary |
| Peach panel | `#F2D5C6` | Feature card 1 panel |
| Sage panel | `#BFD1C8` | Feature card 2 panel |
| Lavender panel | `#D3D1E0` | Feature card 3 panel |
| Navy (state chips) | `#1A1F36` | "Found", "Added", "Stored", "New" chips inside scenes |

Hero hill colours (decorative only, in `HeroBackdrop.jsx`): beige `#EFE8E0`, peach `#F7D9CD`, coral `#EFA58D`.

Never use pure black (`#000`) or pure grey for text, and never use a colour for text on a tinted background without checking contrast.

---

## 3. Typography

| Role | Font | Notes |
|---|---|---|
| Headings, nav logo, question text | **Serif** (`font-serif`, which renders as Georgia) | Never bold. Weight stays regular. |
| Body, buttons, UI | **Inter** (loaded on `<body>`) | `font-light` for descriptions, `font-semibold` for buttons |

### Scale
| Element | Classes |
|---|---|
| Section title (h2) | `text-balance font-serif text-[1.75rem] leading-[1.18] text-hero-main sm:text-4xl md:text-5xl` |
| Section subheader | `text-[15.5px] font-light leading-[1.6] text-hero-muted sm:text-lg sm:leading-relaxed` |
| Row heading, open (feature, tier) | `font-serif text-[1.65rem] sm:text-[1.9rem]` |
| Row heading, closed | `font-serif text-xl sm:text-[1.35rem]` muted |
| FAQ question | `font-serif text-[1.15rem] sm:text-[1.3rem] leading-snug` |
| Body paragraph | `text-base sm:text-[17px] font-light leading-relaxed text-hero-muted` |
| List point (bold lead + line) | `text-[15px]`, lead is `font-semibold text-[#1C1917]`, line is `text-[#57534E]` |
| Button | `font-inter text-[15px] font-semibold` |
| Small caption | `text-xs` or `text-[12px]`, muted |

Rules:
- **Sentence case everywhere.** No ALL CAPS, no kicker labels above headings, no "eyebrow" text.
- **Titles are short and plain.** "Scan it, share it, report on it", not a slogan with punctuation tricks. Use `text-balance` so lines break evenly.
- **No decorative underlines** (the hand-drawn squiggle was removed everywhere), and no italic accent words in headings.
- Headings sit centred on full-width sections, left-aligned inside two-column layouts.

---

## 4. Layout and spacing

### Container
Every section wraps its content in:

```jsx
<div className="container mx-auto px-4 md:px-6 max-w-7xl">
```

The nav and footer use a slightly wider `max-w-[85rem]` with `px-4 sm:px-6 md:px-8`. Keep section content on `max-w-7xl`.

### Section rhythm (vertical padding)
| Section type | Padding |
|---|---|
| Intro / standard section | `pt-14 pb-32 sm:pt-20 sm:pb-44 lg:pt-28 lg:pb-44` for the intro, `py-24 sm:py-28 lg:py-32` for most others |
| Closing call to action | `py-24 sm:py-28 lg:py-36` |
| Gap between two sections that read as one (who it's for → FAQ) | trim the first's bottom to `pb-12`, give the second a generous top (`pt-28 sm:pt-36 lg:pt-48`) |

Header-to-content gap: `mb-14 sm:mb-16 lg:mb-20` (tighter, `mb-10 sm:mb-12 lg:mb-14`, when the content is the pinned feature stack).

### Header shape (use for every section)
```jsx
<div className="mx-auto mb-14 max-w-3xl text-center sm:mb-16 lg:mb-20">
  <h2 className="stagger-animate opacity-0 text-balance font-serif ...">Title</h2>
  <p className="stagger-animate opacity-0 mx-auto mt-5 max-w-2xl ..." style={{ animationDelay: '0.15s' }}>Subheader</p>
</div>
```
Title, then **20px** (`mt-5`) gap, then subheader at `max-w-2xl`. Same on every section, so headings line up from page to page.

### Two-column sections
`grid items-center gap-12 lg:grid-cols-2 lg:gap-20`. Visual on one side, rows on the other. On phones the text comes first (`order-1`), the visual second.

### Radii
| Element | Radius |
|---|---|
| Buttons, tags | `rounded-full` (pill) |
| Cards, scene panels, photos | `rounded-2xl` |
| Inputs, small buttons | `rounded-xl` |
| Phone mock | `rounded-[28px]` to `[30px]` |

### Shadows
Barely there. Cards use `shadow-[0_2px_8px_-4px_rgba(0,0,0,0.05)]`. Phone mock uses `shadow-[0_8px_24px_-12px_rgba(0,0,0,0.3)]`. No heavy drop shadows.

---

## 5. Components

### Navigation (`components/frontNav/NavBar.jsx`)
- Fixed at the top. White with a hairline border and soft shadow at the top of the page; cream with no border once scrolled ("compact").
- Left: leaf icon in terracotta plus "Food Arca" in serif. Centre: links in `text-sm font-medium text-[#57534E]`, hover terracotta. Right: terracotta pill "Try for free". Hamburger below `lg`.
- Links today: Features (`/features`), Distribution, Pricing. Two of these still point at `/`. Fix them when those pages exist.

### Buttons
- **Primary:** `rounded-full bg-brand-primary px-7/8 py-3 font-inter text-[15px] font-semibold text-white`, arrow icon after the label, lifts 2px and gains a soft terracotta glow on hover. One per view.
- **Secondary:** `rounded-full border border-[#E7E5E4] bg-white ... text-[#1C1917]`, hover `border-[#D6D3D1] bg-[#FAFAF9]`. Never filled with colour.
- **Text link:** `font-semibold text-[#B95B3E] hover:text-[#9A4A30]` with an arrow icon.
- Minimum tap height 44px. On phones, stack buttons full width.
- **Labels:** the primary action is always **"Try for free"**. Secondary: "Explore features", "Contact us". Do not use "Get started" or "Start for free".

### Left-rule rows (used for "who it's for" and the FAQ list is similar)
A vertical list where each row is a big click target:
- Each row has `border-l-2 pl-6`. Open row: `border-hero-main`. Closed: `border-[#E7E5E4]`, hover `#D6D3D1`.
- Open row shows a larger serif heading, then its text and buttons inside the same rule. Closed rows are quiet muted serif names.
- Content opens with `grid-rows-[0fr] → [1fr]` plus an opacity fade over about 500ms.
- Closed content is `invisible` so it can't be tabbed to.

### FAQ rows
Centred column, `max-w-3xl`. A hairline above the first row and under every row. Each row: serif question left, thin plus (becomes a minus when open) right, `py-7 sm:py-8`. Answers are light grey, `max-w-[92%]`, with `pb-8`. One open at a time; the first starts open.

### Point lists (feature section)
Checked, indented points. Each: a plain terracotta check (`<Check size={16} strokeWidth={2.25} className="shrink-0 text-[#B95B3E]" />`, no circle or background), then a bold lead and one muted line below. This is what makes them read as a list and not as extra heading text.

### Scenes (the animated product cards)
Small product mockups inside coloured panels (`PANEL_COLORS`: peach, sage, lavender), in `FeatureScenes.jsx`:
- Panels `rounded-2xl`, with faint white contour lines behind (`SceneLines`).
- Content is white cards (`rounded-2xl border border-black/5 bg-white`) that assemble top to bottom.
- Phone mocks use a thin light border (`border-black/15`), real proportions (about 9:19.5), a dynamic island, status bar and a home bar.
- State chips use navy `#1A1F36` with white text ("Found", "Added", "Stored").
- Everything is real markup and CSS (no video), and each scene replays with a "Replay" button.
- Keep scenes simple: one idea, three or four steps, readable in five seconds.

### Photos
Large, single, `rounded-2xl`, with the soft shadow. One image per idea; swap with a quick crossfade (about 700ms) rather than showing several at once.

### Hero (home page only)
Layered soft hills behind a sign-in card and a photo slider. Cream background, serif headline, terracotta accents. On large screens a cream wash fades in at the bottom as you scroll. Reuse the pieces; don't redraw them.

### Footer
Dark `#1C1917`, with a faint "Arca" watermark, the leaf logo and column links. It has `pt-16 lg:pt-20` so its content never sits on its top edge. Every page ends with it.

---

## 6. Motion

- **Reveal on scroll:** add `stagger-animate opacity-0` to an element. `GlobalScrollObserver` (mounted on the page) fades it in once, with a soft "water wash" (opacity, a touch of blur and shift), when 15% is visible.
- **Stagger:** stagger siblings with `style={{ animationDelay: '0.15s' }}` and so on, about 0.12 to 0.15s apart.
- **Hover:** small lifts (2px) and colour changes, 300ms.
- **Reduced motion:** the scroll fade on the hero and the scenes are already turned down for `prefers-reduced-motion`. Keep that when adding anything new.
- **Never** use looping animations, parallax on content, sliding-in sections or auto-playing carousels.
- Any page that uses `stagger-animate` needs `GlobalScrollObserver` mounted, or the elements stay invisible.

---

## 7. Copy

- **Plain and concrete.** Say what the tool does for a volunteer or coordinator. Avoid "revolutionize", "seamless", "enterprise-grade", "powerful".
- **Use the product's real words:** "cart", "inventory", "stock", "scan". Staged items are "your cart", never "batch".
- **Only claim what is true.** Plan limits come from `lib/plans.js`: Free/Pilot is 150 items and 1 user; Basic is $15 (800 items, 5 users); Pro is $30 (3,000 items, 10 users); Enterprise is custom, with unlimited users and multi-site. If a number or feature isn't in the code, don't put it on the page.
- **No invented proof.** No fake testimonials, customer logos, "trusted by N" or star ratings. Add them only when real.
- **Contact:** until a contact page exists, "Contact us" opens `mailto:sales@foodarca.com`.
- **One idea per sentence.** Subheaders are one or two short sentences.

---

## 8. Building a new page

1. Put it under `app/(marketing)/<name>/page.jsx`. The marketing layout already adds the nav and footer.
2. Start with a **centred header** (section 4), then content on `container mx-auto px-4 md:px-6 max-w-7xl`.
3. Pick the background from the two surfaces: cream `#FCFAF7`, or warm grey `#F5F5F4` to separate it from a neighbour. Don't introduce a third.
4. One primary button per view, labelled "Try for free" (or the real action). Everything else is secondary or a text link.
5. Add `stagger-animate opacity-0` to the header and the main blocks, and make sure `GlobalScrollObserver` is on the page (the home page mounts it; mount it on new pages too).
6. Check it at phone width (stack columns, full-width buttons) and with reduced motion.
7. Update the nav links if the page is new (Pricing and Distribution currently point at `/`).

### Page ideas that fit this system
- **Pricing:** header, then plan rows or three plain cards from `lib/plans.js`, a short billing FAQ, a closing call to action.
- **Contact:** header, a short form with name, organization, message and reply email, then the email as a text line.
- **Privacy / Terms:** a narrow reading column (`max-w-3xl`), serif headings, light body text, plenty of space. No visuals.
- **Features / How it works:** reuse the feature stack and scene panels; add scenes rather than new styles.

---

## 9. Don't

- No kickers or eyebrow labels, no ALL CAPS.
- No more than one accent colour; no gradients on buttons or backgrounds.
- No stock illustrations, emoji, or decorative sparkles.
- No bold serif headings.
- No third page background colour; no tinted bands (peach, blue, green) behind sections.
- No heavy shadows, thick borders, or card-inside-card nesting.
- No inventing facts, numbers, testimonials or features.
- Don't copy styles from the dashboard (`DESIGN.md`) into the marketing pages, or the reverse.

---

## 10. Where things live

| What | File |
|---|---|
| Home page order | `app/(marketing)/page.jsx` |
| Hero | `components/Frontend/Hero/*` |
| Intro | `components/Frontend/Intro/IntroSection.jsx` |
| Feature section, stack and points | `components/Frontend/Feature/FeatureSection.jsx`, `FeatureTabs.jsx` |
| Animated scenes | `components/Frontend/Feature/FeatureScenes.jsx` |
| Who it's for | `components/Frontend/Solution/CTASection.jsx`, `CTAActions.jsx`, `AnimatedImageGrid.jsx` |
| FAQ | `components/Frontend/common/Faq.jsx` |
| Closing call to action | `components/Frontend/common/FinalCTASection.jsx` |
| Nav and footer | `components/frontNav/NavBar.jsx`, `components/Frontend/common/Footer.jsx` |
| Scroll reveal | `components/Frontend/common/GlobalScrollObserver.jsx`, `app/globals.css` (`.animate-water-wash`) |
| Plan limits (source of truth) | `lib/plans.js` |
| Colour tokens | `app/globals.css`, `tailwind.config.js` |
