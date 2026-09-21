# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Two primary audiences on the same dashboard, split by device and moment:
- **Volunteers/frontline staff**, on phones/tablets during intake and distribution — adding items, scanning barcodes, running grab-and-go checkouts. Speed and simplicity matter most; sessions happen standing up, mid-line, often handing a device between people.
- **Pantry admins/managers**, on desktop and mobile — reviewing stock levels, expiration, multi-location routing, and organization/billing settings. Clarity and oversight matter most.

## Product Purpose

Food Arca is a SaaS inventory management platform for high-volume food pantries and food banks. It replaces spreadsheets and disconnected tools with one system that tracks real-time stock, expiration, and multi-location distribution, so pantries can move food faster and lose less of it to mismanagement or waste.

## Positioning

Food Arca's mechanism a neighboring tool can't casually copy: purpose-built for the physical reality of a distribution line — barcode scan-to-grab-and-go speed, instant multi-device/multi-location sync (so multiple volunteers on the floor never see stale counts), and a single simple system a non-technical volunteer can use untrained, replacing what would otherwise be several disconnected tools.

## Operating Context

- Distribution floors where volunteers scan/add/remove items on phones or tablets, often mid-line, sometimes handing devices off between shifts.
- Back-office/admin review on desktop: inventory oversight, low-stock and expiration alerts, org switching, role-based access, billing.
- Multi-location organizations routing inventory across facilities and warehouse sites, requiring real-time sync across all connected devices.
- Bulk ingestion of catalog items with automatic category matching, reducing manual data entry during large intakes.

## Capabilities and Constraints

- Real-time inventory tracking: stock levels, expiration dates, categories, synced live across devices (Supabase Realtime).
- Barcode scanning for lookups, additions, and continuous checkout during distribution.
- Automated low-stock and expiring-item alerts.
- Bulk ingestion with catalog normalization and category auto-matching.
- Fast, anonymous "grab-and-go" checkout mode for rapid distribution without collecting recipient data.
- Multi-tenancy: users switch between pantry organizations.
- Role-based access for admins vs. volunteers.
- Stripe-billed subscriptions (Regional and Enterprise tiers).
- Stack: Next.js 16 (App Router, Turbopack), Tailwind CSS, Supabase (Postgres, Auth, Realtime), Stripe, Framer Motion.

## Brand Commitments

Name "Food Arca" and the 🍎 mark are the only fixed identity elements. No palette, typography, or broader visual system is locked — open to being established as part of ongoing design work.

## Evidence on Hand

No testimonials, case studies, or press on hand — do not fabricate any. Real feature set and screens exist in the codebase (`/app/dashboard`, `/components/pages/*`) as ground truth for what the product actually does.

## Product Principles

1. **Floor speed over feature depth.** Anything a volunteer touches mid-line (add, scan, checkout) should optimize for fewest taps and zero training, even if it means less flexibility than admin-facing screens.
2. **Never show a stale number.** Multi-device, multi-location real-time sync is core to trust in the product — the UI should always reflect that data is live, not just correct.
3. **One system, not a stack of tools.** Every new surface should reinforce that Food Arca replaces spreadsheets and disconnected apps, not add another tool to the pile.
4. **Admin clarity, volunteer simplicity.** The same data serves two very different cognitive loads — oversight screens can be denser; floor screens must stay lean.
5. **Scale without losing the small pantry.** The product spans small single-location pantries to multi-facility, multi-tier (Regional/Enterprise) operations — design should not assume every org is small, nor make simple orgs feel over-built.

## Accessibility & Inclusion

No product-specific accessibility requirement established yet.
