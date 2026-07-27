# Document 1 — The Manifesto
### Beverly Group of Companies (BGOC)

## The stores, as they stand today

1. Beverly Exclusive Restaurant
2. Beverly Bakeries and Confectionery
3. Yurmealicious Pizza
4. Homeworld
5. Toys in Candiland
6. Dollnatia
7. Celebrity Styles

Seven stores, seven different names, seven different kinds of products — food, baked goods, pizza, home goods, toys, and fashion — all owned by one person, all held together by one standard. More stores will open later; the app has to be built so adding an eighth or a twelfth store is routine, not a rebuild.

## Why this exists

Right now, these seven stores behave like seven separate businesses that happen to share an owner. A customer who loves Beverly Bakeries and Confectionery has no natural way to discover that the same group also runs Yurmealicious Pizza, or Celebrity Styles, or Toys in Candiland. Every store is on its own — its own word of mouth, its own walk-in traffic, its own struggle to be found.

This app exists to give all seven stores one front door.

It exists so one person, in one app, can walk into Beverly Exclusive Restaurant for dinner, Yurmealicious Pizza for tonight's order, Homeworld for a new blender, Toys in Candiland or Dollnatia for a birthday gift, and Celebrity Styles for an outfit — all without leaving the app, all under one account, one cart, one checkout.

## The problem it truly solves

It's not "we need an app because everyone has an app." The real problem is this: **Beverly Group's seven businesses are stronger together than they are apart, but right now they behave like strangers.**

Trust earned at one store doesn't currently move to the next. A loyal Celebrity Styles customer doesn't automatically know Dollnatia exists. This app fixes that — one platform where discovering a second, third, or fourth Beverly Group store is natural, not accidental.

## What it believes

- **One trusted name should open every door.** Someone who trusts Beverly Bakeries and Confectionery should find it one tap easier to try Yurmealicious Pizza — not have to discover it separately.
- **Buying from multiple stores should feel as easy as buying from one.** One cart, one delivery conversation, one wallet — whether someone is ordering food from Beverly Exclusive Restaurant and a toy from Dollnatia in the same session.
- **A platform is worth more than the sum of its stores.** The app itself — the technology, the customer relationships, the buying data — becomes a real asset that exists independently of any single store's daily sales.
- **Small, real businesses deserve serious technology.** A pizza shop and a fashion store don't usually get an app built like this. Beverly Group's stores will.
- **Trust is the product.** Every store on this platform — Beverly-owned today, or an outside vendor later — has to meet the same bar of reliability, because one bad experience anywhere on the app damages the whole platform, not just one store.

## What it will never become

- **It will never become a place where trust is uneven.** A store on this app — Beverly-owned or a future outside vendor — either meets the standard or it doesn't get a badge that says so. No quiet exceptions.
- **It will never force one checkout experience onto products that don't fit it.** A hot pizza order from Yurmealicious and a sized dress order from Celebrity Styles don't move through the world the same way — the app must respect that difference, not flatten it.
- **It will never let "seven stores in one app" become confusing.** If a customer opens the app and doesn't immediately understand where they are and what they can buy from which store, the manifesto has failed — no matter how many features got built.
- **It will never chase a feature just because a competitor has it.** Every feature exists because it solves something real for a Beverly Group customer or store manager — not because it looks impressive.
- **It will never treat future outside vendors as an afterthought bolted onto a Beverly-only system.** The platform is built from day one to hold both cleanly, so growth later doesn't require rebuilding.

## The one sentence that should guide every decision from here

**"Does this make it easier for someone to trust and buy from any Beverly Group store, in one place, without confusion?"**

If a feature, a screen, or a decision doesn't serve that sentence, it doesn't belong yet — no matter how good the idea sounds on its own.

---

## Confirmed identity

**Name:** Beverly Group of Companies, shortened to **BGOC** for the domain and casual reference. Full name stays on legal/formal touchpoints (app store listing, footer, receipts); "Beverly" or "BGOC" carries everyday conversation.

**Domain direction:** an acronym-based domain (e.g. `bgoc.ng`, `bgoc-group.com`, or `bgocapp.com`) rather than fighting for a taken or premium-priced `bgoc.com` right away.

## Brand foundation (from the existing Beverly Meals and Bakeries logo)

The existing badge — bold red circle, ornate white "B" with a gold outline detail, matching white display serif for "BEVERLY" — is the app's logo and icon in full, not just one store's mark. Every other design decision in this app builds outward from this palette:

| Role | Color | Approx. Hex |
|---|---|---|
| Primary brand red | Bold, warm red — the badge background | `#E9271A` |
| Accent gold | The fine outline detail on the B | `#FBC02D` |
| Core white | Wordmark and lettering | `#FFFFFF` |
| Supporting ink | Near-black, for body text and UI on white backgrounds | `#1A1A1A` |

**Typography (updated): Inter and Roboto Mono.** The earlier "ornate serif wordmark" direction is replaced — Isaac is providing a proper platform logo (icon-based, not the placeholder bakery badge), and the app's font system now runs on **Inter** for all UI text (headings, body copy, buttons, labels, navigation) and **Roboto Mono** for numeric/data elements specifically (prices, order IDs, timestamps, order status codes) — giving the dashboard and checkout areas a precise, professional feel where numbers matter.

**Logo display: icon only, no text.** Both the marketing/landing page and every dashboard show the logo mark alone — no "Beverly Group of Companies" wordmark sitting next to it. The name is carried in page titles, headers, and copy instead, not baked into the logo lockup. (The actual logo file will be supplied separately and dropped into the app's asset folder — Antigravity should treat the logo as a swappable image asset, not something to redesign or add text to.)

## Correction: the B badge is the platform's identity, not every store's identity

Each store carries its own separate logo — but the source differs depending on the store. For the founding stores, Isaac already has (or is sourcing) the real logos and pre-loads them into the platform himself. For any future outside vendor joining later, they upload their own logo as part of registering, since no logo exists for them yet on the platform. Either way, the platform's own logo (icon-only, no text, exact file to be supplied) belongs to the app itself, the same way Jumia's logo doesn't change depending on which seller you're buying from. A store's own logo shows on its store card, its store page, and its products; the platform logo shows on the splash screen, the app icon, the marketing page, and every dashboard header/sidebar.

This means the app's visual system needs to hold two layers cleanly: the platform layer (red, gold, white, the platform's icon-only logo, Inter + Roboto Mono typography) and the store layer (each store's own logo and photography, sitting inside a consistent card/page template so it never feels chaotic even though the logos differ).

## The onboarding model: "claim your store" for founding stores, full registration for future vendors

Founding stores don't fully build their presence from a blank slate — Isaac pre-loads the store's name and logo (since he already has these). The store's manager then **claims their store**: they see their store already listed (with its real logo) on the registration page, click it, create an account tied to it, and fill in the remaining details themselves — description, fulfillment type, and every product with its price. They never need to upload a logo, since it's already there.

A future outside vendor (Phase 4) has no pre-loaded entry — they go through full self-service registration, including uploading their own logo, exactly as originally described below.

Beverly Group of Companies does not manually set up any store's data — not even the seven founding stores. Every store, whether it's one of the original seven or a future outside business, goes through the same self-service process: create an account, upload their own logo, fill in their store details, upload their own products and prices, and get approved before going live. This is core to the platform from day one, not a feature added later for outside vendors — see Document 5 and Document 9 for how this is built.