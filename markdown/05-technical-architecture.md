# Document 5 — Technical Architecture
### Beverly Group of Companies (BGOC)

*Note: BGOC is not an AI-native product the way Cognara is. This document replaces "AI Architecture" with the Technical Architecture that actually matters here — the multi-store data model, checkout logic, and how the app stays maintainable as more stores are added. Light AI touches (search, recommendations, support) are noted near the end as optional layers, not the foundation.*

## The core idea the whole architecture must support

**One app, many stores, one cart, one checkout — and adding store number eight should be a config change, not a rebuild.** Every technical decision below is in service of that sentence.

## Data model foundation

Everything is built multi-tenant from day one, not bolted on later:

- **`stores` table** — one row per store (Beverly Exclusive Restaurant, Beverly Bakeries and Confectionery, Yurmealicious Pizza, Homeworld, Toys in Candiland, Dollnatia, Celebrity Styles, and any future ones). Holds name, category (food/fashion/toys/home), **its own logo_url (uploaded by the store, not the shared B badge)**, delivery style (instant/same-day vs. shippable), approval_status (pending/approved/suspended), and owner_user_id (the manager who registered it). No `is_official_beverly` distinction is needed at the data level anymore — every store, founding or future, goes through the same registration path; if a "founding store" badge is wanted for display purposes later, that's a simple UI flag, not a different data or approval path.
- **`products` table** — every product belongs to exactly one `store_id`. No product exists outside a store. Products are entered by the store's own manager through their store dashboard — never by group-level admin on their behalf.
- **`orders` table** — a `parent_order_id` groups everything a customer bought in one checkout session, even across stores. Each individual `order` row still belongs to one `store_id`, so a combined purchase (pizza + a toy) creates one parent order with two child orders — one per store — each trackable and manageable independently by that store's staff.
- **`users` table** — one account per customer across the whole app (Supabase Auth), with saved addresses, payment methods, and order history shared across all stores. The same `users`/Auth system also covers store managers — a store manager is a user with a store attached to their account via `owner_user_id`.
- **Row Level Security (Supabase RLS)** — store staff can only see and manage their own store's products and orders; customers can only see their own orders; the group-level admin sees everything. This is the technical enforcement of the Manifesto's "seven real stores, not one blurred store."

## Store registration and onboarding (core Phase 1 infrastructure, not a later add-on)

The founding stores don't build their listing from a blank slate — Isaac pre-loads each store's name and real logo himself, since he already has these. What the manager does is **claim their store**, then handle everything about running it. A future outside vendor (Phase 4) has no pre-loaded entry and goes through full self-service registration instead, including uploading their own logo.

