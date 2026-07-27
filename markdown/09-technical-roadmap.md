# Document 9 — Technical Roadmap
### Beverly Group of Companies (BGOC)

## What's already built

Nothing in code yet — this Blueprint (Documents 1–9) is the foundation everything else builds on. That's the correct order: Cognara's own success came from writing the Blueprint before code, and BGOC is following the same discipline.

## How this roadmap is organized

Four phases, roughly quarter-sized, but not tied to a fixed calendar — each phase ends when its goals are actually met, not when a date arrives. Every phase maps directly back to earlier documents: Document 3's Product Philosophy decides *what* gets built, Document 5's Technical Architecture decides *how*, Document 7's Growth Strategy and Document 8's Business Model decide *when* certain features earn their place.

---

## Phase 1 — Foundation (get one real order working, with stores onboarding themselves)

**Goal:** A store manager can register their own store (own logo, own products, own prices) through a self-service flow and get approved; a customer can then open the app, browse any approved store, buy from ONE store at a time, pay, and receive their order. No combined cart yet — that's Phase 2, deliberately, because getting single-store checkout right first is safer than building the harder combined-cart logic before the basics are solid.

Build order within this phase:
1. **Database foundation** — `stores`, `products`, `orders`, `users` tables with Row Level Security, per Document 5.
2. **Auth** — Supabase Auth, one account system covering both customers and store managers.
3. **Store registration and onboarding flow** — a store manager creates an account, uploads their own logo, fills in store details (category, fulfillment type), and submits for approval. This is used by all seven founding stores at launch — Beverly Group of Companies does not manually create any store's listing.
4. **Product upload flow** — the store's own manager adds products, prices, images, and stock/variant details through their store dashboard.
5. **Group-level approval step** — a simple admin view to review pending store registrations and approve or reject them before they go live to customers.
6. **Home screen (Document 6, Screen 2)** — the store grid, showing only approved stores. This is one of the two highest-priority screens in the whole product; it deserves real design attention here, not a placeholder.
7. **Store pages and product pages** (Document 6, Screens 3–4) — store-specific catalog browsing, each store displaying its own uploaded logo.
8. **Single-store cart and checkout** — Paystack integration, one store per order for now.
9. **Order confirmation and basic tracking** (Document 6, Screens 7–8) — simple status updates (preparing, ready/shipped, delivered).
10. **Store-level admin** — each store's manager can see and manage only their own orders and products (RLS enforced, per Document 5).

**Phase 1 is done when:** all seven founding stores have registered and been approved through the real onboarding flow (not seeded manually), and a real customer can complete a real order from any one of them, with payment going through and the store fulfilling it correctly.

---

## Pre-Launch Sequence (between Phase 1 code and public launch)

Finishing Phase 1's code does NOT mean the public storefront goes live the same day. There's a real-world operational gap to close first: the seven founding stores need to actually register themselves before any customer sees a working "Shop now" experience — and that's a people-and-time step, not a coding step.

1. **Onboard the seven managers personally, before any public announcement.** Walk each store manager through registering their store, uploading their logo, and adding their first products — in person, on a call, or via a simple instructional message with the registration link. This is not automated; it's you (or someone on your team) making sure it actually happens.
2. **Approve each store as it comes in — manually, not automatically.** Use the group-level approval step from Phase 1 to personally review and approve each of the seven as they register. For the founding seven this should be fast (same day, light-touch, since you already trust these businesses), but it's never skipped — this same manual review becomes essential real scrutiny once outside vendors start applying in Phase 4.
3. **Only once all seven are registered and approved does the public "Shop now" experience go live.** Until then, the storefront should not present a broken or empty shopping experience to real visitors.
4. **The public landing page can go live earlier than the storefront, using an "Opening Soon" state.** Show each store's name and logo (as managers upload them) with an "Opening Soon" badge instead of a working "Shop" button, rather than hiding incomplete stores entirely. This turns the onboarding gap into anticipation instead of a visible weakness, and gives Document 7's Growth Strategy something concrete to post about ("Yurmealicious Pizza is joining the Beverly app — coming soon") while onboarding happens quietly in the background.
5. **The vendor registration path ("Register your store") can be live on the landing page from day one**, separate from the "Shop now" path — since that's exactly the link the seven managers need to onboard themselves in step 1.

**This sequence is done when:** all seven stores have flipped from "Opening Soon" to live and shoppable, and the public "Shop now" path is switched on.

