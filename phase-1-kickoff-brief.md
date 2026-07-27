# BGOC — Phase 1 Kickoff Brief for Antigravity

## Context (from the BGOC Blueprint)

We are building **Beverly Group of Companies (BGOC)** — a multi-store shopping app for seven real, physically co-located stores (all at Pinnacle Mall, Asese):

1. Beverly Exclusive Restaurant (food, instant/same-day)
2. Beverly Bakeries and Confectionery (food, instant/same-day)
3. Yurmealicious Pizza (food, instant/same-day)
4. Homeworld (home goods, shippable)
5. Toys in Candiland (candy/sweets, shippable)
6. Dollnatia (dolls/toys, shippable)
7. Celebrity Styles (fashion, shippable — needs size options)

All seven stores each carry their OWN logo, uploaded by that store when it registers. The Beverly red-badge "B" logo belongs to the app/platform itself (deep red #E9271A, gold accent #FBC02D, white #FFFFFF, near-black #1A1A1A for text) — it appears on the splash screen, app icon, and platform-level moments, not on individual store cards or pages.

**Core onboarding rule:** Beverly Group of Companies does NOT manually set up any store's data — not even these seven. Every store, founding or future, registers itself: create an account, upload their own logo, fill in store details, upload their own products and prices, then submit for approval before going live. **Approval is always manual** — a group-level admin reviews and approves every store, including the founding seven (fast, same-day review for them, since they're already trusted) — never automatic.

**Customer accounts are checkout-first, not a signup wall.** A customer browses and builds a cart with no account needed. At checkout, they enter phone number + delivery address to complete the order, and the app creates their account automatically from that. Returning visits use phone + OTP, not a remembered password.

**Core principle governing every decision:** Does this make it easier for someone to trust and buy from any Beverly Group store, in one place, without confusion? If a feature doesn't serve this, it doesn't get built yet.

**Non-negotiable rules:**
- Never hide which store an item in the cart came from — always show it clearly, even when Phase 1 only supports single-store orders.
- Store data must be isolated via Supabase Row Level Security — a staff member from one store must never be able to query another store's data, even accidentally.
- Don't build features for outside/marketplace vendors yet — this is Phase 1, single-owner-group only.
- Keep the UI simple enough that a first-time user understands it in seconds, without a tutorial.
- Every screen must look modern and professional, never templated or AI-generated — the full standard is in the separate `ai-avoidance-guidelines.md` file. Feed that file to Antigravity in this same session, alongside this brief.

## Stack

- Next.js (App Router)
- Supabase (Postgres + Auth + Row Level Security + Realtime)
- Paystack (payments — subaccounts come in Phase 2, not needed yet)
- Cloudinary (product images)
- Resend (order confirmation emails)
- Vercel (hosting)

## Phase 1 goal

A customer can open the app, browse any of the seven stores, buy from ONE store at a time, pay via Paystack, and receive a real order. Store staff can manage their own store's products and orders. No combined cart across stores yet — that's Phase 2.

## Task 1 — Database foundation (start here)

Build the Supabase schema:

- **`stores`** — id, owner_user_id (FK, the manager who registered it), name, slug, category (food/fashion/toys/home), description (short, one-line), logo_url (uploaded by the store itself, NOT the shared Beverly badge), fulfillment_type (instant / shippable), approval_status (pending/approved/suspended), created_at.
- **`products`** — id, store_id (FK), name, description, price, image_url, stock_quantity (nullable for made-to-order food items), size_options (nullable JSON, used by stores like Celebrity Styles), created_at.
- **`users`** — handled by Supabase Auth, extended with a `profiles` table: id (FK to auth.users), full_name, phone, default_address, role (customer/store_manager/group_admin), created_at.
- **`orders`** — id, user_id (FK), store_id (FK), status (pending/preparing/ready/out_for_delivery/delivered/cancelled — adjust naming per fulfillment_type), total_amount, delivery_address, paystack_reference, created_at, updated_at.
- **`order_items`** — id, order_id (FK), product_id (FK), quantity, size_selected (nullable), unit_price.

Apply Row Level Security:
- Customers can only read/write their own `orders` and `order_items`.
- Store managers can only read/write `products` and `orders` belonging to stores where they are the `owner_user_id`.
- A group-level admin role can read/write everything, and is the only role that can change a store's `approval_status`.

Do NOT seed the seven stores manually — they should go through the same registration flow being built in Task 2. This task is schema only.

**Once this is done, stop and confirm the schema with me before building the registration flow, auth, or any screens.**