**Claim-your-store flow (founding stores):**
1. **Pre-load** — group-level admin creates a minimal `stores` row per founding store ahead of time: name and logo_url only (the one manual exception to "admin never sets up store data" — logo/name only, nothing else). `approval_status` starts as `unclaimed`.
2. **Manager finds and claims their store** — on the registration page, they see their store already listed with its real logo, click it, and create an account. This sets `owner_user_id` on that store row.
3. **Fill in the rest** — description, category, fulfillment type (instant/same-day vs. shippable) — filled in by the manager, not pre-loaded.
4. **Add products** — name, price, images (via Cloudinary), stock/quantity, size or variant options where relevant (e.g. Celebrity Styles).
5. **Connect payout details** — a Paystack subaccount tied to their store, so they get paid directly for their own sales (see checkout logic below).
6. **Submit for approval** — `approval_status` moves from `unclaimed` → `pending` → `approved`. **Approval is never automatic** — a group-level admin manually reviews and approves, even for founding stores (fast, same-day, light-touch, since they're already known and trusted).

**Full self-service flow (future outside vendors, Phase 4):** identical from step 2 onward, except there's no pre-loaded entry to claim — the vendor creates their store listing from scratch, including their own logo upload, then follows the same product-upload, payout, and manual-approval steps above (with real added scrutiny at approval time — business verification, product quality checks).

Because the claim-and-build flow is used by the seven founding stores at launch, most of the onboarding system still gets tested immediately with stores you already know and trust — by the time an outside vendor applies later and needs the full from-scratch path, the underlying system already works.

## Customer account creation (checkout-first, not a signup wall)

Customers should never hit a "Create an Account" screen before they've even seen the app. Instead:

- A customer browses and builds their cart with no account required yet.
- At checkout, they enter phone number (or email) and delivery address to complete the order.
- Behind the scenes, the app creates their account automatically from that same information — no separate password-first signup step.
- Returning visits use phone + OTP (one-time code sent via SMS) rather than a remembered password — faster, and matches how most Nigerian users already expect to log into apps.
- Once created, order history, saved address, and payment methods are attached automatically for next time.

This keeps the "orient before impressing" principle from Document 4 intact — the app earns the account, rather than demanding one up front.

## UI/UX standard

The interface must read as modern and professional — built by a skilled team, not templated or AI-generated. The full standard for this (specific patterns to avoid, tone for copy, how to test a screen before calling it done) is written out in the separate `ai-avoidance-guidelines.md` file, which should be fed to Antigravity alongside this document for every screen that gets built.

## Combined cart and checkout logic

Since Document 3 ruled out hiding which store an item is from, the cart UI groups items by store visually, but the checkout is still one flow, one payment. Technically:

- One `parent_order` is created at checkout.
- Payment is taken once, in full, through Paystack.
- **Paystack subaccounts** — one per store — allow the payment to be automatically split and routed to each store's own settlement account, so store owners/managers get paid correctly without manual reconciliation.
- Each store's `order` (child of the parent) gets its own status (preparing, ready, out for delivery, delivered) — because a pizza and a toy don't move at the same speed, and Document 3 already ruled out forcing one timeline onto both.

## Delivery and fulfillment handling

Two broad fulfillment types need to be supported differently, based on store category:

- **Instant/same-day** (Beverly Exclusive Restaurant, Beverly Bakeries and Confectionery, Yurmealicious Pizza) — order goes straight to a "preparing now" state, short delivery windows, ideally one shared delivery/dispatch system since all seven stores are physically at Pinnacle Mall (one pickup point could serve multiple same-day orders in one delivery run).
- **Shippable/schedulable** (Homeworld, Toys in Candiland, Dollnatia, Celebrity Styles) — longer fulfillment windows, sizing/quantity confirmation steps where relevant (especially Celebrity Styles), no expectation of "ready in 20 minutes."

Because all seven stores share one physical location, there's a real opportunity later to have **one shared delivery fleet** rather than each store needing its own riders — worth keeping in the data model (a `deliveries` table independent of `stores`) even if it's not built in phase one.

## Core stack (confirmed)

- **Next.js** — storefront (customer-facing) and admin dashboards, one codebase, store pages routed dynamically (e.g. `/store/[slug]`)
- **shadcn/ui** — component library (built on Tailwind + Radix primitives) for all dashboard and storefront UI — tables, dropdowns, dialogs, forms, sheets/drawers for the mobile sidebar. Provides accessible, professional-looking components out of the box, which are then themed to match Document 1's palette and Inter/Roboto Mono typography rather than left looking like a default template.
- **Supabase** — Postgres database, Auth, Row Level Security for store-level data isolation, Realtime for live order status updates
- **Paystack** — payments, with subaccounts for automatic per-store payout splitting
- **Cloudinary** — product images across all seven stores
- **Resend** — order confirmations, receipts, delivery updates
- **Vercel** — hosting

## Admin structure

- **Group-level admin (you)** — sees all stores, all orders, all revenue; reviews and approves/rejects new store registrations (including the seven founding stores at launch); does not create stores or enter products on anyone's behalf.
- **Store-level admin (per-store manager/staff)** — registers their own store, manages only their own store's products, orders, logo, and settlement — enforced by RLS, not just by UI hiding. This matters because if a Celebrity Styles staff member could technically query Yurmealicious Pizza's order data through the API, that's a real security gap, not just a UI inconvenience.

## Where AI could fit later (optional layer, not foundation)

- A simple recommendation touch at checkout ("customers who bought from Yurmealicious also shop at Homeworld") — this is closer to a rules-based suggestion than true AI at first, and can stay that way until there's enough order data to justify anything smarter.
- A support chat assistant that can answer "where's my order," using order data as context — genuinely useful once order volume grows enough that manual support across seven stores becomes a bottleneck.
- Product search that understands loose queries ("something sweet for a birthday") across all seven stores at once — a nice-to-have once the catalog is large enough that keyword search alone starts missing things.

None of these are needed for launch. The Manifesto and Product Philosophy both warn against building things that don't solve a real, current problem — and right now, the real problem is getting the multi-store cart and checkout right, not adding AI for its own sake.