---

## Phase 2 — The platform bet (combined cart + the second-store moment)

**Goal:** This is where BGOC stops being "seven separate mini-apps sharing a login" and becomes the actual platform described in the Manifesto. Everything in this phase exists to test Document 6's core risk directly.

Build order:
1. **Combined cart** — items from multiple stores in one cart, grouped visibly by store (per Document 3's rule against hiding store origin).
2. **Parent/child order splitting** — one checkout, one payment, split into per-store orders on the backend (Document 5's `parent_order_id` model).
3. **Paystack subaccounts** — automatic payment splitting to each store's settlement account.
4. **The "second store" suggestion** (Document 6, Screen 5b) — this is the second highest-priority piece of design/build work in the entire roadmap. Even a simple version (rule-based "you might also like [store]" rather than anything AI-driven) is enough to start testing whether people actually discover a second store.
5. **Per-store order tracking within one combined order** — customer sees, clearly, that their pizza is "out for delivery" while their Homeworld item is still "processing."
6. **One clear support contact point** regardless of which store an issue involves (Document 3's rule).

**Phase 2 is done when:** a customer can buy from two different stores in one checkout, and Document 7's key growth metric — percentage of customers trying a second store within their first month — can actually be measured.

---

## Phase 3 — Retention and recurring revenue

**Goal:** Turn working transactions into repeat habit and recurring income, per Document 8's Business Model phases.

Build order:
1. **Beverly Wallet** — prepaid balance usable across all seven stores.
2. **Beverly+ subscription** — one clear tier (free/discounted delivery, early access), per Document 8's guidance to keep it simple at first.
3. **Loyalty points** — earned and redeemable across stores.
4. **Referral system** — supports Document 7's word-of-mouth growth engine.
5. **QR-code-to-app flow refinement** — smooth in-store-to-app conversion (Document 7, Growth Engine 1), since this is the cheapest and strongest acquisition channel available.
6. **Realtime order status polish** — using Supabase Realtime more fully, reducing the "will this actually work" fear from Document 4.

**Phase 3 is done when:** there's a working subscription tier generating recurring revenue, and repeat-order metrics (Document 7's 30/60/90-day tracking) show real habit forming.

---

## Phase 4 — Marketplace expansion (only after Phases 1–3 are solid)

**Goal:** Open applications to businesses outside the founding seven, per Document 1's long-term plan and Document 8's Phase 4 revenue stream. Since the self-service registration flow was already built in Phase 1 (and proven by the founding seven stores), this phase is lighter than it would otherwise be — it's mostly about who's allowed to apply and how visibility/fees work, not building new onboarding infrastructure from scratch. This phase should not start until Document 7's growth metrics and Document 8's Phase 1–3 economics are proven.

Build order:
1. **Open the existing registration flow to outside applicants** — same flow the founding seven used, now available to any qualifying local business.
2. **Verification step for outside applicants** — since founding stores were personally known and trusted, outside applicants need an added verification layer (business legitimacy, product quality checks) before approval, on top of the existing approval-queue mechanism from Phase 1.
3. **Commission logic for third parties** — building on the Paystack subaccount pattern already proven in Phase 1.
4. **Featured placement** — paid visibility for vendors (Document 8's revenue stream 7), only viable once there's real traffic worth paying for.

**Phase 4 is done when:** the first outside vendor is live, selling, and getting paid correctly through the same trust and technical standards the founding seven stores meet.

---

## What NOT to build early (a direct callback to Document 3)

- No AI-driven recommendations or chat support before Phase 3 is solid — Document 5 already flagged these as optional, later layers.
- No opening registration to outside businesses before Phase 4 — the onboarding *mechanism* is core Phase 1 infrastructure, but who's *allowed* to use it stays limited to the founding seven until Phase 1–3 are proven.
- No complex multi-tier subscription ladder — one Beverly+ tier is enough until real usage data says otherwise.
- No custom delivery fleet management system before Phase 2's combined-cart economics are proven — Document 5 flagged shared delivery as a future opportunity, not a Phase 1 requirement.

## A note on using this roadmap with Antigravity

Each phase above can be handed to Antigravity as its own build target — Phase 1's steps are granular enough to become individual implementation tasks. The one instruction worth repeating to Antigravity at the start of every phase: check new work against Document 3's Product Philosophy question before considering a feature "done" — does it make it easier to trust and buy from any Beverly Group store, in one place, without confusion.