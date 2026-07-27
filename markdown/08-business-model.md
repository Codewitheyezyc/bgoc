# Document 8 — Business Model
### Beverly Group of Companies (BGOC)

## How it makes money

BGOC earns from two directions at once: the seven owned stores selling through the app, and — per the Manifesto's long-term plan — outside vendors joining the platform later. Early on, revenue comes almost entirely from the first; the second becomes real once the platform proves itself.

### 1. Commission on sales (primary, from day one)

A small percentage taken on every order that passes through the app, across all seven stores. Since these are Isaac's own stores, this isn't "commission" in the traditional marketplace sense (taking a cut from someone else's business) — it's really the app functioning as the sales channel for the group, with the platform's share funding its own growth and maintenance. When outside vendors join later, this becomes true commission revenue in the traditional sense.

### 2. Delivery fee (separate from commission)

A flat or distance-based fee charged per delivery, kept distinct from the store's own product pricing. This funds the shared delivery structure flagged in Document 5 (one fleet serving all seven stores from one Pinnacle Mall location) and gives you a lever to adjust independent of product pricing.

### 3. Beverly+ subscription (recurring revenue, not order-dependent)

A monthly or annual membership offering free/discounted delivery, early access to new products or drops (especially relevant for Celebrity Styles and seasonal toy stock at Dollnatia/Toys in Candiland), and small perks across all seven stores. This is the answer to "how do we earn even when someone doesn't buy that month" — a subscriber pays whether or not they order in a given week, the same logic Cognara uses with its Pro tier.

### 4. Beverly Wallet (prepaid credit + float)

Customers can top up an in-app wallet balance to pay across any of the seven stores. Two revenue angles: unspent balances sitting in the wallet function like float (small interest/liquidity benefit), and a portion of gift-card-style purchases (buying wallet credit as a gift for someone else) typically goes unredeemed or partially redeemed — a normal, ethical revenue pattern used by most wallet/gift-card systems.

### 5. Loyalty points funded by "breakage"

Points earned on purchases, redeemable across stores. As with most loyalty programs, a portion of earned points naturally goes unredeemed (people forget, or the points expire) — this "breakage" is standard industry economics, not a trick, and doesn't need to be a large percentage of revenue to matter over time.

### 6. Future: marketplace commission from outside vendors

Once the seven-store experience is proven (strong second-store adoption, reliable delivery, real repeat usage — per Document 7's metrics), opening to outside Pinnacle Mall or Asese-area vendors turns BGOC into a genuine local marketplace, each paying commission and/or a featured-placement fee to be listed. This is a **later** revenue stream, not a day-one one — Document 3's Product Philosophy already ruled out building for this before the core seven-store experience works.

### 7. Future: featured placement / internal promotion

Once there are enough products and (eventually) enough vendors, stores could pay a small fee for better placement on the home screen or in search — similar to how Jumia or Amazon monetizes visibility. Not viable with only seven owned stores (you wouldn't charge yourself), but a real stream once outside vendors exist.

## Pricing tiers (what a customer actually pays for)

| Tier | What it includes | Who it's for |
|---|---|---|
| **Free / Pay-per-order** | Normal delivery fees, standard pricing, no subscription | Everyone by default |
| **Beverly+ (subscription)** | Free or discounted delivery, early access to new stock/drops, small loyalty bonus | Frequent shoppers across multiple stores — the people already in Document 4's "Habit" stage |

*(A single mid-tier subscription is enough to start — no need for a complex multi-tier ladder like Cognara's, since this app sells physical goods with delivery costs, not digital content with near-zero marginal cost. Keep it simple until real usage data suggests otherwise.)*

## Unit economics — what needs to be true

Since Isaac owns all seven stores, unit economics here are less about "can we survive on commission from strangers" and more about **the delivery fee and operational cost per order** — because that's the actual new cost the app introduces (previously, in-store customers picked up their own orders or arranged delivery informally).

Key numbers worth tracking once live:
- Average delivery cost per order vs. delivery fee charged (must not run at a loss per delivery)
- Cost of Paystack transaction fees vs. margin per order
- Server/infrastructure cost (Supabase, Vercel, Cloudinary) relative to order volume — likely negligible at first, worth monitoring as usage scales

## Revenue milestones (realistic, phased)

1. **Phase 1 — Prove the model**: get all seven stores live, get real order volume, confirm delivery economics work (fee covers cost). Revenue here funds itself; the goal is proof, not profit yet.
2. **Phase 2 — Beverly+ launch**: once there's a base of repeat customers (per Document 7's 30/60/90-day repeat metrics), introduce the subscription tier as recurring revenue.
3. **Phase 3 — Wallet and loyalty maturity**: once enough customers are using the app regularly, wallet top-ups and loyalty points become a meaningful, low-effort revenue layer.
4. **Phase 4 — Marketplace expansion**: only once Phases 1–3 are solid, open to outside vendors — turning BGOC from "one group's app" into a real local marketplace with commission and placement revenue from others.

## What this model deliberately avoids

- **No ad-supported model.** Ads inside a shopping app tend to feel like clutter and work against the "trusted, personal" tone from Document 2's Positioning.
- **No pay-to-play for the seven core stores.** They don't compete with each other for placement — all seven are equally represented, per Document 1's Manifesto ("no store gets left behind"). Paid placement only becomes relevant once outside vendors exist.
- **No complicated tiered subscription ladder at launch.** One clear Beverly+ tier is enough until real data says otherwise.
