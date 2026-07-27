# Document 6 — User Journey
### Beverly Group of Companies (BGOC)

This document walks through the actual screens, in order, from someone hearing about the app to receiving their first order — and then the second, more important journey: discovering a second store. Document 4 named the five emotional stages; this document puts real screens under each one.

## Screen 1 — Splash / App Open

**What they see:** The red-and-gold Beverly badge, briefly, then straight into the home screen. No lengthy onboarding tour, no "let's set up your profile" wall before they've seen anything real.

**What they feel:** Recognition — "oh, that's the Beverly logo I already know."

**Decision point:** None yet. This screen's only job is speed and recognition, not decisions.

## Screen 2 — Home (the store grid)

**What they see:** Seven store cards (Beverly Exclusive Restaurant, Beverly Bakeries and Confectionery, Yurmealicious Pizza, Homeworld, Toys in Candiland, Dollnatia, Celebrity Styles), each with its logo/name, one line describing what it sells, and a small badge (e.g. "Official Beverly Store"). Above or alongside: maybe a short banner naming the group ("Beverly Group of Companies — everything, one app").

**What they feel:** "Okay, I get it now — one app, several real stores I can recognize." This is the moment Document 4 called the make-or-break "first open" stage.

**Decision point:** Which store to tap into first — almost always the one they came for (e.g. they heard about the app through Yurmealicious Pizza, so they tap that one first).

*(This screen benefits most from real store briefs — the one-line description under each store card needs to be accurate and appealing, not generic. Worth revisiting once those are ready.)*

## Screen 3 — Store page

**What they see:** That store's own catalog — menu items for Yurmealicious Pizza, dresses for Celebrity Styles, dolls and toys for Dollnatia, etc. Store-specific details show here: for food stores, prep time; for Celebrity Styles, size options; for Homeworld, stock availability.

**What they feel:** Focused — they're now just shopping, the way they would on any single store's page, without needing to think about the rest of the platform.

**Decision point:** What to add to cart. Also, subtly, whether to keep browsing this store or head back to explore another.

## Screen 4 — Product detail (if needed)

**What they see:** Photos, price, size/quantity options where relevant, and an "Add to cart" button. Kept simple — Document 3's rule that no feature should need a tutorial applies directly here.

**What they feel:** Confidence in the specific item, assuming photos and details are clear.

**Decision point:** Add to cart, or go back and compare with something else in the same store.

## Screen 5 — Cart

**What they see:** Items grouped visibly by store (per Document 3's rule against hiding store origin) — even if, at this point, everything in the cart is from one store. Clear per-store subtotal, plus a combined total.

**What they feel:** In control — they can see exactly what they're buying and from where.

**Decision point:** Check out now, or go back to add something else — possibly from a different store, which is the bridge to Screen 5b below.

## Screen 5b — The "second store" moment (critical)

**What they see:** Somewhere near the cart or right after adding an item — a soft, non-pushy suggestion: "You might also like Homeworld" or "Dollnatia has new arrivals" — framed as a shopkeeper's suggestion, not an ad banner (per Document 4's guidance).

**What they feel:** Pleasant surprise — "oh, I didn't know they had that too."

**Decision point:** Tap through to browse another store (adds to the same cart, same checkout later) or ignore and proceed. This single decision point is the one Document 4 flagged as the whole platform bet — if this never gets used, BGOC is just seven separate mini-apps.

## Screen 6 — Checkout

**What they see:** One flow — delivery address (saved from last time, if returning), payment method (saved card or Paystack options), and a final review showing the order broken down by store, each with its own expected timing (e.g. "Yurmealicious Pizza — ready in 25 minutes" / "Homeworld — delivered in 2 days").

**What they feel:** This is where Document 4's fears are loudest — "will this actually work, is my money safe." Every bit of clarity here (secure payment badge, clear confirmation, no surprise fees) directly reduces that fear.

**Decision point:** Confirm and pay — one payment, split automatically to each store via Paystack subaccounts (per Document 5).

## Screen 7 — Order confirmation

**What they see:** A simple, warm confirmation — "Your order is confirmed" — broken into per-store status if it's a multi-store order, so it's clear that Yurmealicious's part and Homeworld's part are tracked separately.

**What they feel:** Relief and reassurance — the transaction went through, and they know what happens next.

**Decision point:** None required — but this is a natural moment to gently remind them they can track everything from one "My Orders" screen.

## Screen 8 — Order tracking

**What they see:** Live status per store-order (preparing, out for delivery, delivered — or for shippable items, processing, shipped, delivered), using Supabase Realtime.

**What they feel:** Ongoing trust, especially for first-time users still testing whether the app "actually works" (Document 4, Stage 3).

**Decision point:** If something looks wrong, they need one clear, unmissable way to reach support — regardless of which store the issue involves (per Document 3's rule against bouncing customers between "store issue" and "app issue").

## Screen 9 — Post-delivery / repeat visit

**What they see:** On their next open, the app remembers them — saved address, past orders visible, and now, if they browsed a second store before, that store shows up more prominently ("Welcome back — check out what's new at Celebrity Styles").

**What they feel:** Recognized, not just processed — the "known customer, not a number" motivation named in Document 4.

**Decision point:** This is where habit (Document 4, Stage 5) either starts forming or doesn't — repeat use depends entirely on whether the first cycle above (Screens 1–8) worked smoothly enough to trust doing it again.

---

## The one thing this journey depends on

Every stage above assumes Screens 2 and 5b work well — the store grid making all seven stores instantly legible, and the second-store suggestion feeling helpful rather than pushy. If either of those two moments fails, the rest of the journey still works fine, but BGOC quietly becomes seven apps sharing one login instead of one real platform. Worth treating those two screens as the highest-priority design work in the whole build.
